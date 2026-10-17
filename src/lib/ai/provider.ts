/**
 * Provider adapter (T-04/T-05).
 *
 * Single OpenAI-compatible streaming client (native `fetch`, zero deps)
 * plus a `getProvider()` factory keyed by `NEXT_PUBLIC_AI_PROVIDER`
 * (design decision #2: env-swappable adapter). Groq is the default
 * free-tier provider (30 RPM / 1K RPD / 8K TPM — no card required).
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

export interface IProviderAdapter {
  /** Yield text deltas from a streaming chat completion. */
  streamChat(request: IStreamRequest): AsyncGenerator<string>;
}

export class ProviderError extends Error {
  /** Upstream HTTP status when available (429 → rate-limit mapping). */
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ProviderError";
    this.status = status;
  }
}

interface IProviderConfig {
  baseUrl: string;
  defaultModel: string;
}

const PROVIDERS: Record<string, IProviderConfig> = {
  groq: {
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "openai/gpt-oss-120b",
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

interface ICompletionChunk {
  choices?: Array<{ delta?: { content?: string } }>;
}

/** Parse one `data:` SSE line from an OpenAI-compatible stream. */
function parseDelta(payload: string): string | null {
  if (payload === "[DONE]") return null;
  try {
    const chunk: ICompletionChunk = JSON.parse(payload);
    const delta = chunk?.choices?.[0]?.delta?.content;
    return typeof delta === "string" && delta.length > 0 ? delta : null;
  } catch {
    return null;
  }
}

async function* streamChat(
  config: IProviderConfig,
  request: IStreamRequest
): AsyncGenerator<string> {
  const apiKey = process.env.AI_PROVIDER_API_KEY;
  if (!apiKey) {
    throw new ProviderError("AI_PROVIDER_API_KEY is not configured", 503);
  }
  const model = process.env.AI_MODEL || config.defaultModel;
  // Optional override for proxies/mocks; defaults to the provider URL.
  const baseUrl = process.env.AI_PROVIDER_BASE_URL || config.baseUrl;

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
    // Consume the body so the socket is released, then fail with status.
    await response.text().catch(() => "");
    throw new ProviderError(
      `Provider responded with ${response.status}`,
      response.status
    );
  }
  if (!response.body) {
    throw new ProviderError("Provider returned an empty body", 502);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

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
          const delta = parseDelta(line.slice(5).trim());
          if (delta) yield delta;
        }
        newline = buffer.indexOf("\n");
      }
    }
  } finally {
    reader.releaseLock();
  }
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
