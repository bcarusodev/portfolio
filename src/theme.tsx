import { extendTheme, ThemeConfig } from "@chakra-ui/react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

const fonts = {
  navitem: GeistMono.variable,
  body: `${GeistSans.variable}, sans-serif`,
  subtitle: `${GeistSans.variable},-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"`,
  heading: `${GeistSans.variable},-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"`,
};

const breakpoints = {
  base: "0px",
  sm: "640px",
  md: "832px",
  lg: "1024px",
  xl: "1280px",
};

const themeConfig: ThemeConfig = {
  initialColorMode: "system",
  useSystemColorMode: true,
  disableTransitionOnChange: false,
};

const theme = extendTheme({
  config: themeConfig,
  semanticTokens: {
    colors: {
      text: {
        default: "#16161D",
        _dark: "#ade3b8",
      },
      heroGradientStart: {
        default: "#7928CA",
        _dark: "#e3a7f9",
      },
      heroGradientEnd: {
        default: "#FF0080",
        _dark: "#fbec8f",
      },
    },
    radii: {
      button: "12px",
    },
  },
  colors: {
    black: "#16161D",
  },
  fonts,
  breakpoints,
});

export default theme;
