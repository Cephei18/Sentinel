"use client";

import { motion } from "motion/react";
import type { TrustScore } from "@/lib/agents/reputation";

/**
 * Explainable trust breakdown — shows each weighted factor, its normalised
 * value, and a plain-language reason. This is what makes the score credible
 * rather than a black box.
 */
export function TrustBreakdown({ trust }: { trust: TrustScore }) {
  return (
    <div className="space-y-4">
      {trust.factors.map((f, i) => (
        <div key={f.key} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-medium">{f.label}</span>
            <span className="text-muted text-xs">
              weight {Math.round(f.weight * 100)}% · {Math.round(f.value * 100)}/100
            </span>
          </div>
          <div className="bg-surface-2 h-2 overflow-hidden rounded-full">
            <motion.div
              className="bg-brand h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(f.value * 100)}%` }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <p className="text-muted text-xs">{f.detail}</p>
        </div>
      ))}
    </div>
  );
}
