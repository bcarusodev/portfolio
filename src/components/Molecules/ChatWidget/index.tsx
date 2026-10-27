import React from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { getLabels } from "./labels";
import { MAX_MESSAGE_CHARS } from "./useChatSession";
import type { IChatSession } from "./useChatSession";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X } from "lucide-react";
import type { ILang } from "./types";

interface IChatWidgetProps {
  /** Conversation state and transport, owned by the shell that hosts it. */
  session: IChatSession;
  language: ILang;
  className?: string;
  /** DOM id for the message input, so the page can focus it. */
  inputId?: string;
  /**
   * `inline` is the page card; `fullscreen` fills its container (the `/chat`
   * page) and lets the message log grow instead of capping it at 420px.
   */
  variant?: "inline" | "fullscreen";
  /** Renders a dismiss control in the header. Required by `fullscreen`. */
  onClose?: () => void;
}

/**
 * Presentational chat shell (T-11 / FR-01..07).
 *
 * Renders a session it does not own: the state lives in
 * `ChatSessionProvider`, above the page, so navigating to `/chat` and back —
 * or crossing the breakpoint — keeps the conversation instead of resetting it.
 */
const ChatWidget = ({
  session,
  language,
  className,
  inputId,
  variant = "inline",
  onClose,
}: IChatWidgetProps) => {
  const {
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
  } = session;

  const labels = getLabels(language);

  return (
    <section
      aria-label={labels.title}
      className={cn(
        variant === "fullscreen"
          ? "flex min-h-0 w-full flex-1 flex-col bg-background"
          : "w-full overflow-hidden rounded-2xl border border-border-strong bg-background/70 shadow-lg backdrop-blur-md",
        className
      )}
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-border-strong px-4 py-3">
        {/* The dismiss control leads the fullscreen header: on a phone the
            leading edge is the reachable one, and "back" reads left to right. */}
        {onClose ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label={labels.closeChat}
            title={labels.closeChat}
            className="h-11 w-11 shrink-0 rounded-xl"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : null}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold">{labels.title}</h2>
          <p className="truncate text-xs text-muted-foreground">
            {labels.subtitle}
          </p>
        </div>
        {messages.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={newChat}
            aria-label={labels.newChat}
            title={labels.newChat}
            className="h-7 shrink-0 gap-1 px-2 text-xs"
          >
            <X className="h-3.5 w-3.5" />
            {labels.newChat}
          </Button>
        ) : null}
      </header>

      <MessageList
        messages={messages}
        status={status}
        language={language}
        className={
          variant === "fullscreen" ? "min-h-0 max-h-[none] flex-1" : undefined
        }
      />

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
                onClick={retry}
                className="h-6 px-2 text-xs"
              >
                {labels.retry}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={dismissError}
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
        onSubmit={submit}
        disabled={busy}
        language={language}
        maxLength={MAX_MESSAGE_CHARS}
      />
    </section>
  );
};

export default ChatWidget;
