/**
 * DB row → domain type mappers. Keeps the Drizzle schema and the pure
 * engine's Agent/AgentEvent types decoupled: routes map once at the
 * boundary, then call checkAuthorization/computeTrustScore/etc. exactly
 * as the rest of the app does.
 */
import type { Agent, AgentEvent } from "@/lib/agents/types";
import type { agents, events } from "@/lib/db/schema";

type AgentRow = typeof agents.$inferSelect;
type EventRow = typeof events.$inferSelect;

export function toAgent(row: AgentRow): Agent {
  return {
    id: row.id,
    name: row.name,
    model: row.model,
    avatarSeed: row.avatarSeed,
    createdAt: row.createdAt.toISOString(),
    status: row.status,
    authorization: {
      budgetUsdc: row.budgetUsdc,
      perTxLimitUsdc: row.perTxLimitUsdc,
      expiresAt: row.expiresAt.toISOString(),
      categories: row.categories,
    },
  };
}

export function toAgentEvent(row: EventRow): AgentEvent {
  return {
    id: row.id,
    agentId: row.agentId,
    kind: row.kind,
    label: row.label,
    amountUsdc: row.amountUsdc ?? undefined,
    category: row.category ?? undefined,
    txHash: row.txHash ?? undefined,
    counterpartyId: row.counterpartyId ?? undefined,
    trustDelta: row.trustDelta ?? undefined,
    at: row.at.toISOString(),
  };
}
