"use client";

import { motion, useScroll, useSpring } from "motion/react";

/** Thin accent bar across the very top of the viewport, tracking scroll progress. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { damping: 30, stiffness: 220, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden
      className="bg-brand fixed top-0 left-0 z-50 h-[3px] w-full origin-left"
      style={{ scaleX }}
    />
  );
}
