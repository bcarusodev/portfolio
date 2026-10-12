import type { NextApiRequest, NextApiResponse } from "next";
import { getKnowledgeBase, selectKnowledge } from "@/lib/ai/knowledge";
import { buildSystemPrompt, trimHistory } from "@/lib/ai/prompt";
import type { IPromptMessage, ILanguage } from "@/lib/ai/prompt";
import { checkRateLimit } from "@/lib/ai/rateLimit";
import { getProvider, ProviderError } from "@/lib/ai/provider";

/**
 * POST /api/chat — SSE streaming chat endpoint (T-06 / FR-11..16).
 *
 * Pre-stream failures return real JSON status codes (400/429/503);
 * once the stream is open, failures are delivered as in-band `error`
 * events so the widget can show a retry banner (E-01).
 */

const MAX_MESSAGE_CHARS = 2000;
const MAX_COMPLETION_TOKENS = 700;

type IErrorCode = "rate_limit" | "provider" | "invalid";

type IChatEvent =
  | { type: "delta"; delta: string }
  | { type: "done" }
  | { type: "error"; code: IErrorCode; message: string };

interface IChatRequestBody {
  message?: unknown;
  history?: unknown;
  language?: unknown;
}

function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const first = raw?.split(",")[0]?.trim();
  return first || req.socket.remoteAddress || "unknown";
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
    res.setHeader("Retry-After", String(rate.retryAfter));
    res.status(429).json({
      error: "rate_limit",
      message: "Please wait a moment before sending another message.",
      retryAfter: rate.retryAfter,
    });
    return;
  }

  const maxKbTokens = Number(process.env.AI_MAX_KB_TOKENS || 5000);
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

  const controller = new AbortController();
  let finished = false;
  res.on("close", () => {
    if (!finished) controller.abort();
  });

  let iterator: AsyncGenerator<string>;
  try {
    iterator = getProvider().streamChat({
      system,
      messages: providerMessages,
      maxTokens: MAX_COMPLETION_TOKENS,
      signal: controller.signal,
    });
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

  // Pull the first delta before opening the stream so upstream failures
  // (429/5xx) still map to real HTTP status codes (FR-15/FR-16).
  let first: IteratorResult<string>;
  try {
    first = await iterator.next();
  } catch (error) {
    if (controller.signal.aborted) {
      res.status(499).end();
      return;
    }
    const providerError =
      error instanceof ProviderError ? error : new ProviderError("unknown");
    console.error("[chat] provider request failed:", providerError.message);
    if (providerError.status === 429) {
      res.setHeader("Retry-After", "30");
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

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  const stream = res as FlushableResponse;

  try {
    if (!first.done) writeEvent(stream, { type: "delta", delta: first.value });

    while (true) {
      const result = await iterator.next();
      if (result.done) break;
      writeEvent(stream, { type: "delta", delta: result.value });
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
