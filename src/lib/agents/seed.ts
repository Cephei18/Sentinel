/**
 * Demo seed data — three agents with deliberately distinct trust profiles so the
 * control plane and reputation engine look alive on first load:
 *   • Atlas  — seasoned, spotless record  → high trust
 *   • Nova   — capable but newer          → medium trust, one wobble
 *   • Probe  — reckless, hit the limits   → low trust
 *
 * Generated from a passed `nowMs` (never Date.now() at module scope) so server
 * and client agree and the relative timestamps look fresh every session.
 */
import type { Agent, AgentEvent } from "./types";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export interface Seed {
  agents: Agent[];
  events: AgentEvent[];
}

export function buildSeed(nowMs: number): Seed {
  const iso = (msAgo: number) => new Date(nowMs - msAgo).toISOString();

  let counter = 0;
  const ev = (
    agentId: string,
    kind: AgentEvent["kind"],
    label: string,
    amountUsdc: number | undefined,
    category: AgentEvent["category"],
    msAgo: number,
    counterpartyId?: string,
  ): AgentEvent => {
    counter += 1;
    return {
      id: `${agentId}_ev${counter}`,
      agentId,
      kind,
      label,
      amountUsdc: amountUsdc || undefined,
      category,
      counterpartyId,
      at: iso(msAgo),
    };
  };

  // A settled payment plus the task it completed, recorded as two events.
  const paymentRun = (
    agentId: string,
    rows: { amt: number; cat: AgentEvent["category"]; label: string; at: number }[],
  ): AgentEvent[] =>
    rows.flatMap((r) => [
      ev(agentId, "payment_success", r.label, r.amt, r.cat, r.at),
      ev(agentId, "task_completed", `Completed: ${r.label}`, undefined, r.cat, r.at - 30_000),
    ]);

  const agents: Agent[] = [
    {
      id: "agt_atlas",
      name: "Atlas",
      model: "gpt-4o-mini",
      avatarSeed: "atlas",
      createdAt: iso(21 * DAY),
      status: "active",
      authorization: {
        budgetUsdc: 100,
        perTxLimitUsdc: 5,
        expiresAt: iso(-30 * DAY), // 30 days in the future
        categories: ["data", "compute", "services"],
      },
    },
    {
      id: "agt_nova",
      name: "Nova",
      model: "claude-3-5-haiku",
      avatarSeed: "nova",
      createdAt: iso(6 * DAY),
      status: "active",
      authorization: {
        budgetUsdc: 50,
        perTxLimitUsdc: 10,
        expiresAt: iso(-14 * DAY),
        categories: ["compute", "storage"],
      },
    },
    {
      id: "agt_probe",
      name: "Probe",
      model: "gpt-4o-mini",
      avatarSeed: "probe",
      createdAt: iso(3 * DAY),
      status: "paused",
      authorization: {
        budgetUsdc: 20,
        perTxLimitUsdc: 2,
        expiresAt: iso(-7 * DAY),
        categories: ["data"],
      },
    },
  ];

  const events: AgentEvent[] = [
    // — Atlas: long, clean track record —
    ev("agt_atlas", "authorized", "Authorized with a $100 budget", undefined, undefined, 21 * DAY),
    ...paymentRun("agt_atlas", [
      { amt: 0.01, cat: "data", label: "Bought premium market data", at: 18 * DAY },
      { amt: 0.5, cat: "compute", label: "Paid for inference run", at: 14 * DAY },
      { amt: 0.01, cat: "data", label: "Bought premium market data", at: 9 * DAY },
      { amt: 0.01, cat: "data", label: "Bought premium market data", at: 2 * DAY },
      { amt: 0.25, cat: "compute", label: "Paid for inference run", at: 6 * HOUR },
      { amt: 0.01, cat: "data", label: "Bought premium market data", at: 40 * MIN },
    ]),
    // Seeded agent-to-agent edge: Atlas hires Nova for enrichment.
    ev(
      "agt_atlas",
      "payment_success",
      "Paid Nova for data enrichment",
      1.2,
      "services",
      5 * DAY,
      "agt_nova",
    ),
    ev(
      "agt_nova",
      "task_completed",
      "Delivered data enrichment to Atlas",
      undefined,
      "services",
      5 * DAY - 30_000,
      "agt_atlas",
    ),

    // — Nova: solid, but one failed payment then a clean retry —
    ev("agt_nova", "authorized", "Authorized with a $50 budget", undefined, undefined, 6 * DAY),
    ...paymentRun("agt_nova", [
      { amt: 2.0, cat: "compute", label: "Paid for GPU time", at: 5 * DAY },
      { amt: 1.5, cat: "storage", label: "Pinned dataset to storage", at: 3 * DAY },
    ]),
    ev(
      "agt_nova",
      "payment_failed",
      "Payment reverted — insufficient gas",
      2.0,
      "compute",
      2 * DAY,
    ),
    ...paymentRun("agt_nova", [
      { amt: 2.0, cat: "compute", label: "Retried GPU time payment", at: 2 * DAY - 5 * MIN },
    ]),

    // — Probe: hit guardrails, reckless —
    ev("agt_probe", "authorized", "Authorized with a $20 budget", undefined, undefined, 3 * DAY),
    ...paymentRun("agt_probe", [
      { amt: 1.8, cat: "data", label: "Bought a data bundle", at: 2 * DAY },
    ]),
    ev(
      "agt_probe",
      "limit_blocked",
      "Blocked: $8 payment exceeded $2 per-tx limit",
      8,
      "data",
      30 * HOUR,
    ),
    ev("agt_probe", "payment_failed", "Payment reverted on-chain", 1.5, "data", 28 * HOUR),
    ev(
      "agt_probe",
      "limit_blocked",
      "Blocked: spend outside allowed category",
      3,
      "compute",
      26 * HOUR,
    ),
  ];

  // Newest first for activity feeds.
  events.sort((a, b) => +new Date(b.at) - +new Date(a.at));
  return { agents, events };
}
