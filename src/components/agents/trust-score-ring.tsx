"use client";

import { motion } from "motion/react";
import { scoreColorClass } from "@/lib/agents/format";
import type { TrustGrade } from "@/lib/agents/reputation";
import { cn } from "@/lib/utils";

interface TrustScoreRingProps {
  score: number;
  grade: TrustGrade;
  size?: number;
  /** Render the grade under the number. */
  showGrade?: boolean;
  className?: string;
}

/**
 * Animated radial trust score — the product's signature visual.
 * The arc sweeps to the score on mount; colour tracks the trust band.
 */
export function TrustScoreRing({
  score,
  grade,
  size = 132,
  showGrade = true,
  className,
}: TrustScoreRingProps) {
  const stroke = size * 0.075;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const colorClass = scoreColorClass(score);

  return (
    <div
      className={cn("relative grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-border"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={cn("stroke-current", colorClass)}
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          key={score}
          initial={{ opacity: 0, scale: 0.7, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className={cn("font-semibold tabular-nums", colorClass)}
          style={{ fontSize: size * 0.26 }}
        >
          {score}
        </motion.span>
        {showGrade && (
          <span className="text-muted text-[11px] font-medium tracking-wider uppercase">
            {grade} · trust
          </span>
        )}
      </div>
    </div>
  );
}
