import React, { useEffect, useState } from "react";
import ChatWidget from "./index";
import { useChatSessionContext } from "@/providers/ChatSessionProvider";
import constants from "@/constants";

interface IChatScreenProps {
  /** Leaves the chat page; the page owns routing. */
  onClose: () => void;
}

/**
 * Fullscreen chat surface for the dedicated `/chat` page.
 *
 * Two layers on purpose:
 * - the outer one covers the whole layout viewport with an opaque app
 *   background, so nothing from the site can ever show through — not even the
 *   sliver iOS leaves when its own toolbar sits above the page;
 * - the inner one tracks the visual viewport, because on iOS the layout
 *   viewport does not resize when the keyboard opens: the visual viewport
 *   shrinks and scrolls instead, and a `100dvh` box alone would leave the
 *   composer under the keyboard.
 */
const ChatScreen = ({ onClose }: IChatScreenProps) => {
  const { session, language } = useChatSessionContext();
  const [viewportBox, setViewportBox] = useState<{
    top: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () =>
      setViewportBox({ top: viewport.offsetTop, height: viewport.height });
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  // A chat that owns the screen should not let the page scroll under it: on
  // iOS that collapses the browser chrome and makes the surface jump.
  useEffect(() => {
    const { body } = document;
    const previous = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = previous;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-30 overflow-hidden bg-background">
      <div
        className="absolute inset-x-0 flex flex-col"
        style={{
          top: viewportBox ? `${viewportBox.top}px` : 0,
          // Definite height even before the viewport is measured: the widget
          // below is `h-full`, and an auto-height parent would collapse it.
          height: viewportBox ? `${viewportBox.height}px` : "100dvh",
        }}
      >
        <ChatWidget
          session={session}
          language={language}
          variant="fullscreen"
          inputId={constants.ASSISTANT_INPUT_ID}
          onClose={onClose}
        />
      </div>
    </div>
  );
};

export default ChatScreen;
