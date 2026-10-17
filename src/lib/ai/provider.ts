/**
 * Provider adapter (T-04/T-05).
 *
 * Single OpenAI-compatible streaming client (native `fetch`, zero deps)
 * plus a `getProvider()` factory keyed by `NEXT_PUBLIC_AI_PROVIDER`
 * (design decision #2: env-swappable adapter). Groq is the default
 * free-tier provider (30 RPM / 1K RPD / 8K TPM — no card required).
 *
 * Rate-limit budget: gpt-oss spends reasoning tokens out of
 * `max_completion_tokens`, so Groq runs with `reasoning_effort: "low"` by
 * default (this is a portfolio Q&A, not a maths benchmark). A 429 carries
 * Groq's `retry-after`, surfaced as `ProviderError.retryAfterMs` so the
 * route can decide whether the wait is worth a retry.
 *
 * The generator's terminal value is the upstream `finish_reason`: the route
 * cannot tell a finished answer from one truncated at `max_completion_tokens`
 * without it, and a silently cut answer used to be delivered as complete.
 */

export type AIRole = "system" | "user" | "assistant";

export interface IProviderMessage {
  role: AIRole;
  content: string;
}

export interface IStreamRequest {
  system: string;
  messages: IProviderMessage[];
  maxTokens: number;
  signal: AbortSignal;
}

/**
 * Terminal state of a streamed completion, taken from the closing chunk's
 * `choices[0].finish_reason`. The route needs it to tell a finished answer
 * from one the provider cut off at `max_completion_tokens`.
 */
export interface IStreamFinish {
  /** Raw upstream reason (`"stop"`, `"length"`, ...), or `null` when the stream ended without naming one. */
  reason: string | null;
}

/** `finish_reason` that means the completion ran into `max_completion_tokens`. */
export const TRUNCATED_FINISH_REASON = "length";

/** Shortest repeated run, in characters, that is treated as a seam. */
const SEAM_MIN_OVERLAP_CHARS = 16;
/** How far back, in words, the seam search walks into the partial answer. */
const SEAM_MAX_OVERLAP_WORDS = 60;

/**
 * Drop the part of a continuation that repeats the tail of the partial answer.
 *
 * A provider asked to resume a truncated answer tends to re-emit the words
 * around the cut, so appending the continuation verbatim produces seams like
 * `…bases de datos ligeras parabases de datos ligeras para…`. Matching is
 * word-aligned and requires at least `SEAM_MIN_OVERLAP_CHARS` repeated
 * characters, so an ordinary repeated word at the boundary survives as
 * content instead of being silently deleted.
 *
 * The remainder is cut from the original string, so its bytes, newlines and
 * Markdown survive exactly as the provider sent them.
 */
export function trimSeamOverlap(partial: string, continuation: string): string {
  if (!partial || !continuation) return continuation;

  const partialWords = partial.split(/\s+/).filter(Boolean);
  const continuationWords = continuation.split(/\s+/).filter(Boolean);
  const maxWords = Math.min(
    SEAM_MAX_OVERLAP_WORDS,
    partialWords.length,
    continuationWords.length
  );

  // Longest first: the maximal repeat is the duplication, not a shorter run inside it.
  for (let words = maxWords; words >= 1; words -= 1) {
    const tail = partialWords.slice(-words).join(" ");
    if (tail !== continuationWords.slice(0, words).join(" ")) continue;

    // Every shorter run is shorter still, so nothing here is a seam.
    if (tail.length < SEAM_MIN_OVERLAP_CHARS) return continuation;

    // Everything after the repeated words is returned verbatim, separator
    // included, so the caller can append the result directly to the partial:
    // the seam's own space, newline or pipe alignment survives untouched.
    return continuation.replace(new RegExp(`^(?:\\s*\\S+){${words}}`), "");
  }

  return continuation;
}

export interface IProviderAdapter {
  /** Yield text deltas and return the terminal finish reason when the stream ends. */
  streamChat(request: IStreamRequest): AsyncGenerator<string, IStreamFinish>;
}

export class ProviderError extends Error {
  /** Upstream HTTP status when available (429 → rate-limit mapping). */
  readonly status?: number;
  /** Upstream `retry-after`, in milliseconds, when the provider sent one. */
  readonly retryAfterMs?: number;

