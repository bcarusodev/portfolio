import NextDocument, { Html, Head, Main, NextScript } from "next/document";
import { ColorModeScript } from "@chakra-ui/react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

export default class Document extends NextDocument {
  render() {
    return (
      <Html
        style={{ scrollBehavior: "smooth" }}
        className={`${GeistSans.variable} ${GeistMono.variable}`}
      >
        <Head>
          <link
            rel="icon"
            type="image/svg+xml"
            href="/assets/images/favicon.svg"
          ></link>
          <link
            rel="icon"
            type="image/png"
            href="/assets/images/favicon.png"
          ></link>
        </Head>
        <body>
          {/* Make Color mode to persists when you refresh the page. */}
          <ColorModeScript />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
