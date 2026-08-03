import { AppProps } from "next/app";
import Footer from "../components/Organisms/Footer";
import NavBar from "../components/Organisms/NavBar";
import Head from "next/head";
import { AnimatePresence } from "motion/react";
import "../styles/globals.css";
import React from "react";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AnimatedBackground } from "@/components/Molecules/AnimatedBackground";
import { Toaster } from "@/components/ui/sonner";
import { GoogleAnalytics } from "@next/third-parties/google";
import { SpeedInsights } from "@vercel/speed-insights/next";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

function MyApp({ Component, pageProps, router }: AppProps) {
  const url = `https://bcaruso.dev${router.asPath}`;
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Head>
        <title>Portfolio - Bruno Caruso</title>
      </Head>
      <AnimatedBackground />
      <NavBar />
      <AnimatePresence mode="wait" initial={true}>
        <Component {...pageProps} canonical={url} key={url} />
      </AnimatePresence>
      <GoogleAnalytics gaId={GA_ID} />
      <SpeedInsights />
      <Toaster position="bottom-center" />
      <Footer />
    </ThemeProvider>
  );
}

export default MyApp;
