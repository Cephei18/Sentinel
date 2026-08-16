/**
 * End-to-end smoke test for the hosted API + SDK: issues a fresh API key,
 * creates an agent, runs a blocked check (over the per-tx limit) and an
 * allowed one, records an event, and confirms the trust score moved.
 * Exercises the real SDK package against a running dev server — a walk of
 * the whole system, not a unit test.
 *
 *   pnpm dev                 # in one terminal
 *   pnpm sdk-smoke-test      # in another
 */
import { config } from "dotenv";
import { randomBytes } from "node:crypto";
import { getDb } from "../src/lib/db/client";
import { orgs, apiKeys } from "../src/lib/db/schema";
import { hashApiKey } from "../src/lib/api/hash-key";
import { Sentinel } from "../packages/sdk/src/index";

config({ path: ".env.local" });

const BASE_URL = process.env.SMOKE_TEST_BASE_URL ?? "http://localhost:3000/api/v1";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    console.error(`✗ ${message}`);
    process.exit(1);
  }
  console.log(`✓ ${message}`);
}

async function main() {
  console.log(`\nRunning against ${BASE_URL}\n`);

  // 1. Issue a throwaway org + key for this run.
  const db = getDb();
  const [org] = await db
    .insert(orgs)
    .values({ name: `smoke-test-${Date.now()}` })
    .returning();
  const rawKey = `sk_${randomBytes(24).toString("base64url")}`;
  await db.insert(apiKeys).values({ orgId: org.id, keyHash: await hashApiKey(rawKey) });

  const sentinel = new Sentinel({ apiKey: rawKey, baseUrl: BASE_URL });

  // 2. Create an agent with a small budget.
  const agent = await sentinel.agents.create({
    name: "Smoke Test Agent",
    model: "gpt-4o-mini",
    budgetUsdc: 10,
    perTxLimitUsdc: 5,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    categories: ["data"],
  });
  assert(agent.id, "agent created");

  // 3. A check over the per-tx limit must be blocked.
  const blocked = await sentinel.check(agent.id, { amountUsdc: 8, category: "data" });
  assert(blocked.allowed === false, "over-limit check is blocked");

  // 4. A check within limits must be allowed.
  const allowed = await sentinel.check(agent.id, { amountUsdc: 1, category: "data" });
  assert(allowed.allowed === true, "in-limit check is allowed");

  // 5. Record the settlement and confirm trust moved.
  const before = await sentinel.agents.trust(agent.id);
  await sentinel.recordEvent(agent.id, {
    kind: "payment_success",
    label: "Smoke test payment",
    amountUsdc: 1,
    category: "data",
  });
  const after = await sentinel.agents.trust(agent.id);
  assert(after.sampleSize > before.sampleSize, "trust score's sample size grew after settlement");

  // 6. The event shows up in the audit trail.
  const events = await sentinel.agents.events(agent.id);
  assert(
    events.some((e) => e.kind === "payment_success"),
    "settlement appears in the event log",
  );

  console.log("\nAll checks passed.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
