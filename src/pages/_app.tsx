import { AppProps } from "next/app";
import Footer from "../components/Organisms/Footer";
import NavBar from "../components/Organisms/NavBar";
import Head from "next/head";
import { AnimatePresence } from "framer-motion";
import "../styles/globals.css";
import React from "react";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AnimatedBackground } from "@/components/Molecules/AnimatedBackground";
import { Toaster } from "@/components/ui/sonner";
import { GoogleAnalytics } from "@next/third-parties/google";
import { SpeedInsights } from "@vercel/speed-insights/next";

function MyApp({ Component, pageProps, router }: AppProps) {
  const url = `https://bcaruso.dev${router.route}`;
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Head>
        <title>Portfolio - Bruno Caruso</title>
      </Head>
      <AnimatedBackground />
      <NavBar />
      <AnimatePresence mode="wait" initial={true}>
        <Component {...pageProps} canonical={url} key={url} />
        <>
          <GoogleAnalytics gaId="G-LYHVRF7R6V" />
          <SpeedInsights />
        </>
      </AnimatePresence>
      <Toaster position="bottom-center" />
      <Footer />
    </ThemeProvider>
  );
}

export default MyApp;
