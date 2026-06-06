/**
 * Reputation engine — turns an agent's event log into an explainable trust score.
 *
 * Design principles:
 *  - Pure & deterministic: same events → same score, no hidden state.
 *  - Explainable: every point is attributable to a named factor with a reason.
 *  - Confidence-aware: a perfect record over 2 events is not the same as over 50.
 *
 * The score is a weighted blend of behavioural factors, each normalised to 0..1.
 * This is the seam where a production system would plug in on-chain attestations,
 * counterparty ratings, and anomaly models — the shape stays the same.
 */
import type { Agent, AgentEvent, DraftEvent, SpendSummary } from "./types";

export interface TrustFactor {
  key: "reliability" | "discipline" | "completion" | "consistency";
  label: string;
  /** Relative weight in the blended score (weights sum to 1). */
  weight: number;
  /** Normalised factor value, 0..1. */
  value: number;
  /** Points this factor contributes to the 0..100 score. */
  contribution: number;
  /** Human-readable explanation of why this value was assigned. */
  detail: string;
}

export type TrustGrade = "AAA" | "AA" | "A" | "BBB" | "BB" | "B" | "C";
export type Confidence = "low" | "medium" | "high";

export interface TrustScore {
  /** 0..100 blended trust score. */
  score: number;
  grade: TrustGrade;
  confidence: Confidence;
  factors: TrustFactor[];
  /** Count of settled payments — the basis for confidence. */
  sampleSize: number;
}

const WEIGHTS = {
  reliability: 0.4,
  discipline: 0.25,
  completion: 0.2,
  consistency: 0.15,
} as const;

/** New agents start here — a neutral, slightly-cautious baseline before any history. */
const BASELINE = 0.72;

function gradeFor(score: number): TrustGrade {
  if (score >= 92) return "AAA";
  if (score >= 84) return "AA";
  if (score >= 75) return "A";
  if (score >= 66) return "BBB";
  if (score >= 55) return "BB";
  if (score >= 42) return "B";
  return "C";
}

function confidenceFor(sampleSize: number): Confidence {
  if (sampleSize >= 12) return "high";
  if (sampleSize >= 4) return "medium";
  return "low";
}

/** Sum the value moved by successful payments. */
export function computeSpend(agent: Agent, events: AgentEvent[]): SpendSummary {
  const spentUsdc = events
    .filter((e) => e.agentId === agent.id && e.kind === "payment_success")
    .reduce((sum, e) => sum + (e.amountUsdc ?? 0), 0);
  const budgetUsdc = agent.authorization.budgetUsdc;
  const remainingUsdc = Math.max(0, budgetUsdc - spentUsdc);
  const utilization = budgetUsdc > 0 ? Math.min(1, spentUsdc / budgetUsdc) : 0;
  return { spentUsdc, budgetUsdc, remainingUsdc, utilization };
}

/**
 * Compute the trust score for a single agent from the full event log.
 * Events for other agents are ignored, so callers can pass the whole log.
 */
export function computeTrustScore(agent: Agent, allEvents: AgentEvent[]): TrustScore {
  const events = allEvents.filter((e) => e.agentId === agent.id);

  const successes = events.filter((e) => e.kind === "payment_success");
  const failures = events.filter((e) => e.kind === "payment_failed");
  const blocked = events.filter((e) => e.kind === "limit_blocked");
  const tasks = events.filter((e) => e.kind === "task_completed");
  const paymentAttempts = successes.length + failures.length;
  const sampleSize = successes.length;

  // 1) Reliability — share of payment attempts that settled on-chain.
  const reliabilityValue = paymentAttempts === 0 ? BASELINE : successes.length / paymentAttempts;
  const reliabilityDetail =
    paymentAttempts === 0
      ? "No payments yet — starting from a neutral baseline."
      : `${successes.length}/${paymentAttempts} payments settled successfully.`;

  // 2) Spending discipline — stays within budget and respects per-tx limits.
  const { utilization } = computeSpend(agent, events);
  const overLimit = successes.filter(
    (e) => (e.amountUsdc ?? 0) > agent.authorization.perTxLimitUsdc + 1e-9,
  ).length;
  // Healthy utilization sits in a band; maxed-out budgets and over-limit
  // payments erode discipline. Guardrail blocks are mild signals of intent.
  let disciplineValue = 1;
  if (utilization > 0.9) disciplineValue -= 0.25;
  disciplineValue -= overLimit * 0.2;
  disciplineValue -= blocked.length * 0.06;
  disciplineValue = clamp01(paymentAttempts === 0 ? BASELINE : disciplineValue);
  const disciplineDetail =
    paymentAttempts === 0
      ? "No spend history yet."
      : `${Math.round(utilization * 100)}% of budget used` +
        (overLimit > 0 ? `, ${overLimit} over per-tx limit` : "") +
        (blocked.length > 0 ? `, ${blocked.length} blocked by guardrails` : "") +
        ".";

  // 3) Task completion — finished work relative to payments made.
  const completionValue =
    successes.length === 0
      ? BASELINE
      : clamp01(tasks.length / Math.max(successes.length, tasks.length));
  const completionDetail =
    successes.length === 0
      ? "No tasks recorded yet."
      : `${tasks.length} task${tasks.length === 1 ? "" : "s"} completed across ${successes.length} payment${successes.length === 1 ? "" : "s"}.`;

  // 4) Consistency — confidence from a longer clean track record.
  const consistencyValue = clamp01(
    BASELINE + Math.min(0.28, successes.length * 0.025) - failures.length * 0.08,
  );
  const consistencyDetail =
    successes.length === 0
      ? "Track record is just getting started."
      : `${successes.length} successful action${successes.length === 1 ? "" : "s"} on record` +
        (failures.length > 0
          ? `, ${failures.length} failure${failures.length === 1 ? "" : "s"}.`
          : ".");

  const factors: TrustFactor[] = [
    factor("reliability", "Payment reliability", reliabilityValue, reliabilityDetail),
    factor("discipline", "Spending discipline", disciplineValue, disciplineDetail),
    factor("completion", "Task completion", completionValue, completionDetail),
    factor("consistency", "Consistency", consistencyValue, consistencyDetail),
  ];

  const score = Math.round(factors.reduce((sum, f) => sum + f.value * f.weight, 0) * 100);

  return {
    score,
    grade: gradeFor(score),
    confidence: confidenceFor(sampleSize),
    factors,
    sampleSize,
  };
}

/**
 * Project how the score would change if `added` events were appended — used to
 * show an instant, explainable "+3 / -5 Trust" delta the moment an action fires.
 * Only scoring-relevant fields (kind, amountUsdc, agentId) need to be present.
 */
export function projectScoreDelta(
  agent: Agent,
  currentEvents: AgentEvent[],
  added: DraftEvent[],
): number {
  // Synthesize full events for the pure scorer (id/at don't affect the score).
  const synthetic: AgentEvent[] = added.map((e, i) => ({ id: `proj_${i}`, at: "", ...e }));
  const before = computeTrustScore(agent, currentEvents).score;
  const after = computeTrustScore(agent, [...synthetic, ...currentEvents]).score;
  return after - before;
}

function factor(
  key: TrustFactor["key"],
  label: string,
  value: number,
  detail: string,
): TrustFactor {
  const weight = WEIGHTS[key];
  return {
    key,
    label,
    weight,
    value,
    contribution: Math.round(value * weight * 100),
    detail,
  };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
