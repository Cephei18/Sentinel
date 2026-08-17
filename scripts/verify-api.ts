/**
 * Milestone 2 (and future milestone) verification: real end-to-end proof
 * against the live API and a real Postgres database. Not a unit test —
 * every step here is a real HTTP request against a running dev server,
 * against real persisted rows.
 *
 *   pnpm dev          # in one terminal
 *   pnpm verify-api    # in another
 */
import { config } from "dotenv";
import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "../src/lib/db/client";
import { orgs, apiKeys, agents, events as eventsTable } from "../src/lib/db/schema";
import { hashApiKey } from "../src/lib/api/hash-key";
import { verifyEventChain } from "../src/lib/agents/hash-chain";
import { computeTrustScore } from "../src/lib/agents/reputation";
import { toAgentEvent } from "../src/lib/api/mappers";
import type { Agent } from "../src/lib/agents/types";

config({ path: ".env.local" });

const BASE_URL = process.env.SMOKE_TEST_BASE_URL ?? "http://localhost:3000/api/v1";

let passed = 0;
let failed = 0;

function assert(condition: unknown, message: string): void {
  if (condition) {
    console.log(`✓ ${message}`);
    passed++;
  } else {
    console.error(`✗ ${message}`);
    failed++;
  }
}

async function main() {
  console.log(`\nMilestone 2 — real end-to-end verification against ${BASE_URL}\n`);
  const db = getDb();

  // Setup: a real org + a real API key, issued the same way an operator would.
  const [org] = await db
    .insert(orgs)
    .values({ name: `milestone-2-${Date.now()}` })
    .returning();
  const rawKey = `sk_${randomBytes(24).toString("base64url")}`;
  const keyHash = await hashApiKey(rawKey);
  await db.insert(apiKeys).values({ orgId: org.id, keyHash });

  // --- Test A: request without an API key ---
  const noAuthRes = await fetch(`${BASE_URL}/agents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert(noAuthRes.status === 401, "Test A: request without API key is rejected (401)");

  // --- Test B: request with an invalid API key ---
  const badAuthRes = await fetch(`${BASE_URL}/agents`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer sk_not_a_real_key" },
    body: JSON.stringify({}),
  });
  assert(badAuthRes.status === 401, "Test B: request with an invalid API key is rejected (401)");

  // --- Test C: valid authentication ---
  const createRes = await fetch(`${BASE_URL}/agents`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${rawKey}` },
    body: JSON.stringify({
      name: "Milestone 2 Agent",
      model: "gpt-4o-mini",
      budgetUsdc: 20,
      perTxLimitUsdc: 5,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      categories: ["data"],
    }),
  });
  assert(createRes.status === 201, "Test C: valid API key is accepted (201 on create)");
  const { agent }: { agent: Agent } = await createRes.json();
  assert(Boolean(agent?.id), "Test C: response contains a created agent id");

  const [keyRow] = await db.select().from(apiKeys).where(eq(apiKeys.orgId, org.id)).limit(1);
  const rowAsText = JSON.stringify(keyRow);
  assert(
    keyRow.keyHash === keyHash && !rowAsText.includes(rawKey),
    "Test C: stored row contains only the key's hash, never the raw key",
  );

  // --- Test D: agent persistence ---
  const getRes = await fetch(`${BASE_URL}/agents/${agent.id}`, {
    headers: { Authorization: `Bearer ${rawKey}` },
  });
  const getBody = await getRes.json();
  assert(getRes.status === 200, "Test D: created agent can be retrieved");
  assert(
    getBody.agent.name === "Milestone 2 Agent",
    "Test D: retrieved agent matches what was created",
  );
  assert(
    getBody.agent.authorization.budgetUsdc === 20,
    "Test D: retrieved authorization matches what was created",
  );

  // --- Test E: event persistence + org/agent scoping ---
  const eventRes = await fetch(`${BASE_URL}/agents/${agent.id}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${rawKey}` },
    body: JSON.stringify({
      kind: "payment_success",
      label: "First settlement",
      amountUsdc: 1,
      category: "data",
    }),
  });
  assert(eventRes.status === 201, "Test E: event recorded (201)");
  const [dbEventRow] = await db
    .select()
    .from(eventsTable)
    .where(and(eq(eventsTable.agentId, agent.id), eq(eventsTable.orgId, org.id)));
  assert(
    Boolean(dbEventRow),
    "Test E: event row exists in Postgres, scoped to the right org and agent",
  );

  // --- Test F: hash chain, and tamper detection on a copy (never on the real rows) ---
  for (let i = 0; i < 2; i++) {
    await fetch(`${BASE_URL}/agents/${agent.id}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${rawKey}` },
      body: JSON.stringify({ kind: "task_completed", label: `Task ${i + 2}` }),
    });
  }
  const chainRows = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.orgId, org.id))
    .orderBy(eventsTable.at);
  assert(chainRows.length === 3, "Test F: three events now exist in this org's chain");

  const chainInput = chainRows.map((r) => ({
    ...toAgentEvent(r),
    hash: r.hash,
    prevHash: r.prevHash,
  }));
  const validResult = await verifyEventChain(chainInput);
  assert(
    validResult.valid === true,
    "Test F: the real persisted hash chain verifies as untampered",
  );

  const tamperedCopy = chainInput.map((e, i) => (i === 1 ? { ...e, amountUsdc: 999999 } : e));
  const tamperedResult = await verifyEventChain(tamperedCopy);
  assert(
    !tamperedResult.valid && tamperedResult.brokenAt === 1,
    "Test F: tampering with a COPY of event 2 is detected by chain verification",
  );

  const [recheckRow] = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.id, chainRows[1].id));
  assert(
    recheckRow.amountUsdc === chainRows[1].amountUsdc,
    "Test F: the real database row was never mutated by the tamper test",
  );

  // --- Test G: trust replay determinism, on the real persisted event history ---
  const [agentRow] = await db.select().from(agents).where(eq(agents.id, agent.id));
  const persistedEvents = chainRows.map(toAgentEvent);
  const agentForScoring: Agent = {
    id: agentRow.id,
    name: agentRow.name,
    model: agentRow.model,
    avatarSeed: agentRow.avatarSeed,
    createdAt: agentRow.createdAt.toISOString(),
    status: agentRow.status,
    authorization: {
      budgetUsdc: agentRow.budgetUsdc,
      perTxLimitUsdc: agentRow.perTxLimitUsdc,
      expiresAt: agentRow.expiresAt.toISOString(),
      categories: agentRow.categories,
    },
  };
  const run1 = computeTrustScore(agentForScoring, persistedEvents);
  const run2 = computeTrustScore(agentForScoring, persistedEvents);
  assert(
    JSON.stringify(run1) === JSON.stringify(run2),
    "Test G: trust score computed twice from the same persisted history is identical",
  );

  // ============ Milestone 3: tenant isolation — adversarial tests ============
  console.log("\n--- Tenant isolation ---\n");

  // Org B: a second, fully independent org with its own key and agent.
  const [orgB] = await db
    .insert(orgs)
    .values({ name: `milestone-3-org-b-${Date.now()}` })
    .returning();
  const rawKeyB = `sk_${randomBytes(24).toString("base64url")}`;
  await db.insert(apiKeys).values({ orgId: orgB.id, keyHash: await hashApiKey(rawKeyB) });

  const createBRes = await fetch(`${BASE_URL}/agents`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${rawKeyB}` },
    body: JSON.stringify({
      name: "Org B Agent",
      model: "gpt-4o-mini",
      budgetUsdc: 20,
      perTxLimitUsdc: 5,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      categories: ["data"],
    }),
  });
  const { agent: agentB }: { agent: Agent } = await createBRes.json();
  assert(
    createBRes.status === 201 && Boolean(agentB?.id),
    "Setup: Org B created independently, with its own agent",
  );

  // Isolation Test A: Org A's key tries to retrieve Org B's agent.
  const crossGetRes = await fetch(`${BASE_URL}/agents/${agentB.id}`, {
    headers: { Authorization: `Bearer ${rawKey}` },
  });
  assert(
    crossGetRes.status === 404,
    "Isolation Test A: Org A's key cannot retrieve Org B's agent (404, not the data)",
  );

  // Isolation Test B: Org A's key tries to create an event for Org B's agent.
  const crossEventRes = await fetch(`${BASE_URL}/agents/${agentB.id}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${rawKey}` },
    body: JSON.stringify({ kind: "payment_success", label: "Cross-tenant attempt", amountUsdc: 1 }),
  });
  assert(
    crossEventRes.status === 404,
    "Isolation Test B: Org A's key cannot create an event for Org B's agent",
  );
  const [leakedEvent] = await db
    .select()
    .from(eventsTable)
    .where(and(eq(eventsTable.agentId, agentB.id), eq(eventsTable.label, "Cross-tenant attempt")));
  assert(!leakedEvent, "Isolation Test B: no such event was actually written to the database");

  // Isolation Test C: Org A's key tries to list Org B's agent's events.
  const crossListRes = await fetch(`${BASE_URL}/agents/${agentB.id}/events`, {
    headers: { Authorization: `Bearer ${rawKey}` },
  });
  const crossListBody = await crossListRes.json();
  assert(
    crossListRes.status === 200 &&
      Array.isArray(crossListBody.events) &&
      crossListBody.events.length === 0,
    "Isolation Test C: Org A's key sees zero events when querying Org B's agent (no data leaked)",
  );

  // Fifth DB-backed route: the guardrail check, tested the same way.
  const crossCheckRes = await fetch(`${BASE_URL}/agents/${agentB.id}/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${rawKey}` },
    body: JSON.stringify({ amountUsdc: 1, category: "data" }),
  });
  assert(
    crossCheckRes.status === 404,
    "Isolation Test (check route): Org A's key cannot run a guardrail check against Org B's agent",
  );

  // Sanity check: isolation isn't over-blocking — Org B's own key still works on its own agent.
  const ownGetRes = await fetch(`${BASE_URL}/agents/${agentB.id}`, {
    headers: { Authorization: `Bearer ${rawKeyB}` },
  });
  assert(ownGetRes.status === 200, "Sanity: Org B's own key can still retrieve Org B's own agent");

  console.log(`\n${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
