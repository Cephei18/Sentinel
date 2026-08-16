import { describe, expect, it, vi } from "vitest";
import { Sentinel } from "./index";

function mockFetch(status: number, body: unknown) {
  return vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  })) as unknown as typeof fetch;
}

describe("Sentinel", () => {
  it("throws if apiKey is missing", () => {
    expect(() => new Sentinel({ apiKey: "" })).toThrow();
  });

  it("sends the API key as a Bearer token and unwraps the agent from the response", async () => {
    const fetchImpl = mockFetch(201, { agent: { id: "agt_1", name: "Scout" } });
    const sentinel = new Sentinel({
      apiKey: "sk_test",
      baseUrl: "https://api.test/v1",
      fetch: fetchImpl,
    });

    const agent = await sentinel.agents.create({
      name: "Scout",
      model: "gpt-4o-mini",
      budgetUsdc: 50,
      perTxLimitUsdc: 5,
      expiresAt: "2027-01-01T00:00:00.000Z",
      categories: ["data"],
    });

    expect(agent).toEqual({ id: "agt_1", name: "Scout" });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.test/v1/agents",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer sk_test" }),
      }),
    );
  });

  it("check() returns the guardrail verdict as-is", async () => {
    const fetchImpl = mockFetch(200, { allowed: false, reason: "over budget" });
    const sentinel = new Sentinel({
      apiKey: "sk_test",
      baseUrl: "https://api.test/v1",
      fetch: fetchImpl,
    });
    const verdict = await sentinel.check("agt_1", { amountUsdc: 100, category: "data" });
    expect(verdict).toEqual({ allowed: false, reason: "over budget" });
  });

  it("recordEvent() unwraps the event from the response envelope", async () => {
    const fetchImpl = mockFetch(201, {
      event: { id: "ev_1", agentId: "agt_1", kind: "payment_success" },
    });
    const sentinel = new Sentinel({
      apiKey: "sk_test",
      baseUrl: "https://api.test/v1",
      fetch: fetchImpl,
    });
    const event = await sentinel.recordEvent("agt_1", { kind: "payment_success", label: "Paid" });
    expect(event).toEqual({ id: "ev_1", agentId: "agt_1", kind: "payment_success" });
  });

  it("agents.trust() unwraps just the trust score", async () => {
    const fetchImpl = mockFetch(200, {
      agent: { id: "agt_1" },
      trust: { score: 84, grade: "AA" },
      spend: { spentUsdc: 5 },
    });
    const sentinel = new Sentinel({
      apiKey: "sk_test",
      baseUrl: "https://api.test/v1",
      fetch: fetchImpl,
    });
    const trust = await sentinel.agents.trust("agt_1");
    expect(trust).toEqual({ score: 84, grade: "AA" });
  });

  it("throws SentinelError with status + body on a non-2xx response", async () => {
    const fetchImpl = mockFetch(401, { error: "Invalid or revoked API key." });
    const sentinel = new Sentinel({
      apiKey: "sk_bad",
      baseUrl: "https://api.test/v1",
      fetch: fetchImpl,
    });

    await expect(
      sentinel.check("agt_1", { amountUsdc: 1, category: "data" }),
    ).rejects.toMatchObject({
      name: "SentinelError",
      status: 401,
      message: "Invalid or revoked API key.",
    });
  });
});
