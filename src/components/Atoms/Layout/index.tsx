import React, { ReactNode } from "react";
import { motion } from "framer-motion";

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
    >
      {children}
    </motion.main>
  </>
);

export default Layout;
