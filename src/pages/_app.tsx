import { ChakraProvider, createLocalStorageManager } from "@chakra-ui/react";
import theme from "../theme";
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

function MyApp({ Component, pageProps, router }: AppProps) {
  const url = `https://bcaruso.dev${router.route}`;
  const manager = createLocalStorageManager("color-mode");
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ChakraProvider resetCSS theme={theme} colorModeManager={manager}>
        <Head>
          <title>Portfolio - Bruno Caruso</title>
        </Head>
        <AnimatedBackground />
        <NavBar />
        <AnimatePresence mode="wait" initial={true}>
          <Component {...pageProps} canonical={url} key={url} />
        </AnimatePresence>
        <Toaster position={"bottom-center"} />
        <Footer />
      </ChakraProvider>
    </ThemeProvider>
  );
}

export default MyApp;
