import NextDocument, { Html, Head, Main, NextScript } from "next/document";
import { ColorModeScript } from "@chakra-ui/react";

export default class Document extends NextDocument {
  render() {
    return (
      <Html>
        <Head>
          <title>Portfolio - Bruno Caruso</title>
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
