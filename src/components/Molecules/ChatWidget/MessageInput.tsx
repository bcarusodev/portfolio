import React, { useEffect, useRef } from "react";
import { SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getLabels } from "./labels";
import type { ILang } from "./types";

const MAX_ROWS_PX = 140;

interface IMessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  language: ILang;
  maxLength?: number;
  /** Stable DOM id so the page can focus the input (hero CTA). */
  id?: string;
}

/**
 * Auto-growing textarea with Enter-to-send (T-09 / FR-02 / U-07).
 * Empty input is blocked (E-03); over-limit input is flagged (E-04).
 */
export const MessageInput = ({
  value,
  onChange,
  onSubmit,
  disabled = false,
  language,
  maxLength = 2000,
  id,
}: IMessageInputProps) => {
  const labels = getLabels(language);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isOverLimit = value.length > maxLength;
  const cannotSend = disabled || value.trim().length === 0 || isOverLimit;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_ROWS_PX)}px`;
  }, [value]);

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ): void => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      if (!cannotSend) onSubmit();
    }
  };

  return (
    <div className="border-t border-border-strong p-3">
      <div className="flex items-end gap-2">
        <textarea
          id={id}
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={labels.placeholder}
          aria-label={labels.inputLabel}
          aria-invalid={isOverLimit}
          rows={1}
          className={cn(
            "max-h-[140px] min-h-[44px] w-full resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm leading-relaxed",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            isOverLimit && "border-destructive focus-visible:ring-destructive"
          )}
        />
        <Button
          type="button"
          size="icon"
          onClick={onSubmit}
          disabled={cannotSend}
          aria-label={labels.send}
          title={labels.send}
          className="h-[44px] w-[44px] shrink-0 rounded-xl"
        >
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-1 flex min-h-[16px] items-center justify-between px-1">
        <p
          className={cn(
            "text-xs",
            isOverLimit ? "text-destructive" : "text-muted-foreground"
          )}
          role={isOverLimit ? "alert" : undefined}
        >
          {isOverLimit ? labels.error.too_long : ""}
        </p>
        <p className="text-xs tabular-nums text-muted-foreground">
          {value.length}/{maxLength} {labels.charCount}
        </p>
      </div>
    </div>
  );
};
