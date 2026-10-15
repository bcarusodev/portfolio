import React from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { markdownComponents } from "./markdownComponents";
import { getLabels } from "./labels";
import type { ILang, IChatMessage } from "./types";

interface IMessageBubbleProps {
  message: IChatMessage;
  language: ILang;
  /** Render animated typing dots instead of content (FR-10 / U-06). */
  isTyping?: boolean;
}

const TypingDots = ({ label }: { label: string }) => (
  <span
    className="inline-flex items-center gap-1"
    role="status"
    aria-label={label}
  >
    {[0, 1, 2].map((index) => (
      <span
        key={index}
        className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70"
        style={{ animationDelay: `${index * 120}ms` }}
      />
    ))}
  </span>
);

/**
 * Assistant content renderer (FR-1 / NFR-3): GFM Markdown through the
 * Tailwind override map. No rehype plugins and no dangerouslySetInnerHTML,
 * so raw HTML stays inert. Empty/whitespace-only content emits nothing.
 */
const MarkdownMessage = ({ content }: { content: string }) => {
  if (!content.trim()) return null;
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  );
};

export const MessageBubble = ({
  message,
  language,
  isTyping = false,
}: IMessageBubbleProps) => {
  const labels = getLabels(language);
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[85%] break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser && "whitespace-pre-wrap",
          isUser
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm border border-border/60 bg-muted text-foreground"
        )}
      >
        {isTyping ? (
          <TypingDots label={labels.typing} />
        ) : isUser ? (
          message.content
        ) : (
          <MarkdownMessage content={message.content} />
        )}
      </div>
    </motion.div>
  );
};
