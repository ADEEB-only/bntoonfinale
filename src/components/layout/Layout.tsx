import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

const contentVariants = {
  initial: {
    opacity: 0,
  },
  enter: {
    opacity: 1,
    transition: {
      duration: 0.25,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 1, 1] as const,
    },
  },
};

export function Layout({ children, hideFooter = false }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <motion.main 
        className="flex-1"
        initial="initial"
        animate="enter"
        exit="exit"
        variants={contentVariants}
      >
        {children}
      </motion.main>
      {!hideFooter && <Footer />}
    </div>
  );
}
