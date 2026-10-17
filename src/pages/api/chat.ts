import type { NextApiRequest, NextApiResponse } from "next";
import { readCachedAnswer, writeCachedAnswer } from "@/lib/ai/answerCache";
import { getClientIp, hashIp } from "@/lib/ai/clientIp";
import { validateResponse } from "@/lib/ai/guardrails";
import { getKnowledgeBase, selectKnowledge } from "@/lib/ai/knowledge";
import {
  buildSystemPrompt,
  trimHistory,
  CONTINUATION_INSTRUCTION,
  GUARDRAIL_EN,
  GUARDRAIL_ES,
  type IPromptMessage,
  type ILanguage,
} from "@/lib/ai/prompt";
import { checkRateLimit } from "@/lib/ai/rateLimit";
import {
  getProvider,
  ProviderError,
  trimSeamOverlap,
  TRUNCATED_FINISH_REASON,
  type IStreamFinish,
  type IProviderAdapter,
  type IStreamRequest,
} from "@/lib/ai/provider";

/**
 * POST /api/chat — SSE streaming chat endpoint (T-06 / FR-11..16).
 *
 * Pre-stream failures return real JSON status codes (400/429/503);
 * once the stream is open, failures are delivered as in-band `error`
 * events so the widget can show a retry banner (E-01).
 * Guardrail gate: deltas are buffered after `writeHead` and validated
 * before any of them reaches the client; violations never stream.
 *
 * A completion the provider cut off at `max_completion_tokens` is continued
 * (see `AI_CONTINUATIONS_MAX`), so a small cap is not a quality ceiling; a
 * truncation that survives the budget is reported instead of being silently
 * delivered as a finished answer.
 */

const MAX_MESSAGE_CHARS = 2000;

/**
 * Free-tier token budget (Groq gpt-oss: 30 RPM / 1K RPD / 8K TPM / 200K TPD
 * per organisation, cached tokens excluded). Every request pays for the
 * system prompt, the retrieved KB, the history, and the completion, because
 * gpt-oss spends reasoning tokens inside the same cap.
 *
 * It has to sit above the natural answer length: at 480 a measured answer came
 * back with `finish_reason: "length"` at exactly 480 completion tokens, and
 * measured completions run 313-536, so 480 sat inside the distribution. 1000
 * covers that with margin, and `AI_CONTINUATIONS_MAX` covers the tail.
 *
 * How the cap is accounted against the TPM window is NOT established — a probe
 * with `cap 700` reported 619 window tokens for actual usage of 102, matching
 * neither the declared cap nor the real usage. Do not size it from a cost
 * model: size it from the answer-length distribution, because a continuation
 * re-sends the whole prompt and costs far more than a larger cap.
 */
const DEFAULT_MAX_COMPLETION_TOKENS = 1000;
/** Mirrors `selectKnowledge`'s own fallback (AI_MAX_KB_TOKENS). */
const DEFAULT_MAX_KB_TOKENS = 2500;
/** Longest upstream `retry-after` worth waiting for before failing fast. */
const DEFAULT_RETRY_MAX_WAIT_MS = 6000;
/**
 * Extra upstream calls allowed when an answer hits the completion cap. `0`
 * disables the recovery and lets the route report the truncation instead.
 */
const DEFAULT_MAX_CONTINUATIONS = 1;
/** Client-facing `Retry-After` when the provider sent no usable hint. */
const UPSTREAM_RATE_LIMIT_FALLBACK_SECONDS = 30;

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

type IErrorCode = "rate_limit" | "provider" | "invalid" | "truncated";

type IChatEvent =
  | { type: "delta"; delta: string }
  | { type: "done" }
  | { type: "error"; code: IErrorCode; message: string };

interface IChatRequestBody {
  message?: unknown;
  history?: unknown;
  language?: unknown;
}

function normalizeLanguage(value: unknown): ILanguage | undefined {
  return value === "es" || value === "en" ? value : undefined;
}

function normalizeHistory(value: unknown): IPromptMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (entry): entry is IPromptMessage =>
        !!entry &&
        typeof entry === "object" &&
        (entry.role === "user" || entry.role === "assistant") &&
        typeof entry.content === "string"
    )
    .map((entry) => ({ role: entry.role, content: entry.content }));
}

