"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { buildSeed } from "@/lib/agents/seed";
import { computeTrustScore } from "@/lib/agents/reputation";
import { EVENT_LABEL } from "@/lib/agents/format";
import { formatUsd } from "@/lib/utils";
import { TrustScoreRing } from "@/components/agents/trust-score-ring";

// A fixed instant, not the live clock — the seed generator only cares about
// relative offsets, and pinning "now" keeps this section deterministic between
// server and client renders.
const NOW_MS = Date.parse("2026-08-19T00:00:00.000Z");
const REVEAL_COUNT = 6;

/**
 * Replays part of Atlas's real seed history (the same `buildSeed()` +
 * `computeTrustScore()` that power /dashboard and /graph) as it scrolls into
 * view. Every number on screen is computed from that event log live, in the
 * browser — nothing here is a hardcoded score.
 */
export function LiveTrust() {
  const [step, setStep] = useState(0);
  const started = useRef(false);

  const { atlas, baseline, tail } = useMemo(() => {
    const seed = buildSeed(NOW_MS);
    const agent = seed.agents.find((a) => a.id === "agt_atlas")!;
    const events = seed.events
      .filter((e) => e.agentId === "agt_atlas")
      .sort((a, b) => +new Date(a.at) - +new Date(b.at));
    return {
      atlas: agent,
      baseline: events.slice(0, Math.max(0, events.length - REVEAL_COUNT)),
      tail: events.slice(-REVEAL_COUNT),
    };
  }, []);

  const scoreAt = (n: number) => computeTrustScore(atlas, [...baseline, ...tail.slice(0, n)]);
  const current = scoreAt(step);

  const play = () => {
    if (started.current) return;
    started.current = true;
    for (let i = 1; i <= tail.length; i++) {
      setTimeout(() => setStep(i), 260 * i);
    }
  };

  return (
    <motion.div
      onViewportEnter={play}
      viewport={{ once: true, margin: "-80px" }}
      className="mt-12 grid items-center gap-10 lg:grid-cols-[1fr_40px_auto]"
    >
      <div className="flex min-h-[220px] flex-col gap-2">
        {tail.slice(0, step).map((e, i) => {
          const before = scoreAt(i).score;
          const after = scoreAt(i + 1).score;
          const delta = after - before;
          return (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-background flex items-center gap-2.5 rounded-[10px] px-4 py-2.5 text-[13px]"
            >
              <span
                className={`size-2 shrink-0 rounded-full ${
                  delta > 0 ? "bg-brand-muted" : delta < 0 ? "bg-danger" : "bg-brand"
                }`}
              />
              <span className="flex-1 truncate">
                <strong className="text-muted font-normal">{EVENT_LABEL[e.kind]}</strong> ·{" "}
                {e.label}
                {typeof e.amountUsdc === "number" ? ` · ${formatUsd(e.amountUsdc)}` : ""}
              </span>
              {delta !== 0 && (
                <span
                  className={`text-xs font-bold tabular-nums ${delta > 0 ? "text-brand-muted" : "text-danger"}`}
                >
                  {delta > 0 ? "+" : ""}
                  {delta}
                </span>
              )}
            </motion.div>
          );
        })}
        {step === 0 &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-background/60 h-[38px] rounded-[10px]" />
          ))}
      </div>

      <ArrowRight className="text-muted/40 mx-auto hidden size-6 lg:block" />

      <div className="flex flex-wrap items-center gap-10">
        <TrustScoreRing score={current.score} grade={current.grade} size={200} />
        <div className="flex flex-col gap-4">
          {current.factors.map((f) => (
            <div key={f.key} className="flex items-center gap-3">
              <span className="w-14 text-xl font-semibold tabular-nums">
                {Math.round(f.value * 100)}%
              </span>
              <span className="text-[15px]">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
