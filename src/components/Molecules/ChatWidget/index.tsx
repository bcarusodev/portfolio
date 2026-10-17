import React, { useEffect, useRef, useState } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { getLabels } from "./labels";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { IChatErrorCode, IChatMessage, IChatStatus, ILang } from "./types";

const LANG_STORAGE_KEY = "chat-lang:v1";
const HISTORY_LIMIT = 8;
const MAX_MESSAGE_CHARS = 2000;
const RESEND_GUARD_MS = 300;
const COALESCE_MS = 50;

interface IServerEvent {
  type?: string;
  delta?: string;
  code?: string;
}

/** Target-es5 safe Error subclass (instanceof breaks without setPrototypeOf). */
class ChatStreamError extends Error {
  readonly code: IChatErrorCode;

  constructor(code: IChatErrorCode) {
    super(code);
    this.name = "ChatStreamError";
    this.code = code;
    Object.setPrototypeOf(this, ChatStreamError.prototype);
  }
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readStoredLanguage(): ILang {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === "es" || stored === "en") return stored;
  } catch {
    // localStorage unavailable (private mode) — fall through.
  }
  return window.navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
}

interface IChatWidgetProps {
  className?: string;
  /** DOM id for the message input, so the page can focus it. */
  inputId?: string;
}

/**
 * Inline chat orchestrator (T-11 / FR-01..07).
 *
 * Streams `POST /api/chat` SSE frames via `ReadableStream`, splits on
 * `\n\n`, coalesces deltas every 50ms, keeps history to the last 8
 * messages, aborts in-flight requests on unmount/new chat, and offers
 * retry after stream drops (E-01).
 */
const ChatWidget = ({ className, inputId }: IChatWidgetProps) => {
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [status, setStatus] = useState<IChatStatus>("idle");
  const [errorCode, setErrorCode] = useState<IChatErrorCode | null>(null);
  const [input, setInput] = useState("");
  const [language] = useState<ILang>(readStoredLanguage);
  const lastSendRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const labels = getLabels(language);
  const busy = status === "thinking" || status === "streaming";

  useEffect(() => {
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, language);
    } catch {
      // Ignore quota/private-mode failures.
    }
  }, [language]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const send = async (raw: string, baseMessages?: IChatMessage[]) => {
    const text = raw.trim();
    if (!text || busy) return;
    const now = Date.now();
    if (now - lastSendRef.current < RESEND_GUARD_MS) return;
    lastSendRef.current = now;
    if (text.length > MAX_MESSAGE_CHARS) {
      setErrorCode("too_long");
      setStatus("error");
      return;
    }

    const base = baseMessages ?? messages;
    const userMessage: IChatMessage = {
      id: createId(),
      role: "user",
      content: text,
    };
    const history = base
      .slice(-HISTORY_LIMIT)
      .map(({ role, content }) => ({ role, content }));

    setMessages([...base, userMessage]);
    setErrorCode(null);
    setStatus("thinking");

    const controller = new AbortController();
    abortRef.current = controller;

    let assistantId: string | null = null;
    let pending = "";
    let lastFlush = 0;

    const flushPending = () => {
      if (!pending) return;
      const chunk = pending;
      pending = "";
      if (!assistantId) {
        const id = createId();
        assistantId = id;
        setStatus("streaming");
        setMessages((prev) => [
          ...prev,
          { id, role: "assistant", content: chunk },
        ]);
        return;
      }
      const id = assistantId;
      setMessages((prev) =>
        prev.map((message) =>
          message.id === id
            ? { ...message, content: message.content + chunk }
            : message
        )
      );
    };

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, language }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        let code: IChatErrorCode = "provider";
        if (response.status === 429) code = "rate_limit";
        else if (response.status === 400) code = "invalid";
        else if (!response.body) code = "network";
        throw new ChatStreamError(code);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let sawDone = false;
      let streamError: IChatErrorCode | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let separator = buffer.indexOf("\n\n");
        while (separator !== -1) {
          const frame = buffer.slice(0, separator);
          buffer = buffer.slice(separator + 2);

          for (const line of frame.split("\n")) {
            if (!line.startsWith("data:")) continue;
            let event: IServerEvent | null = null;
            try {
              const parsed: unknown = JSON.parse(line.slice(5).trim());
              event =
                typeof parsed === "object" && parsed !== null
                  ? (parsed as IServerEvent)
                  : null;
            } catch {
              event = null;
            }
            if (!event?.type) continue;

            if (event.type === "delta" && typeof event.delta === "string") {
              pending += event.delta;
              const timestamp = Date.now();
              if (timestamp - lastFlush >= COALESCE_MS) {
                flushPending();
                lastFlush = timestamp;
              }
            } else if (event.type === "done") {
              sawDone = true;
            } else if (event.type === "error") {
              streamError =
                event.code === "rate_limit" ||
                event.code === "provider" ||
                event.code === "invalid"
                  ? event.code
                  : "unknown";
            }
          }
          separator = buffer.indexOf("\n\n");
        }
      }

      flushPending();

      if (streamError) throw new ChatStreamError(streamError);
      if (!sawDone) throw new ChatStreamError("network");
      setStatus("idle");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      const code =
        error instanceof ChatStreamError ? error.code : ("network" as const);
      setErrorCode(code);
      setStatus("error");
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const handleSubmit = () => {
    const text = input;
    setInput("");
    void send(text);
  };

  const handleRetry = () => {
    if (busy) return;
    const last = messages[messages.length - 1];
    if (!last) return;
    let base = messages;
    if (last.role === "assistant") base = base.slice(0, -1);
    const lastUser = base[base.length - 1];
    if (!lastUser || lastUser.role !== "user") return;
    base = base.slice(0, -1);
    setMessages(base);
    setErrorCode(null);
    setStatus("idle");
    void send(lastUser.content, base);
  };

  const handleNewChat = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setErrorCode(null);
    setStatus("idle");
    setInput("");
  };

  const canRetry =
    errorCode !== null &&
    errorCode !== "too_long" &&
    messages.some((message) => message.role === "user");

  return (
    <section
      aria-label={labels.title}
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-border-strong bg-background/70 shadow-lg backdrop-blur-md",
        className
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-border-strong px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{labels.title}</h2>
          <p className="truncate text-xs text-muted-foreground">
            {labels.subtitle}
          </p>
        </div>
        {messages.length > 0 ? (
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleNewChat}
              aria-label={labels.newChat}
              title={labels.newChat}
              className="h-7 gap-1 px-2 text-xs"
            >
              <X className="h-3.5 w-3.5" />
              {labels.newChat}
            </Button>
          </div>
        ) : null}
      </header>

      <MessageList messages={messages} status={status} language={language} />

      {errorCode ? (
        <div
          role="alert"
          className="mx-4 mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          <span>{labels.error[errorCode]}</span>
          <div className="flex items-center gap-1">
            {canRetry ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="h-6 px-2 text-xs"
              >
                {labels.retry}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setErrorCode(null)}
              className="h-6 px-2 text-xs"
            >
              {labels.dismiss}
            </Button>
          </div>
        </div>
      ) : null}

      <MessageInput
        id={inputId}
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        disabled={busy}
        language={language}
        maxLength={MAX_MESSAGE_CHARS}
      />
    </section>
  );
};

export default ChatWidget;
