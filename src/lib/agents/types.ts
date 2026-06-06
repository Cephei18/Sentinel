/**
 * Agent domain model — the core abstractions of the trust layer.
 *
 * Framework-agnostic (no React, no server-only imports) so the same types and
 * logic run in the browser store, in API routes, and in scripts. In Phase 1 the
 * store is client-side + localStorage; this model is the seam we swap for a DB.
 */

/** Categories an agent can be authorized to spend on. */
export const SPEND_CATEGORIES = [
  { id: "data", label: "Data & APIs", hint: "Market data, indexers, premium endpoints" },
  { id: "compute", label: "Compute", hint: "Inference, GPU time, agent runtime" },
  { id: "storage", label: "Storage", hint: "Pinning, archives, blob storage" },
  { id: "services", label: "Agent services", hint: "Paying other agents for tasks" },
] as const;

export type SpendCategory = (typeof SPEND_CATEGORIES)[number]["id"];

/** The scoped financial permission a user grants an agent. */
export interface Authorization {
  /** Total lifetime budget the agent may spend, in USDC (human units). */
  budgetUsdc: number;
  /** Hard ceiling on any single payment, in USDC. */
  perTxLimitUsdc: number;
  /** ISO timestamp after which the authorization is no longer valid. */
  expiresAt: string;
  /** Spend categories the agent is permitted to transact in. */
  categories: SpendCategory[];
}

export type AgentStatus = "active" | "paused" | "expired" | "revoked";

export interface Agent {
  id: string;
  name: string;
  /** Backing model, e.g. "gpt-4o-mini" — shown on the profile, not load-bearing. */
  model: string;
  /** Stable seed for the generated avatar gradient. */
  avatarSeed: string;
  createdAt: string;
  status: AgentStatus;
  authorization: Authorization;
}

/**
 * An immutable record of something an agent did. Trust is computed purely from
 * the event log — no mutable score is ever stored, so the score is always
 * explainable and reproducible from history.
 */
export type AgentEventKind =
  | "authorized" // user granted/updated scope
  | "payment_success" // autonomous payment settled on-chain
  | "payment_failed" // payment attempted but reverted / failed
  | "task_completed" // agent finished a requested task
  | "limit_blocked"; // guardrail stopped an over-limit attempt

export interface AgentEvent {
  id: string;
  agentId: string;
  kind: AgentEventKind;
  label: string;
  /** USDC amount involved, if any (human units). */
  amountUsdc?: number;
  category?: SpendCategory;
  /** On-chain settlement hash, if this event came from a real transaction. */
  txHash?: string;
  /** The other agent in an agent-to-agent payment (drives the trust graph edges). */
  counterpartyId?: string;
  /** Score points this event moved the agent's trust by (+/-), for explainability. */
  trustDelta?: number;
  at: string; // ISO
}

/** An event before it's persisted (no id/timestamp yet) — what callers construct. */
export type DraftEvent = Omit<AgentEvent, "id" | "at">;

/** Aggregate spend derived from the event log, vs. the granted authorization. */
export interface SpendSummary {
  spentUsdc: number;
  budgetUsdc: number;
  remainingUsdc: number;
  utilization: number; // 0..1
}
