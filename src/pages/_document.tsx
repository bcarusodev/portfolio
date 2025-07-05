import NextDocument, { Html, Head, Main, NextScript } from "next/document";
import { ColorModeScript } from "@chakra-ui/react";
import { GeistSans } from "geist/font/sans";

export default class Document extends NextDocument {
  render() {
    return (
      <Html
        style={{ scrollBehavior: "smooth" }}
        className={`${GeistSans.className}`}
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
          <ColorModeScript />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
