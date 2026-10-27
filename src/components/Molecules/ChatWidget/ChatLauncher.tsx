import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, MessageCircle } from "lucide-react";
import ChatWidget from "./index";
import { getLabels } from "./labels";
import { useChatSessionContext } from "@/providers/ChatSessionProvider";
import { cn } from "@/lib/utils";
import constants from "@/constants";

interface IChatLauncherProps {
  className?: string;
  inputId?: string;
}

/**
 * Responsive entry point for the assistant.
 *
 * Desktop keeps the inline card. On mobile the card is replaced by a link to
 * the dedicated `/chat` page, which renders the same widget fullscreen with
 * the site chrome suppressed — a real page, so browser history, back and the
 * on-screen keyboard behave natively instead of fighting a fixed overlay.
 *
 * The session comes from `ChatSessionProvider` rather than either page, so
 * navigating to `/chat` and back keeps the conversation.
 */
const ChatLauncher = ({ className, inputId }: IChatLauncherProps) => {
  const { session, language } = useChatSessionContext();
  const [narrow, setNarrow] = useState<boolean>(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia(constants.NARROW_VIEWPORT_QUERY).matches
  );

  const labels = getLabels(language);

  useEffect(() => {
    const query = window.matchMedia(constants.NARROW_VIEWPORT_QUERY);
    const handleChange = () => setNarrow(query.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

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
    <Link
      href="/chat"
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
    </Link>
  );
};

export default ChatLauncher;
