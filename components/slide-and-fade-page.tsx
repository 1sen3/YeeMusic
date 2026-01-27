import { motion, spring } from "framer-motion";
import React from "react";

interface SlideAndFadePageProps {
  children: React.ReactNode;
}

export function SlideAndFadePage({ children }: SlideAndFadePageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}
