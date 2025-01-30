import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import { Box } from "@chakra-ui/react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

type LayoutProps = {
  children: ReactNode;
};

const variants = {
  hidden: { opacity: 0 },
  enter: { opacity: 1 },
  exit: { opacity: 0 },
};

const Layout = ({ children }: LayoutProps): JSX.Element => (
  <>
    <motion.main
      initial="hidden"
      animate="enter"
      exit="exit"
      variants={variants}
      transition={{ duration: 0.2, type: "tween" }}
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <Box minH="calc(90vh - 44px)">{children}</Box>
    </motion.main>
  </>
);

export default Layout;
