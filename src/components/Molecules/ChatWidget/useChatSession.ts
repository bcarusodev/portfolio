import { useEffect, useRef, useState } from "react";
import type { IChatErrorCode, IChatMessage, IChatStatus, ILang } from "./types";

const HISTORY_LIMIT = 8;
const RESEND_GUARD_MS = 300;
const COALESCE_MS = 50;

/** Hard cap on a single user message, mirrored by the composer counter. */
export const MAX_MESSAGE_CHARS = 2000;

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

export interface IChatSession {
  messages: IChatMessage[];
  status: IChatStatus;
  errorCode: IChatErrorCode | null;
  input: string;
  setInput: (value: string) => void;
  submit: () => void;
  retry: () => void;
  newChat: () => void;
  dismissError: () => void;
  busy: boolean;
  canRetry: boolean;
}

/**
 * Owns the conversation and the SSE transport for the assistant.
 *
 * This lives above the presentation shells on purpose: the mobile launcher
 * navigates to a dedicated `/chat` page, and state kept inside either page
 * would be destroyed by that navigation (as it would by a breakpoint crossing
 * that swaps shells). Here the thread — and any in-flight stream — survives
 * moving between the inline card and the fullscreen page; the abort only fires
 * when the app itself unmounts.
 */
export function useChatSession(language: ILang): IChatSession {
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [status, setStatus] = useState<IChatStatus>("idle");
  const [errorCode, setErrorCode] = useState<IChatErrorCode | null>(null);
  const [input, setInput] = useState("");
  const lastSendRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const busy = status === "thinking" || status === "streaming";

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
                event.code === "invalid" ||
                event.code === "truncated"
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

  const submit = () => {
    const text = input;
    setInput("");
    // Fire-and-forget: send() handles its own failures, so it never rejects.
    send(text);
  };

  const retry = () => {
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
    // Fire-and-forget: send() handles its own failures, so it never rejects.
    send(lastUser.content, base);
  };

  const newChat = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setErrorCode(null);
    setStatus("idle");
    setInput("");
  };

  const dismissError = () => setErrorCode(null);

  const canRetry =
    errorCode !== null &&
    errorCode !== "too_long" &&
    messages.some((message) => message.role === "user");

  return {
    messages,
    status,
    errorCode,
    input,
    setInput,
    submit,
    retry,
    newChat,
    dismissError,
    busy,
    canRetry,
  };
}
