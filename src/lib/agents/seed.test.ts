import { describe, expect, it } from "vitest";
import { buildSeed } from "./seed";
import { computeTrustScore } from "./reputation";
import { autonomyFor } from "./governance";
import { NOW_MS } from "./test-helpers";

/**
 * The seed workforce is the demo narrative AND the scoring canary: Atlas
 * (seasoned, clean) > Nova (newer, one wobble) > Probe (reckless, paused).
 * If a scoring change reorders them, the demo story broke — fail loudly here.
 */
describe("buildSeed", () => {
  const { agents, events } = buildSeed(NOW_MS);
  const score = (id: string) => computeTrustScore(agents.find((a) => a.id === id)!, events).score;

  it("seeds three agents with distinct trust profiles in story order", () => {
    expect(agents.map((a) => a.id)).toEqual(["agt_atlas", "agt_nova", "agt_probe"]);
    expect(score("agt_atlas")).toBeGreaterThan(score("agt_nova"));
    expect(score("agt_nova")).toBeGreaterThan(score("agt_probe"));
  });

  it("Atlas can delegate; Probe cannot", () => {
    expect(autonomyFor(score("agt_atlas")).canDelegate).toBe(true);
    expect(autonomyFor(score("agt_probe")).canDelegate).toBe(false);
  });

  it("is deterministic for a fixed now", () => {
    expect(buildSeed(NOW_MS)).toEqual(buildSeed(NOW_MS));
  });

  it("seeds an agent-to-agent edge (Atlas → Nova) for the graph", () => {
    expect(
      events.some(
        (e) =>
          e.agentId === "agt_atlas" &&
          e.kind === "payment_success" &&
          e.counterpartyId === "agt_nova",
      ),
    ).toBe(true);
  });

  it("seeds unexpired authorizations so demo actions aren't blocked on arrival", () => {
    for (const agent of agents) {
      expect(new Date(agent.authorization.expiresAt).getTime()).toBeGreaterThan(NOW_MS);
    }
  });
});