type FlushableResponse = NextApiResponse & { flush?: () => void };

function flush(res: FlushableResponse): void {
  res.flush?.();
}

function writeEvent(res: FlushableResponse, event: IChatEvent): void {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
  flush(res);
}

function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

/** Like `readPositiveInt`, but `0` is valid — the kill valve for the knobs. */
function readNonNegativeInt(
  value: string | undefined,
  fallback: number
): number {
  if (value === undefined || value.trim() === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
}

/** Abortable wait: a client that closes mid-retry releases the handler. */
function sleep(ms: number, signal: AbortSignal): Promise<void> {
  if (ms <= 0 || signal.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const onAbort = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

interface IOpenedStream {
  iterator: AsyncGenerator<string, IStreamFinish>;
  first: IteratorResult<string, IStreamFinish>;
}

type TOpenOutcome =
  | ({ status: "open" } & IOpenedStream)
  | { status: "aborted" }
  | { status: "error"; error: ProviderError };

/**
 * Open the upstream stream, or recover from a transient 429 by waiting for
 * the window the provider named. One retry, only before the stream opens and
 * only when the wait is short enough to be worth it, so a client never sees a
 * half-written answer and a daily limit never turns into a long hang.
 */
async function openStream(
  provider: IProviderAdapter,
  request: IStreamRequest,
  retryMaxWaitMs: number,
  ip: string
): Promise<TOpenOutcome> {
  let retried = false;
  for (;;) {
    try {
      const iterator = provider.streamChat(request);
      const first = await iterator.next();
      return { status: "open", iterator, first };
    } catch (error) {
      if (request.signal.aborted) return { status: "aborted" };

      const providerError =
        error instanceof ProviderError ? error : new ProviderError("unknown");
      const waitMs =
        providerError.status === 429 ? providerError.retryAfterMs : undefined;

      if (!retried && waitMs !== undefined && waitMs <= retryMaxWaitMs) {
        retried = true;
        console.info("[chat] retrying after upstream 429:", {
          waitMs,
          ipHash: hashIp(ip),
        });
        await sleep(waitMs, request.signal);
        if (request.signal.aborted) return { status: "aborted" };
        continue;
      }

      return { status: "error", error: providerError };
    }
  }
}

/**
 * Split one generator step into its delta or its terminal value.
 *
 * `IteratorResult` does not narrow into its yield and return members — its
 * `done` is optional on the yield side — so the two casts below are the typed
 * seam between them.
 */
function splitStep(step: IteratorResult<string, IStreamFinish>): {
  delta: string | null;
  finish: IStreamFinish | null;
} {
  return step.done
    ? {
        delta: null,
        finish: (step.value as IStreamFinish) ?? { reason: null },
      }
    : { delta: step.value as string, finish: null };
}

/**
 * Drain one open provider stream into `buffer` and return its finish reason.
 *
 * Buffering is deliberate: text cannot be retracted once written, so the
 * route holds every delta until the whole answer (continuations included)
 * has been validated.
 */
async function drainInto(
  opened: IOpenedStream,
  buffer: string[]
): Promise<IStreamFinish> {
  const head = splitStep(opened.first);
  if (head.delta) buffer.push(head.delta);

  for (;;) {
    const step = splitStep(await opened.iterator.next());
    if (step.finish) return step.finish;
    if (step.delta) buffer.push(step.delta);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const body: IChatRequestBody =
    typeof req.body === "object" && req.body !== null ? req.body : {};
  const { message, language } = body;

  if (typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({
      error: "empty_message",
      message: "Message must not be empty.",
    });
    return;
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    res.status(400).json({
      error: "message_too_long",
      message: `Message must be at most ${MAX_MESSAGE_CHARS} characters.`,
    });
    return;
  }

  const ip = getClientIp(req);
  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    // One structured log per HTTP 429 (R5): reason + hashed IP only —
    // never the raw IP and never message text.
    console.info("[chat] rate limited:", {
      reason: rate.reason ?? "minute",
      ipHash: hashIp(ip),
      retryAfter: rate.retryAfter,
    });
    res.setHeader("Retry-After", String(rate.retryAfter));
    res.status(429).json({
      error: "rate_limit",
      message: "Please wait a moment before sending another message.",
      retryAfter: rate.retryAfter,
    });
    return;
  }

  const maxKbTokens = readPositiveInt(
    process.env.AI_MAX_KB_TOKENS,
    DEFAULT_MAX_KB_TOKENS
  );
  const guardrailLanguage: ILanguage = normalizeLanguage(language) ?? "es";
  let system: string;
  try {
    getKnowledgeBase(); // throws when the KB file is missing (→ 503)
    const selection = selectKnowledge(message, maxKbTokens);
    system = buildSystemPrompt({
      selection,
      language: normalizeLanguage(language),
    });
  } catch (error) {
    console.error("[chat] knowledge base unavailable:", error);
    res.status(503).json({
      error: "knowledge_unavailable",
      message: "The assistant is temporarily unavailable.",
    });
    return;
  }

  const history = trimHistory(normalizeHistory(body.history));
  const providerMessages = [
    ...history,
    { role: "user" as const, content: message },
  ];

  // Answer cache: only a conversation-opening question is replayable. A
  // follow-up depends on the turns before it, so it always hits the provider.
  if (history.length === 0) {
    const cached = readCachedAnswer(message, guardrailLanguage);
    if (
      cached !== null &&
      validateResponse(cached, { language: guardrailLanguage }).ok
    ) {
      console.info("[chat] answer cache hit:", {
        chars: cached.length,
        ipHash: hashIp(ip),
      });
      res.writeHead(200, SSE_HEADERS);
      const cachedStream = res as FlushableResponse;
      writeEvent(cachedStream, { type: "delta", delta: cached });
      writeEvent(cachedStream, { type: "done" });
      res.end();
      return;
    }
  }

  const controller = new AbortController();
  let finished = false;
  res.on("close", () => {
    if (!finished) controller.abort();
  });

  let provider: IProviderAdapter;
  try {
    provider = getProvider();
  } catch (error) {
    const providerError =
      error instanceof ProviderError ? error : new ProviderError("unknown");
    console.error(
      "[chat] provider configuration error:",
      providerError.message
    );
    res.status(providerError.status ?? 503).json({
      error: "provider_unavailable",
      message: "The assistant is temporarily unavailable.",
    });
    return;
  }

  const streamRequest: IStreamRequest = {
    system,
    messages: providerMessages,
    maxTokens: readPositiveInt(
      process.env.AI_MAX_COMPLETION_TOKENS,
      DEFAULT_MAX_COMPLETION_TOKENS
    ),
    signal: controller.signal,
  };

  // Pull the first delta before opening the stream so upstream failures
  // (429/5xx) still map to real HTTP status codes (FR-15/FR-16).
  const retryMaxWaitMs = readNonNegativeInt(
    process.env.AI_RETRY_MAX_WAIT_MS,
    DEFAULT_RETRY_MAX_WAIT_MS
  );
  const opened = await openStream(provider, streamRequest, retryMaxWaitMs, ip);

  if (opened.status === "aborted") {
    res.status(499).end();
    return;
  }
  if (opened.status === "error") {
    const providerError = opened.error;
    console.error("[chat] provider request failed:", providerError.message);
    if (providerError.status === 429) {
      const retryAfter =
        providerError.retryAfterMs !== undefined
          ? Math.max(1, Math.ceil(providerError.retryAfterMs / 1000))
          : UPSTREAM_RATE_LIMIT_FALLBACK_SECONDS;
      console.info("[chat] rate limited:", {
        reason: "upstream",
        ipHash: hashIp(ip),
        retryAfter,
      });
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({
        error: "rate_limit",
        message: "Please wait a moment before sending another message.",
      });
      return;
    }
    res.status(503).json({
      error: "provider_unavailable",
      message: "The assistant is temporarily unavailable.",
    });
    return;
  }

  const maxContinuations = readNonNegativeInt(
    process.env.AI_CONTINUATIONS_MAX,
    DEFAULT_MAX_CONTINUATIONS
  );

  res.writeHead(200, SSE_HEADERS);
  const stream = res as FlushableResponse;

  try {
    // Buffer-then-validate-then-emit: text cannot be retracted once
    // written, so nothing reaches the client before validation passes.
    const buffer: string[] = [];
    let finish = await drainInto(opened, buffer);
    let continuations = 0;
    let truncated = false;
    let seamTrims = 0;

    // `finish_reason: "length"` means the provider stopped at the cap, not
    // that the answer ended. Resume it rather than deliver half an answer
    // that looks complete.
    while (finish.reason === TRUNCATED_FINISH_REASON) {
      if (continuations >= maxContinuations) {
        truncated = true;
        break;
      }
      continuations += 1;

      const next = await openStream(
        provider,
        {
          ...streamRequest,
          messages: [
            ...providerMessages,
            { role: "assistant", content: buffer.join("") },
            { role: "user", content: CONTINUATION_INSTRUCTION },
          ],
        },
        retryMaxWaitMs,
        ip
      );

      if (next.status !== "open") {
        // A failed continuation still leaves the visitor with the partial
        // answer, which is more than an error alone would give them.
        truncated = true;
        if (next.status === "error") {
          console.error("[chat] continuation failed:", next.error.message);
        }
        break;
      }

      // Buffer the continuation separately: the provider usually re-emits the
      // words around the cut, and appending that verbatim would ship the seam.
      const resumed: string[] = [];
      finish = await drainInto(next, resumed);
      const resumedText = resumed.join("");
      const stitched = trimSeamOverlap(buffer.join(""), resumedText);
      if (stitched.length !== resumedText.length) seamTrims += 1;
      buffer.push(stitched);
    }

    if (continuations > 0 || truncated) {
      // Observability: without this the truncation rate is unknowable.
      console.info("[chat] completion truncated:", {
        continuations,
        truncated,
        seamTrims,
        ipHash: hashIp(ip),
      });
    }

    const text = buffer.join("");
    if (text.trim().length === 0) {
      // A reasoning model with a tight completion cap can spend the whole
      // budget on reasoning and return no text at all. A blank bubble is
      // worse than an honest retry banner.
      console.error("[chat] empty completion:", {
        reason: "no_content",
        ipHash: hashIp(ip),
      });
      writeEvent(stream, {
        type: "error",
        code: "provider",
        message: "The connection was interrupted. Please try again.",
      });
      return;
    }

    const verdict = validateResponse(text, { language: guardrailLanguage });
    if (verdict.ok === false) {
      console.error("[chat] guardrail violation:", {
        violation: verdict.violation,
        chars: text.length,
        excerpt: text.slice(0, 200),
      });
      writeEvent(stream, {
        type: "delta",
        delta: guardrailLanguage === "en" ? GUARDRAIL_EN : GUARDRAIL_ES,
      });
      writeEvent(stream, { type: "done" });
      return;
    }

    // Only validated text is cacheable, and only for a repeating
    // conversation-opening question. A truncated answer is never cached:
    // replaying a cut answer to every visitor would make the defect sticky.
    if (history.length === 0 && !truncated) {
      writeCachedAnswer(message, guardrailLanguage, text);
    }
    // Burst the buffered deltas; the widget coalesces them on arrival.
    for (const chunk of buffer) {
      writeEvent(stream, { type: "delta", delta: chunk });
    }

    if (truncated) {
      writeEvent(stream, {
        type: "error",
        code: "truncated",
        message: "The answer was cut off before it finished. Please try again.",
      });
      return;
    }
    writeEvent(stream, { type: "done" });
  } catch (error) {
    if (!controller.signal.aborted) {
      const providerError =
        error instanceof ProviderError ? error : new ProviderError("unknown");
      console.error("[chat] stream interrupted:", providerError.message);
      writeEvent(stream, {
        type: "error",
        code: providerError.status === 429 ? "rate_limit" : "provider",
        message:
          providerError.status === 429
            ? "Please wait a moment before sending another message."
            : "The connection was interrupted. Please try again.",
      });
    }
  } finally {
    finished = true;
    res.end();
  }
}
