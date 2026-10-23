import React, { useEffect, useState } from "react";
import { ChevronRight, MessageCircle } from "lucide-react";
import ChatWidget from "./index";
import { getLabels } from "./labels";
import { LANG_STORAGE_KEY, readStoredLanguage } from "./language";
import { useChatSession } from "./useChatSession";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { ILang } from "./types";

/**
 * Matches Tailwind's `md` boundary (768px), so exactly the viewports that
 * lose the inline card get the launcher: 767px and below.
 */
const NARROW_VIEWPORT_QUERY = "(max-width: 767px)";

interface IChatLauncherProps {
  className?: string;
  inputId?: string;
}

/**
 * Responsive entry point for the assistant.
 *
 * Desktop keeps the inline card. On mobile the card is replaced by a tap
 * target that opens the same widget fullscreen in a modal dialog, so the
 * conversation gets the whole viewport and the composer stays reachable
 * above the keyboard.
 *
 * The chat session is owned here, above both shells: the dialog unmounts its
 * content on close, so dismissing it or crossing the breakpoint keeps the
 * thread (and any in-flight answer) instead of resetting it.
 */
const ChatLauncher = ({ className, inputId }: IChatLauncherProps) => {
  const [language] = useState<ILang>(readStoredLanguage);
  const [narrow, setNarrow] = useState<boolean>(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia(NARROW_VIEWPORT_QUERY).matches
  );
  const [open, setOpen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  const labels = getLabels(language);
  const session = useChatSession(language);

  useEffect(() => {
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, language);
    } catch {
      // Ignore quota/private-mode failures.
    }
  }, [language]);

  useEffect(() => {
    const query = window.matchMedia(NARROW_VIEWPORT_QUERY);
    const handleChange = () => setNarrow(query.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  // Crossing into the desktop layout replaces the dialog-backed widget, so
  // the overlay must not stay mounted behind it.
  useEffect(() => {
    if (!narrow) setOpen(false);
  }, [narrow]);

  // `100dvh` follows browser chrome but not the software keyboard; the visual
  // viewport is the only measurement that shrinks with it on iOS.
  useEffect(() => {
    if (!open) {
      setViewportHeight(null);
      return;
    }
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => setViewportHeight(viewport.height);
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, [open]);

  if (!narrow) {
    return (
      <ChatWidget
        session={session}
        language={language}
        className={className}
        inputId={inputId}
      />
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "group flex w-full items-center gap-3 rounded-2xl border border-border-strong bg-background/70 px-4 py-4 text-left shadow-lg backdrop-blur-md",
          "transition-colors duration-200 hover:border-ring",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          className
        )}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <MessageCircle className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">
            {labels.title}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {labels.subtitle}
          </span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          aria-describedby={undefined}
          // A chat that opens with the caret already in the composer, instead
          // of on the dismiss control Radix would pick as first tabbable.
          onOpenAutoFocus={(event) => {
            const input = inputId ? document.getElementById(inputId) : null;
            if (!(input instanceof HTMLTextAreaElement)) return;
            event.preventDefault();
            input.focus({ preventScroll: true });
          }}
          style={viewportHeight ? { height: `${viewportHeight}px` } : undefined}
          className={cn(
            "left-0 top-0 flex h-[100dvh] w-full max-w-none translate-x-0 translate-y-0",
            "flex-col gap-0 overflow-hidden rounded-none border-0 p-0",
            "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
          )}
        >
          <DialogTitle className="sr-only">{labels.title}</DialogTitle>
          <ChatWidget
            session={session}
            language={language}
            variant="fullscreen"
            inputId={inputId}
            onClose={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatLauncher;
