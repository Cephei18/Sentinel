import { describe, expect, it } from "vitest";
import { autonomyFor, budgetRecommendation } from "./governance";
import { computeSpend, computeTrustScore } from "./reputation";
import { makeAgent, makeEvent, payments, tasks } from "./test-helpers";

describe("autonomyFor", () => {
  it("maps score bands to tiers with delegation rights", () => {
    expect(autonomyFor(95)).toMatchObject({ tier: "Autonomous", canDelegate: true });
    expect(autonomyFor(84)).toMatchObject({ tier: "Autonomous", canDelegate: true });
    expect(autonomyFor(83)).toMatchObject({ tier: "Trusted", canDelegate: true });
    expect(autonomyFor(66)).toMatchObject({ tier: "Trusted", canDelegate: true });
    expect(autonomyFor(65)).toMatchObject({ tier: "Supervised", canDelegate: false });
    expect(autonomyFor(0)).toMatchObject({ tier: "Supervised", canDelegate: false });
  });

  it("a brand-new agent (baseline 72) starts Trusted but not Autonomous", () => {
    const trust = computeTrustScore(makeAgent(), []);
    expect(autonomyFor(trust.score).tier).toBe("Trusted");
  });

  it("always explains itself", () => {
    for (const score of [10, 70, 90]) {
      expect(autonomyFor(score).rationale.length).toBeGreaterThan(0);
    }
  });
});

describe("budgetRecommendation", () => {
  const agent = makeAgent(); // budget 100

  function recFor(events = payments(0)) {
    const trust = computeTrustScore(agent, events);
    const spend = computeSpend(agent, events);
    return { trust, rec: budgetRecommendation(agent, trust, spend) };
  }

  it("recommends increasing capital for highly reliable agents (score ≥ 80)", () => {
    const { trust, rec } = recFor([...payments(12), ...tasks(12)]);
    expect(trust.score).toBeGreaterThanOrEqual(80);
    expect(rec.direction).toBe("increase");
    expect(rec.suggestedUsdc).toBe(150); // ×1.5
  });

  it("recommends holding for unproven agents", () => {
    const { trust, rec } = recFor([]);
    expect(trust.score).toBeGreaterThanOrEqual(55);
    expect(trust.score).toBeLessThan(80);
    expect(rec.direction).toBe("hold");
    expect(rec.suggestedUsdc).toBe(100);
  });

  it("recommends pulling capital back when reliability collapses (score < 55)", () => {
    // 1 settled payment vs 5 failures tanks reliability + consistency.
    const failures = Array.from({ length: 5 }, () =>
      makeEvent("payment_failed", { amountUsdc: 1 }),
    );
    const { trust, rec } = recFor([...payments(1), ...failures]);
    expect(trust.score).toBeLessThan(55);
    expect(rec.direction).toBe("reduce");
    expect(rec.suggestedUsdc).toBe(50); // ×0.5
  });

  it("never recommends a zero or negative budget", () => {
    const tiny = makeAgent({ authorization: { ...agent.authorization, budgetUsdc: 1 } });
    const failures = Array.from({ length: 5 }, () =>
      makeEvent("payment_failed", { amountUsdc: 1 }),
    );
    const trust = computeTrustScore(tiny, [...payments(1), ...failures]);
    expect(trust.score).toBeLessThan(55);
    const rec = budgetRecommendation(tiny, trust, computeSpend(tiny, []));
    expect(rec.suggestedUsdc).toBeGreaterThanOrEqual(1);
  });
});
