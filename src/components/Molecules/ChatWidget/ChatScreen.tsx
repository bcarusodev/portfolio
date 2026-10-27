import React from "react";
import ChatWidget from "./index";
import { useChatSessionContext } from "@/providers/ChatSessionProvider";
import constants from "@/constants";

interface IChatScreenProps {
  /** Leaves the chat page; the page owns routing. */
  onClose: () => void;
}

/**
 * The chat itself, sized to whatever surface hosts it.
 *
 * Deliberately unaware of the viewport, the site chrome and routing: the page
 * puts it inside `ChatViewport` together with the header, and it simply takes
 * the remaining height (`flex-1` + `min-h-0`, so its own scroll area is the
 * message log and never the page).
 */
const ChatScreen = ({ onClose }: IChatScreenProps) => {
  const { session, language } = useChatSessionContext();

  return (
    <ChatWidget
      session={session}
      language={language}
      variant="fullscreen"
      inputId={constants.ASSISTANT_INPUT_ID}
      onClose={onClose}
    />
  );
};

export default ChatScreen;
