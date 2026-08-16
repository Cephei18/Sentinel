import { describe, expect, it } from "vitest";
import { computeEventHash, verifyEventChain, type HashableEvent } from "./hash-chain";

function event(overrides: Partial<HashableEvent> = {}): HashableEvent {
  return {
    agentId: "agt_atlas",
    kind: "payment_success",
    label: "Paid for data",
    amountUsdc: 1.5,
    category: "data",
    txHash: undefined,
    counterpartyId: undefined,
    trustDelta: 3,
    at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("computeEventHash", () => {
  it("is deterministic: same prevHash + event always produces the same hash", async () => {
    const a = await computeEventHash(null, event());
    const b = await computeEventHash(null, event());
    expect(a).toBe(b);
  });

  it("changes when any hashable field changes", async () => {
    const base = await computeEventHash(null, event());
    const differentAmount = await computeEventHash(null, event({ amountUsdc: 2 }));
    const differentLabel = await computeEventHash(null, event({ label: "Paid for compute" }));
    expect(differentAmount).not.toBe(base);
    expect(differentLabel).not.toBe(base);
  });

  it("changes when prevHash changes, even for an identical event", async () => {
    const genesis = await computeEventHash(null, event());
    const chained = await computeEventHash("some-other-hash", event());
    expect(chained).not.toBe(genesis);
  });

  it("produces a 64-character hex string (SHA-256)", async () => {
    const hash = await computeEventHash(null, event());
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("verifyEventChain", () => {
  it("validates a correctly chained sequence", async () => {
    const e1 = event({ label: "first" });
    const h1 = await computeEventHash(null, e1);
    const e2 = event({ label: "second" });
    const h2 = await computeEventHash(h1, e2);

    const result = await verifyEventChain([
      { ...e1, hash: h1, prevHash: null },
      { ...e2, hash: h2, prevHash: h1 },
    ]);
    expect(result).toEqual({ valid: true });
  });

  it("detects a tampered event", async () => {
    const e1 = event({ label: "first" });
    const h1 = await computeEventHash(null, e1);
    const e2 = event({ label: "second" });
    const h2 = await computeEventHash(h1, e2);

    const result = await verifyEventChain([
      { ...e1, hash: h1, prevHash: null },
      // Tampered: amount changed after the hash was computed.
      { ...e2, amountUsdc: 999, hash: h2, prevHash: h1 },
    ]);
    expect(result).toEqual({ valid: false, brokenAt: 1 });
  });

  it("detects a broken prevHash link", async () => {
    const e1 = event({ label: "first" });
    const h1 = await computeEventHash(null, e1);
    const e2 = event({ label: "second" });
    const h2 = await computeEventHash(h1, e2);

    const result = await verifyEventChain([
      { ...e1, hash: h1, prevHash: null },
      { ...e2, hash: h2, prevHash: "wrong-prev-hash" },
    ]);
    expect(result).toEqual({ valid: false, brokenAt: 1 });
  });
});