  constructor(message: string, status?: number, retryAfterMs?: number) {
    super(message);
    this.name = "ProviderError";
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

/**
 * Parse an HTTP `retry-after` header (seconds or HTTP-date) into
 * milliseconds. Returns `undefined` when the header is missing or
 * unparseable, and never a negative delay.
 */
export function parseRetryAfter(value: string | null): number | undefined {
  if (value === null) return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;

  if (/^\d+(?:\.\d+)?$/.test(trimmed)) {
    return Math.max(0, Math.round(Number(trimmed) * 1000));
  }
  const date = Date.parse(trimmed);
  if (Number.isNaN(date)) return undefined;
  return Math.max(0, date - Date.now());
}

interface IProviderConfig {
  baseUrl: string;
  defaultModel: string;
  /** Sent as `reasoning_effort` unless `AI_REASONING_EFFORT` overrides it. */
  reasoningEffort?: string;
}

const PROVIDERS: Record<string, IProviderConfig> = {
  groq: {
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "openai/gpt-oss-120b",
    // gpt-oss defaults to "medium"; the KB answers need almost none of it,
    // and reasoning tokens are billed against the same free-tier budget.
    reasoningEffort: "low",
  },
  cerebras: {
    baseUrl: "https://api.cerebras.ai/v1",
    defaultModel: "qwen-3-32b",
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
  },
};

/** Values `reasoning_effort` accepts on gpt-oss; anything else is dropped. */
const SUPPORTED_REASONING_EFFORT = new Set(["low", "medium", "high"]);

function resolveReasoningEffort(config: IProviderConfig): string | undefined {
  const raw = (
    process.env.AI_REASONING_EFFORT ??
    config.reasoningEffort ??
    ""
  ).toLowerCase();
  return SUPPORTED_REASONING_EFFORT.has(raw) ? raw : undefined;
}

interface ICompletionChunk {
  choices?: Array<{
    delta?: { content?: string };
    finish_reason?: string | null;
  }>;
}

interface IParsedChunk {
  delta: string | null;
  finishReason: string | null;
}

/** Parse one `data:` SSE line from an OpenAI-compatible stream. */
function parseChunk(payload: string): IParsedChunk | null {
  if (payload === "[DONE]") return null;
  try {
    const chunk: ICompletionChunk = JSON.parse(payload);
    const choice = chunk?.choices?.[0];
    const delta = choice?.delta?.content;
    const finishReason = choice?.finish_reason;
    return {
      delta: typeof delta === "string" && delta.length > 0 ? delta : null,
      finishReason:
        typeof finishReason === "string" && finishReason.length > 0
          ? finishReason
          : null,
    };
  } catch {
    return null;
  }
}

async function* streamChat(
  config: IProviderConfig,
  request: IStreamRequest
): AsyncGenerator<string, IStreamFinish> {
  const apiKey = process.env.AI_PROVIDER_API_KEY;
  if (!apiKey) {
    throw new ProviderError("AI_PROVIDER_API_KEY is not configured", 503);
  }
  const model = process.env.AI_MODEL || config.defaultModel;
  // Optional override for proxies/mocks; defaults to the provider URL.
  const baseUrl = process.env.AI_PROVIDER_BASE_URL || config.baseUrl;
  const reasoningEffort = resolveReasoningEffort(config);

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: request.system },
        ...request.messages,
      ],
      max_completion_tokens: request.maxTokens,
      temperature: 0.4,
      stream: true,
      ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
    }),
    signal: request.signal,
  }).catch((error: unknown) => {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ProviderError(
      `Provider unreachable: ${
        error instanceof Error ? error.message : "network error"
      }`
    );
  });

  if (!response.ok) {
    // Consume the body so the socket is released, then fail with status and
    // the upstream retry hint (when it sent one).
    await response.text().catch(() => "");
    throw new ProviderError(
      `Provider responded with ${response.status}`,
      response.status,
      parseRetryAfter(response.headers.get("retry-after"))
    );
  }
  if (!response.body) {
    throw new ProviderError("Provider returned an empty body", 502);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finish: IStreamFinish = { reason: null };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newline = buffer.indexOf("\n");
      while (newline !== -1) {
        const line = buffer.slice(0, newline).replace(/\r$/, "");
        buffer = buffer.slice(newline + 1);

        if (line.startsWith("data:")) {
          const chunk = parseChunk(line.slice(5).trim());
          if (chunk) {
            if (chunk.delta) yield chunk.delta;
            if (chunk.finishReason) finish = { reason: chunk.finishReason };
          }
        }
        newline = buffer.indexOf("\n");
      }
    }
  } finally {
    reader.releaseLock();
  }

  return finish;
}

/**
 * Resolve the adapter from `NEXT_PUBLIC_AI_PROVIDER` (default `groq`).
 * Throws `ProviderError` for unknown keys so the route can answer 503.
 */
export function getProvider(): IProviderAdapter {
  const key = (process.env.NEXT_PUBLIC_AI_PROVIDER || "groq").toLowerCase();
  const config = PROVIDERS[key];
  if (!config) {
    throw new ProviderError(`Unknown AI provider "${key}"`, 503);
  }
  return {
    streamChat: (request: IStreamRequest) => streamChat(config, request),
  };
}
