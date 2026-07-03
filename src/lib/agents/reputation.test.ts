import { describe, expect, it } from "vitest";
import { computeSpend, computeTrustScore, projectScoreDelta } from "./reputation";
import { makeAgent, makeEvent, payments, tasks } from "./test-helpers";

describe("computeSpend", () => {
  it("sums only this agent's settled payments", () => {
    const agent = makeAgent();
    const events = [
      ...payments(2, 3), // 6 spent
      makeEvent("payment_success", { agentId: "agt_other", amountUsdc: 50 }),
      makeEvent("payment_failed", { amountUsdc: 10 }), // failed → not spent
      makeEvent("limit_blocked", { amountUsdc: 10 }), // blocked → not spent
    ];
    const spend = computeSpend(agent, events);
    expect(spend.spentUsdc).toBe(6);
    expect(spend.remainingUsdc).toBe(94);
    expect(spend.utilization).toBeCloseTo(0.06);
  });

  it("never reports negative remaining and caps utilization at 1", () => {
    const agent = makeAgent({ authorization: { ...makeAgent().authorization, budgetUsdc: 5 } });
    const spend = computeSpend(agent, payments(3, 3)); // 9 > 5
    expect(spend.remainingUsdc).toBe(0);
    expect(spend.utilization).toBe(1);
  });
});

describe("computeTrustScore", () => {
  it("starts a new agent at the cautious baseline (72, low confidence)", () => {
    const trust = computeTrustScore(makeAgent(), []);
    expect(trust.score).toBe(72);
    expect(trust.grade).toBe("BBB");
    expect(trust.confidence).toBe("low");
    expect(trust.sampleSize).toBe(0);
  });

  it("is deterministic: same events → same score", () => {
    const agent = makeAgent();
    const events = [...payments(5), ...tasks(5), makeEvent("payment_failed")];
    expect(computeTrustScore(agent, events)).toEqual(computeTrustScore(agent, events));
  });

  it("ignores other agents' events", () => {
    const agent = makeAgent();
    const noise = [
      makeEvent("payment_failed", { agentId: "agt_other" }),
      makeEvent("limit_blocked", { agentId: "agt_other" }),
    ];
    expect(computeTrustScore(agent, noise).score).toBe(72);
  });

  it("rewards a clean settled record (reliability = 1)", () => {
    const trust = computeTrustScore(makeAgent(), [...payments(10), ...tasks(10)]);
    const reliability = trust.factors.find((f) => f.key === "reliability")!;
    expect(reliability.value).toBe(1);
    expect(trust.score).toBeGreaterThan(85);
  });

  it("failed payments lower reliability and consistency", () => {
    const agent = makeAgent();
    const clean = computeTrustScore(agent, [...payments(5), ...tasks(5)]).score;
    const wobbly = computeTrustScore(agent, [
      ...payments(5),
      ...tasks(5),
      makeEvent("payment_failed", { amountUsdc: 1 }),
    ]).score;
    expect(wobbly).toBeLessThan(clean);
  });

  it("guardrail blocks erode discipline mildly", () => {
    const agent = makeAgent();
    const base = computeTrustScore(agent, [...payments(5), ...tasks(5)]);
    const blocked = computeTrustScore(agent, [
      ...payments(5),
      ...tasks(5),
      makeEvent("limit_blocked", { amountUsdc: 50 }),
    ]);
    const d = (t: typeof base) => t.factors.find((f) => f.key === "discipline")!.value;
    expect(d(blocked)).toBeCloseTo(d(base) - 0.06, 5);
    expect(blocked.score).toBeLessThanOrEqual(base.score);
  });

  it("penalizes settles above the per-tx limit and near-exhausted budgets", () => {
    const agent = makeAgent(); // perTx 5, budget 100
    const disciplined = computeTrustScore(agent, [...payments(4, 2), ...tasks(4)]);
    const overLimit = computeTrustScore(agent, [
      ...payments(3, 2),
      makeEvent("payment_success", { amountUsdc: 9 }), // > perTx 5
      ...tasks(4),
    ]);
    const maxedOut = computeTrustScore(agent, [...payments(4, 24), ...tasks(4)]); // 96% used
    const d = (t: typeof disciplined) => t.factors.find((f) => f.key === "discipline")!.value;
    expect(d(overLimit)).toBeLessThan(d(disciplined));
    expect(d(maxedOut)).toBeLessThan(d(disciplined));
  });

  it("task completion tracks delivered work per payment", () => {
    const agent = makeAgent();
    const lazy = computeTrustScore(agent, payments(4)); // 0 tasks
    const diligent = computeTrustScore(agent, [...payments(4), ...tasks(4)]);
    const c = (t: typeof lazy) => t.factors.find((f) => f.key === "completion")!.value;
    expect(c(lazy)).toBe(0);
    expect(c(diligent)).toBe(1);
  });

  it("confidence grows with settled sample size (4 → medium, 12 → high)", () => {
    const agent = makeAgent();
    expect(computeTrustScore(agent, payments(3)).confidence).toBe("low");
    expect(computeTrustScore(agent, payments(4)).confidence).toBe("medium");
    expect(computeTrustScore(agent, payments(12)).confidence).toBe("high");
  });

  it("every factor carries a human-readable explanation and weights sum to 1", () => {
    const trust = computeTrustScore(makeAgent(), [...payments(3), ...tasks(2)]);
    for (const f of trust.factors) {
      expect(f.detail.length).toBeGreaterThan(0);
      expect(f.value).toBeGreaterThanOrEqual(0);
      expect(f.value).toBeLessThanOrEqual(1);
    }
    expect(trust.factors.reduce((s, f) => s + f.weight, 0)).toBeCloseTo(1);
  });
});

describe("projectScoreDelta", () => {
  it("previews exactly the delta that recording the events would cause", () => {
    const agent = makeAgent();
    const current = [...payments(3), ...tasks(3)];
    const added = [makeEvent("payment_failed", { amountUsdc: 2 })];
    const delta = projectScoreDelta(agent, current, added);
    const before = computeTrustScore(agent, current).score;
    const after = computeTrustScore(agent, [...added, ...current]).score;
    expect(delta).toBe(after - before);
    expect(delta).toBeLessThan(0);
  });
});
