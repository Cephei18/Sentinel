"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

/**
 * Global pointer choreography for the landing page: a lagging ring + a tight
 * dot standing in for the native cursor, and a `--mx`/`--my` CSS variable
 * pair other elements paint against (see `.spotlight` usage). One listener,
 * motion values only — no React re-renders on mousemove.
 *
 * Skips itself on touch devices and when the user asked for less motion, so
 * it never leaves the real cursor hidden with nothing standing in for it.
 */
export function PointerField() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { damping: 28, stiffness: 260, mass: 0.5 });
  const ringY = useSpring(y, { damping: 28, stiffness: 260, mass: 0.5 });
  const scale = useMotionValue(1);
  const ringScale = useSpring(scale, { damping: 18, stiffness: 300 });

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    document.body.classList.add("cursor-none");

    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      document.documentElement.style.setProperty("--mx", `${e.clientX}px`);
      document.documentElement.style.setProperty("--my", `${e.clientY}px`);
      const hovering = (e.target as HTMLElement)?.closest("[data-cursor]");
      scale.set(hovering ? 1.9 : 1);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      document.body.classList.remove("cursor-none");
    };
  }, [x, y, scale]);

  return (
    <>
      <motion.div
        aria-hidden
        className="border-brand-muted pointer-events-none fixed top-0 left-0 z-[100] size-8 rounded-full border-[1.5px]"
        style={{ x: ringX, y: ringY, translateX: "-50%", translateY: "-50%", scale: ringScale }}
      />
      <motion.div
        aria-hidden
        className="bg-brand-muted pointer-events-none fixed top-0 left-0 z-[100] size-1.5 rounded-full"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
      />
    </>
  );
}

/** Fixed ambient glow that follows the cursor via the CSS vars PointerField sets. */
export function Spotlight() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background:
          "radial-gradient(560px circle at var(--mx, 50vw) var(--my, 10vh), rgba(166,43,74,0.14), transparent 70%)",
      }}
    />
  );
}
