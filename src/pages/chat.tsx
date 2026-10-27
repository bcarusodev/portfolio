import React, { useEffect, useState } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import NavBar from "@/components/Organisms/NavBar";
import { ChatViewport } from "@/components/Molecules/ChatWidget/ChatViewport";
import type { IViewportBox } from "@/components/Molecules/ChatWidget/ChatViewport";

// Client-only, same reason as the inline card: the widget reads localStorage
// for the chat language, which cannot match an SSR render. `next/link`
// prefetches this chunk, so tapping the launcher is not paying for the load.
// The viewport and the site header stay outside it, so they are server-rendered
// and the page is never a blank screen.
const ChatScreen = dynamic(
  () => import("@/components/Molecules/ChatWidget/ChatScreen"),
  { ssr: false }
);

const AI_CHAT_ENABLED = process.env.NEXT_PUBLIC_AI_CHAT_ENABLED === "true";

/**
 * Dedicated mobile chat page (reached from the launcher on `/`).
 *
 * `_app` suppresses the app-level nav and footer for this route because the
 * chrome has to live *inside* the viewport-pinned surface (see `ChatViewport`)
 * — a header left in the document flow would scroll away with the keyboard.
 * The conversation itself lives in `ChatSessionProvider`, which is why leaving
 * and re-entering keeps the thread.
 */
const Chat = () => {
  const router = useRouter();
  const [box, setBox] = useState<IViewportBox | null>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () =>
      setBox({ top: viewport.offsetTop, height: viewport.height });
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
      <ChatViewport box={box} header={<NavBar />}>
        <ChatScreen onClose={() => router.push("/")} />
      </ChatViewport>
    </>
  );
};

export default Chat;
