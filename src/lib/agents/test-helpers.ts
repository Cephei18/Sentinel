/** Shared builders for engine tests. Times are fixed so tests are deterministic. */
import type { Agent, AgentEvent, AgentEventKind, SpendCategory } from "./types";

/** A fixed "now" for all tests: 2026-01-01T00:00:00Z. */
export const NOW_MS = Date.UTC(2026, 0, 1);

export function makeAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: "agt_test",
    name: "Testa",
    model: "gpt-4o-mini",
    avatarSeed: "testa",
    createdAt: new Date(NOW_MS - 7 * 86_400_000).toISOString(),
    status: "active",
    authorization: {
      budgetUsdc: 100,
      perTxLimitUsdc: 5,
      expiresAt: new Date(NOW_MS + 30 * 86_400_000).toISOString(),
      categories: ["data", "compute", "services"],
      ...(overrides.authorization ?? {}),
    },
    ...overrides,
  };
}

let counter = 0;

export function makeEvent(kind: AgentEventKind, overrides: Partial<AgentEvent> = {}): AgentEvent {
  counter += 1;
  return {
    id: `ev_${counter}`,
    agentId: "agt_test",
    kind,
    label: kind,
    at: new Date(NOW_MS - counter * 60_000).toISOString(),
    ...overrides,
  };
}

export function payments(
  n: number,
  amountUsdc = 1,
  category: SpendCategory = "data",
): AgentEvent[] {
  return Array.from({ length: n }, () => makeEvent("payment_success", { amountUsdc, category }));
}

export function tasks(n: number): AgentEvent[] {
  return Array.from({ length: n }, () => makeEvent("task_completed"));
}
