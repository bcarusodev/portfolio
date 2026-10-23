import React from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { getLabels } from "./labels";
import { MAX_MESSAGE_CHARS } from "./useChatSession";
import type { IChatSession } from "./useChatSession";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronDown, X } from "lucide-react";
import type { ILang } from "./types";

interface IChatWidgetProps {
  /** Conversation state and transport, owned by the shell that hosts it. */
  session: IChatSession;
  language: ILang;
  className?: string;
  /** DOM id for the message input, so the page can focus it. */
  inputId?: string;
  /**
   * `inline` is the page card; `fullscreen` fills its container (the mobile
   * dialog) and lets the message log grow instead of capping it at 420px.
   */
  variant?: "inline" | "fullscreen";
  /** Renders a dismiss control in the header. Required by `fullscreen`. */
  onClose?: () => void;
}

/**
 * Presentational chat shell (T-11 / FR-01..07).
 *
 * Renders a session it does not own: the state lives in `useChatSession`, one
 * level up, so closing the fullscreen dialog and crossing the breakpoint keep
 * the conversation instead of resetting it.
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
          ? "flex h-full w-full flex-col bg-background"
          : "w-full overflow-hidden rounded-2xl border border-border-strong bg-background/70 shadow-lg backdrop-blur-md",
        className
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border-strong px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{labels.title}</h2>
          <p className="truncate text-xs text-muted-foreground">
            {labels.subtitle}
          </p>
        </div>
        {messages.length > 0 || onClose ? (
          <div className="flex shrink-0 items-center gap-2">
            {messages.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={newChat}
                aria-label={labels.newChat}
                title={labels.newChat}
                className="h-7 gap-1 px-2 text-xs"
              >
                <X className="h-3.5 w-3.5" />
                {labels.newChat}
              </Button>
            ) : null}
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
                <ChevronDown className="h-5 w-5" />
              </Button>
            ) : null}
          </div>
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
