import React, { useEffect } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

// Client-only, same reason as the inline card: the widget reads localStorage
// for the chat language, which cannot match an SSR render. `next/link`
// prefetches this chunk, so tapping the launcher is not paying for the load.
const ChatScreen = dynamic(
  () => import("@/components/Molecules/ChatWidget/ChatScreen"),
  { ssr: false }
);

const AI_CHAT_ENABLED = process.env.NEXT_PUBLIC_AI_CHAT_ENABLED === "true";

/**
 * Dedicated mobile chat page (reached from the launcher on `/`).
 *
 * The global nav and footer are suppressed for this route in `_app`, so the
 * chat owns the viewport; the conversation itself lives in
 * `ChatSessionProvider`, which is why leaving and re-entering keeps the thread.
 */
const Chat = () => {
  const router = useRouter();

  useEffect(() => {
    // Chat is gated by an env flag on `/` too; without it this route would
    // render a widget whose endpoint does not exist.
    if (!AI_CHAT_ENABLED) router.replace("/");
  }, [router]);

  if (!AI_CHAT_ENABLED) return null;

  return (
    <>
      <Head>
        <title>Chat — Bruno Caruso</title>
        <meta name="robots" content="noindex" />
      </Head>
      <ChatScreen onClose={() => router.push("/")} />
    </>
  );
};

export default Chat;
