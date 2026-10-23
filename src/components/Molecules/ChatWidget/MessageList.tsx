import React, { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { getLabels } from "./labels";
import { cn } from "@/lib/utils";
import type { IChatMessage, IChatStatus, ILang } from "./types";

interface IMessageListProps {
  messages: IChatMessage[];
  status: IChatStatus;
  language: ILang;
  /** Layout overrides (the fullscreen shell lets the log grow). */
  className?: string;
}

/**
 * Scrollable message log (T-10 / FR-03 / U-05 / NFR-05).
 * `role="log"` + `aria-live="polite"` announce new messages (NFR-05);
 * typing dots show until the first streamed token arrives (FR-10).
 */
export const MessageList = ({
  messages,
  status,
  language,
  className,
}: IMessageListProps) => {
  const labels = getLabels(language);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessage = messages[messages.length - 1];
  const showTyping =
    status === "thinking" ||
    (status === "streaming" && lastMessage?.role === "user");

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  return (
    <div
      ref={scrollRef}
      role="log"
      aria-live="polite"
      aria-label={labels.conversation}
      className={cn(
        "flex max-h-[420px] min-h-[240px] flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-4",
        className
      )}
    >
      {messages.length === 0 ? (
        <p className="my-auto text-center text-sm text-muted-foreground">
          {labels.emptyState}
        </p>
      ) : (
        messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            language={language}
          />
        ))
      )}
      {showTyping ? (
        <MessageBubble
          key="typing-indicator"
          message={{ id: "typing", role: "assistant", content: "" }}
          language={language}
          isTyping
        />
      ) : null}
    </div>
  );
};
