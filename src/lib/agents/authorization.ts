/**
 * Authorization guardrails — the single implementation of "is this action
 * within the agent's granted scope?", shared by every spend path.
 *
 * Pure and deterministic like the rest of the engine: callers pass the current
 * time and the derived spend summary; the checks never read clocks or state.
 * Check order is part of the contract (first failure wins) so blocked reasons
 * are stable and testable.
 *
 * v1 runs these in the browser before recording events; the same functions are
 * the ones that move server-side to the payment boundary in the production
 * architecture (docs/ARCHITECTURE.md, ADR-006/ADR-011).
 */
import type { Agent, SpendCategory, SpendSummary } from "./types";
import { autonomyFor } from "./governance";

export interface SpendRequest {
  /** Amount to spend, USDC human units. */
  amountUsdc: number;
  category: SpendCategory;
}

export type GuardrailResult = { allowed: true } | { allowed: false; reason: string };

const allow: GuardrailResult = { allowed: true };
const block = (reason: string): GuardrailResult => ({ allowed: false, reason });

/**
 * Check a spend request against an agent's authorization.
 * Order: status → expiry → category → amount sanity → per-tx limit → budget.
 */
export function checkAuthorization(
  agent: Agent,
  spend: SpendSummary,
  request: SpendRequest,
  nowMs: number,
): GuardrailResult {
  if (agent.status !== "active")
    return block(`${agent.name} is ${agent.status} — not authorized to transact.`);
  if (new Date(agent.authorization.expiresAt).getTime() < nowMs)
    return block("Authorization has expired.");
  if (!agent.authorization.categories.includes(request.category))
    return block(`Category "${request.category}" is outside ${agent.name}'s authorization.`);
  if (!(request.amountUsdc > 0)) return block("Enter an amount greater than 0.");
  if (request.amountUsdc > agent.authorization.perTxLimitUsdc)
    return block(
      `$${request.amountUsdc} exceeds the $${agent.authorization.perTxLimitUsdc} per-transaction limit.`,
    );
  if (spend.remainingUsdc < request.amountUsdc)
    return block(`${agent.name}'s budget is exhausted.`);
  return allow;
}

/**
 * Check an agent-to-agent delegation (payer hires payee for a service).
 * Beyond the payer's own authorization: delegation is a privilege of trust
 * (Supervised workers may not delegate), and the payee must itself be active —
 * a paused or revoked worker can't take on new work or earn trust from it.
 */
export function checkDelegation(params: {
  payer: Agent;
  payerScore: number;
  payerSpend: SpendSummary;
  payee: Agent;
  amountUsdc: number;
  nowMs: number;
}): GuardrailResult {
  const { payer, payerScore, payerSpend, payee, amountUsdc, nowMs } = params;

  const authorized = checkAuthorization(
    payer,
    payerSpend,
    { amountUsdc, category: "services" },
    nowMs,
  );
  if (!authorized.allowed) return authorized;

  if (!autonomyFor(payerScore).canDelegate)
    return block(
      `${payer.name} is Supervised — it must earn higher reliability before it can delegate.`,
    );
  if (payee.status !== "active")
    return block(`${payee.name} is ${payee.status} — it can't take on new work.`);
  if (payee.id === payer.id) return block("An agent can't hire itself.");
  return allow;
}
