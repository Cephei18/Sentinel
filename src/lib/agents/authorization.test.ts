import { describe, expect, it } from "vitest";
import { checkAuthorization, checkDelegation } from "./authorization";
import { computeSpend } from "./reputation";
import { makeAgent, NOW_MS, payments } from "./test-helpers";

const spendOf = (agent = makeAgent(), events = payments(0)) => computeSpend(agent, events);

describe("checkAuthorization", () => {
  const request = { amountUsdc: 1, category: "data" as const };

  it("allows an in-scope request", () => {
    expect(checkAuthorization(makeAgent(), spendOf(), request, NOW_MS)).toEqual({
      allowed: true,
    });
  });

  it("blocks paused and revoked agents (status wins over everything)", () => {
    for (const status of ["paused", "revoked", "expired"] as const) {
      const verdict = checkAuthorization(makeAgent({ status }), spendOf(), request, NOW_MS);
      expect(verdict.allowed).toBe(false);
      if (!verdict.allowed) expect(verdict.reason).toContain(status);
    }
  });

  it("blocks after the authorization expires", () => {
    const agent = makeAgent();
    const past = new Date(NOW_MS - 1000).toISOString();
    const expired = makeAgent({ authorization: { ...agent.authorization, expiresAt: past } });
    const verdict = checkAuthorization(expired, spendOf(expired), request, NOW_MS);
    expect(verdict).toEqual({ allowed: false, reason: "Authorization has expired." });
  });

  it("blocks spend outside the authorized categories", () => {
    const agent = makeAgent();
    const dataOnly = makeAgent({
      authorization: { ...agent.authorization, categories: ["data"] },
    });
    const verdict = checkAuthorization(
      dataOnly,
      spendOf(dataOnly),
      { amountUsdc: 1, category: "compute" },
      NOW_MS,
    );
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toContain('"compute"');
  });

  it("blocks non-positive amounts", () => {
    for (const amountUsdc of [0, -5, NaN]) {
      const verdict = checkAuthorization(
        makeAgent(),
        spendOf(),
        { amountUsdc, category: "data" },
        NOW_MS,
      );
      expect(verdict.allowed).toBe(false);
    }
  });

  it("blocks amounts above the per-transaction limit", () => {
    const verdict = checkAuthorization(
      makeAgent(), // perTx 5
      spendOf(),
      { amountUsdc: 5.01, category: "data" },
      NOW_MS,
    );
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toContain("per-transaction limit");
  });

  it("blocks when the remaining budget can't cover the amount", () => {
    const agent = makeAgent(); // budget 100
    const nearlySpent = payments(33, 3); // 99 spent → 1 remaining
    const verdict = checkAuthorization(
      agent,
      spendOf(agent, nearlySpent),
      { amountUsdc: 2, category: "data" },
      NOW_MS,
    );
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toContain("budget");
  });

  it("first failure wins: a paused agent reports status, not budget", () => {
    const paused = makeAgent({ status: "paused" });
    const verdict = checkAuthorization(
      paused,
      spendOf(paused, payments(40, 3)),
      { amountUsdc: 50, category: "data" },
      NOW_MS,
    );
    if (!verdict.allowed) expect(verdict.reason).toContain("paused");
  });
});

describe("checkDelegation", () => {
  const base = {
    payer: makeAgent({ id: "agt_payer", name: "Payer" }),
    payerScore: 80, // Trusted → may delegate
    payerSpend: spendOf(makeAgent()),
    payee: makeAgent({ id: "agt_payee", name: "Payee" }),
    amountUsdc: 2,
    nowMs: NOW_MS,
  };

  it("allows a trusted payer hiring an active payee within scope", () => {
    expect(checkDelegation(base)).toEqual({ allowed: true });
  });

  it("blocks Supervised payers — delegation is earned", () => {
    const verdict = checkDelegation({ ...base, payerScore: 60 });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toContain("Supervised");
  });

  it("blocks payers not authorized for the services category", () => {
    const payer = makeAgent({
      id: "agt_payer",
      name: "Payer",
      authorization: { ...makeAgent().authorization, categories: ["data"] },
    });
    const verdict = checkDelegation({ ...base, payer });
    expect(verdict.allowed).toBe(false);
  });

  it("blocks paused/revoked payees — inactive workers can't take on work", () => {
    for (const status of ["paused", "revoked"] as const) {
      const verdict = checkDelegation({
        ...base,
        payee: makeAgent({ id: "agt_payee", name: "Payee", status }),
      });
      expect(verdict.allowed).toBe(false);
      if (!verdict.allowed) expect(verdict.reason).toContain("Payee");
    }
  });

  it("blocks self-hiring", () => {
    const verdict = checkDelegation({ ...base, payee: base.payer });
    expect(verdict.allowed).toBe(false);
  });

  it("enforces the payer's per-tx and budget limits", () => {
    expect(checkDelegation({ ...base, amountUsdc: 6 }).allowed).toBe(false); // perTx 5
    const drained = spendOf(makeAgent(), payments(33, 3)); // 1 remaining
    expect(checkDelegation({ ...base, payerSpend: drained, amountUsdc: 2 }).allowed).toBe(false);
  });
});
