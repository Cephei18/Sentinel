/**
 * Governance layer — turns an agent's trust into *economic consequences*:
 * how much autonomy it gets, and how much capital it should be allocated.
 *
 * This is what makes Sentinel an operating system rather than a dashboard:
 * trust is not a vanity metric, it governs delegation authority and budgets.
 * Pure + explainable, like the rest of the engine.
 */
import type { Agent, SpendSummary } from "./types";
import type { TrustScore } from "./reputation";

export type AutonomyTier = "Supervised" | "Trusted" | "Autonomous";

export interface Autonomy {
  tier: AutonomyTier;
  /** May this worker delegate — i.e. autonomously hire and pay other workers? */
  canDelegate: boolean;
  rationale: string;
}

const AUTONOMOUS_MIN = 84; // AA+
const TRUSTED_MIN = 66; // BBB+

/** Map a trust score to a delegation/autonomy tier. */
export function autonomyFor(score: number): Autonomy {
  if (score >= AUTONOMOUS_MIN) {
    return {
      tier: "Autonomous",
      canDelegate: true,
      rationale: "Proven reliability — cleared to hire other workers and hold larger budgets.",
    };
  }
  if (score >= TRUSTED_MIN) {
    return {
      tier: "Trusted",
      canDelegate: true,
      rationale: "Operates independently within its authorized scope.",
    };
  }
  return {
    tier: "Supervised",
    canDelegate: false,
    rationale: "Reliability is unproven — high-value actions and delegation need human approval.",
  };
}

export type BudgetDirection = "increase" | "hold" | "reduce";

export interface BudgetRecommendation {
  direction: BudgetDirection;
  /** Recommended new total budget (USDC, whole units). */
  suggestedUsdc: number;
  rationale: string;
}

/**
 * Recommend a capital allocation from trust + utilization — the algorithmic
 * budgeting a founder would otherwise do by hand.
 */
export function budgetRecommendation(
  agent: Agent,
  trust: TrustScore,
  spend: SpendSummary,
): BudgetRecommendation {
  const budget = agent.authorization.budgetUsdc;
  const { utilization } = spend;

  // Proven reliability earns more capital — running near budget reinforces it.
  if (trust.score >= 80) {
    return {
      direction: "increase",
      suggestedUsdc: Math.max(budget + 1, Math.round(budget * 1.5)),
      rationale:
        utilization >= 0.6
          ? `High reliability at ${Math.round(utilization * 100)}% budget use — cleared for a larger allocation.`
          : "High reliability — cleared for a larger allocation.",
    };
  }
  // Low reliability → pull capital back.
  if (trust.score < 55) {
    return {
      direction: "reduce",
      suggestedUsdc: Math.max(1, Math.round(budget * 0.5)),
      rationale: "Reliability is below threshold — reduce allocation until it improves.",
    };
  }
  return {
    direction: "hold",
    suggestedUsdc: budget,
    rationale: "Allocation appropriate — reliability still being established.",
  };
}
