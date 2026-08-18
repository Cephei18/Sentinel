"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import { checkAuthorization } from "@/lib/agents/authorization";
import { projectScoreDelta } from "@/lib/agents/reputation";
import type { Agent, AgentEvent, SpendSummary } from "@/lib/agents/types";
import { TiltCard } from "./tilt-card";
import { fade } from "./motion-presets";

/**
 * A worked example, not production traffic — but the verdict below is computed
 * live by the actual `checkAuthorization()` guardrail (src/lib/agents/authorization.ts),
 * the same function every real spend path in the product calls. Nothing here is
 * a canned string.
 */
const AGENT: Agent = {
  id: "agt_landing_example",
  name: "Probe",
  model: "gpt-4o-mini",
  avatarSeed: "probe",
  createdAt: "2026-01-01T00:00:00.000Z",
  status: "active",
  authorization: {
    budgetUsdc: 20,
    perTxLimitUsdc: 2,
    expiresAt: "2027-01-01T00:00:00.000Z",
    categories: ["data"],
  },
};
const SPEND: SpendSummary = { spentUsdc: 3, budgetUsdc: 20, remainingUsdc: 17, utilization: 0.15 };
const REQUEST = { amountUsdc: 8, category: "data" as const };

// A thin prior track record — without it `computeTrustScore` has no payment
// attempts to reason about and falls back to a neutral baseline for every
// factor, which would make a block against a brand-new agent register as a
// (misleadingly) 0-point delta.
const PRIOR_EVENT: AgentEvent = {
  id: "landing_prior_1",
  agentId: AGENT.id,
  kind: "payment_success",
  label: "Bought a data bundle",
  amountUsdc: 1,
  category: "data",
  at: "2026-01-02T00:00:00.000Z",
};

const PRE_CHECKS = ["Status active", "Not expired", `Category "${REQUEST.category}" authorized`];

export function LiveGuardrail() {
  const [stage, setStage] = useState(0); // 0 = idle, 1..3 = checks ticking, 4 = verdict shown
  const started = useRef(false);

  const verdict = checkAuthorization(
    AGENT,
    SPEND,
    REQUEST,
    Date.parse(AGENT.authorization.expiresAt) - 1,
  );
  const delta = projectScoreDelta(
    AGENT,
    [PRIOR_EVENT],
    [
      {
        agentId: AGENT.id,
        kind: "limit_blocked",
        label: "Blocked over-limit attempt",
        amountUsdc: REQUEST.amountUsdc,
        category: REQUEST.category,
      },
    ],
  );

  const play = () => {
    if (started.current) return;
    started.current = true;
    PRE_CHECKS.forEach((_, i) => {
      setTimeout(() => setStage(i + 1), 300 + i * 260);
    });
    setTimeout(() => setStage(PRE_CHECKS.length + 1), 300 + PRE_CHECKS.length * 260 + 200);
  };

  return (
    <motion.div
      custom={4}
      variants={fade}
      initial="hidden"
      animate="show"
      onViewportEnter={play}
      viewport={{ once: true, margin: "-40px" }}
      className="relative"
    >
      <div className="bg-brand/[0.16] absolute -top-8 -left-8 size-32 rounded-full" />
      <div className="border-border/70 absolute -right-9 -bottom-8 size-24 rounded-full border" />
      <TiltCard className="bg-surface relative overflow-hidden rounded-lg p-6 shadow-2xl">
        <div className="relative flex items-center justify-between gap-2">
          <span className="text-muted text-[11px] tracking-wider uppercase">
            Authorization check
          </span>
          <span className="text-muted flex items-center gap-1.5 text-[11.5px]">
            <span
              className="bg-brand-muted size-1.5 rounded-full"
              style={{ animation: "blink 1.6s ease-in-out infinite" }}
            />
            checkAuthorization()
          </span>
        </div>
        <p className="relative mt-4.5 text-[17px] font-bold">
          {AGENT.name} wants to pay ${REQUEST.amountUsdc.toFixed(2)}
        </p>
        <p className="text-muted relative mt-0.5 text-[12.5px]">
          category: {REQUEST.category} · per-transaction cap ${AGENT.authorization.perTxLimitUsdc}
        </p>
        <div className="relative mt-5 flex flex-col gap-1.5">
          {PRE_CHECKS.map((s, i) => (
            <motion.div
              key={s}
              initial={{ opacity: 0, y: 6 }}
              animate={stage > i ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
              transition={{ duration: 0.35 }}
              className="bg-background flex items-center gap-2.5 rounded-[10px] px-3.5 py-2 text-[13.5px]"
            >
              <Check className="text-success size-3.5 shrink-0" strokeWidth={2.75} />
              <span className="flex-1">{s}</span>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={stage > PRE_CHECKS.length ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
            transition={{ duration: 0.4 }}
            className="bg-danger/20 flex items-center gap-2.5 rounded-[10px] px-3.5 py-2 text-[13.5px]"
          >
            <X className="text-danger size-3.5 shrink-0" strokeWidth={2.75} />
            <span className="text-danger flex-1">{!verdict.allowed ? verdict.reason : ""}</span>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 1.2 }}
          animate={
            stage > PRE_CHECKS.length ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.2 }
          }
          transition={{ duration: 0.4 }}
          className="bg-danger/25 relative mt-4 flex items-center justify-between gap-3 rounded-xl px-4.5 py-3"
        >
          <div>
            <p className="text-danger text-[18px] font-semibold">Blocked by guardrail</p>
            <p className="text-danger/80 mt-0.5 text-xs">No value left the wallet.</p>
          </div>
          <span className="bg-danger/30 text-danger rounded-full px-2.5 py-1 text-[13px] font-bold tabular-nums">
            Trust {delta > 0 ? "+" : ""}
            {delta}
          </span>
        </motion.div>
      </TiltCard>
    </motion.div>
  );
}
