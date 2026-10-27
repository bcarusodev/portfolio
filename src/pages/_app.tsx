import { AppProps } from "next/app";
import Footer from "../components/Organisms/Footer";
import NavBar from "../components/Organisms/NavBar";
import Head from "next/head";
import { AnimatePresence } from "framer-motion";
import "../styles/globals.css";
import React from "react";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ChatSessionProvider } from "@/providers/ChatSessionProvider";
import { AnimatedBackground } from "@/components/Molecules/AnimatedBackground";
import { Toaster } from "@/components/ui/sonner";
import { GoogleAnalytics } from "@next/third-parties/google";
import { SpeedInsights } from "@vercel/speed-insights/next";

/**
 * Routes that own the viewport and render their own chrome.
 *
 * `/chat` pins its surface to the visual viewport, so its header has to live
 * *inside* that surface — an app-level nav left in the document flow would
 * scroll away as soon as the keyboard opens. The app-level nav and footer are
 * suppressed here and composed by the page instead.
 */
const FULLSCREEN_ROUTES = new Set(["/chat"]);

function MyApp({ Component, pageProps, router }: AppProps) {
  const url = `https://bcaruso.dev${router.route}`;
  const fullscreen = FULLSCREEN_ROUTES.has(router.pathname);

  return (
    // The chat session lives above the router outlet: the mobile launcher
    // navigates to /chat, and a session owned by either page would be
    // destroyed by that navigation.
    <ChatSessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Head>
          <title>Portfolio - Bruno Caruso</title>
        </Head>
        <AnimatedBackground />
        {fullscreen ? null : <NavBar />}
        <AnimatePresence mode="wait" initial={true}>
          <Component {...pageProps} canonical={url} key={url} />
          <>
            <GoogleAnalytics gaId="G-LYHVRF7R6V" />
            <SpeedInsights />
          </>
        </AnimatePresence>
        <Toaster position="bottom-center" />
        {fullscreen ? null : <Footer />}
      </ThemeProvider>
    </ChatSessionProvider>
  );
}

export default MyApp;
