import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/300.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/400.css";
import { ChakraProvider, createLocalStorageManager } from "@chakra-ui/react";

import theme from "../theme";
import { AppProps } from "next/app";
import Footer from "../components/Organisms/Footer";
import NavBar from "../components/Organisms/NavBar";
import Head from "next/head";
import { AnimatePresence } from "framer-motion";

function MyApp({ Component, pageProps, router }: AppProps) {
  const url = `https://bcaruso.dev${router.route}`;
  const manager = createLocalStorageManager("color-mode");
  return (
    <ChakraProvider resetCSS theme={theme} colorModeManager={manager}>
      <Head>
        <title>Portfolio - Bruno Caruso</title>
      </Head>
      <NavBar />
      <AnimatePresence mode="wait" initial={true}>
        <Component {...pageProps} canonical={url} key={url} />
      </AnimatePresence>
      <Footer />
    </ChakraProvider>
  );
}

export default MyApp;
