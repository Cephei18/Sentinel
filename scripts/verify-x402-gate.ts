/**
 * Milestone 5 — real end-to-end proof that a real Sentinel authorization
 * decision gates whether this script attempts a real x402 payment on
 * Solana devnet, and that the resulting settlement lands in the real
 * hash-chained event history.
 *
 * WHAT THIS PROVES — AND WHAT IT DOES NOT:
 *   This is an orchestration proof, not an architectural enforcement proof.
 *   It shows that THIS SCRIPT's decision to call the payment path is
 *   causally downstream of a real ALLOWED verdict from the hosted
 *   /api/v1 API (real Postgres, the real checkAuthorization() engine).
 *   It does NOT show that /api/x402/buy itself rejects unauthorized calls —
 *   that route has no knowledge of Sentinel and will still pay unconditionally
 *   if invoked directly by something else. See the Milestone 5 architecture
 *   assessment (recorded alongside docs/DECISIONS.md ADR-006) for that
 *   distinction and why closing it is out of scope here.
 *
 *   pnpm dev                 # in one terminal
 *   pnpm verify-x402-gate    # in another
 *
 * Requires a funded Solana devnet wallet at AGENT_PRIVATE_KEY (SOL for fees,
 * at least $0.01 USDC to cover /api/premium's price) and X402_PAY_TO_ADDRESS
 * set. Refuses to run against an unfunded wallet or a disabled x402 gate —
 * a "simulated success" fallback here would be worthless as proof.
 */
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  getAccount,
  TokenAccountNotFoundError,
} from "@solana/spl-token";
import { getDb } from "../src/lib/db/client";
import { orgs, apiKeys, events as eventsTable } from "../src/lib/db/schema";
import { hashApiKey } from "../src/lib/api/hash-key";
import { toAgentEvent } from "../src/lib/api/mappers";
import { verifyEventChain } from "../src/lib/agents/hash-chain";
import { Sentinel } from "../packages/sdk/src/index";
import { USDC_MINT, cluster, connection, parseSecretKey } from "./_shared";

const BASE_URL = process.env.SMOKE_TEST_BASE_URL ?? "http://localhost:3000/api/v1";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const PRICE_USDC = 0.01; // must match /api/premium/route.ts's hardcoded price
const CATEGORY = "data";

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

async function walletBalances() {
  const pk = process.env.AGENT_PRIVATE_KEY;
  if (!pk) throw new Error("AGENT_PRIVATE_KEY not set.");
  const address = Keypair.fromSecretKey(parseSecretKey(pk)).publicKey;
  const sol = await connection.getBalance(address);
  const mint = new PublicKey(USDC_MINT[cluster]);
  const ata = await getAssociatedTokenAddress(mint, address);
  let usdc = 0n;
  try {
    usdc = (await getAccount(connection, ata)).amount;
  } catch (err) {
    if (!(err instanceof TokenAccountNotFoundError)) throw err;
  }
  return { address, sol, usdc };
}

async function main() {
  console.log(`\nMilestone 5 — orchestration proof against ${BASE_URL}\n`);

  // --- Preflight: refuse to proceed against a disabled gate or unfunded wallet ---
  const health = await fetch(`${APP_URL}/api/health`)
    .then((r) => r.json())
    .catch(() => null);
  assert(Boolean(health), `dev server reachable at ${APP_URL} (run \`pnpm dev\` first)`);
  assert(health?.providers?.agentWallet === true, "AGENT_PRIVATE_KEY configured");
  assert(
    health?.providers?.x402Gate === true,
    "X402_PAY_TO_ADDRESS configured (x402 gate active, not disabled)",
  );
  if (failed > 0) {
    console.error("\nPreflight failed.\n");
    process.exit(1);
  }

  const walletBefore = await walletBalances();
  assert(walletBefore.sol > 0, "agent wallet has devnet SOL for transaction fees");
  assert(
    Number(walletBefore.usdc) / 1_000_000 >= PRICE_USDC,
    `agent wallet has at least $${PRICE_USDC} devnet USDC to cover one purchase`,
  );
  if (failed > 0) {
    console.error("\nPreflight failed — fund the wallet before running this proof.\n");
    process.exit(1);
  }

  const db = getDb();
  const [org] = await db
    .insert(orgs)
    .values({ name: `milestone-5-${Date.now()}` })
    .returning();
  const rawKey = `sk_${randomBytes(24).toString("base64url")}`;
  await db.insert(apiKeys).values({ orgId: org.id, keyHash: await hashApiKey(rawKey) });
  const sentinel = new Sentinel({ apiKey: rawKey, baseUrl: BASE_URL });
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // ============ Negative case: a real BLOCK must prevent any payment attempt ============
  console.log("\n--- Negative case: authorization denied ---\n");

  const blockedAgent = await sentinel.agents.create({
    name: "Milestone 5 — Under-authorized Agent",
    model: "gpt-4o-mini",
    budgetUsdc: 0.001,
    perTxLimitUsdc: 0.001, // below the $0.01 resource price — guarantees a block
    expiresAt,
    categories: [CATEGORY],
  });
  assert(Boolean(blockedAgent.id), "under-authorized agent created via the real hosted API");

  const blockVerdict = await sentinel.check(blockedAgent.id, {
    amountUsdc: PRICE_USDC,
    category: CATEGORY,
  });
  assert(
    blockVerdict.allowed === false,
    "real /check (real Postgres, real checkAuthorization()) returns BLOCKED",
  );

  // No call to payingFetch() / POST /api/x402/buy exists anywhere in this
  // branch — the only path to it in this script is past the assertion above,
  // and that assertion just failed. Independently confirm nothing moved:
  const walletAfterBlock = await walletBalances();
  assert(
    walletAfterBlock.sol === walletBefore.sol && walletAfterBlock.usdc === walletBefore.usdc,
    "independent on-chain check: wallet balance is unchanged — no transaction was ever attempted",
  );

  const blockEvent = await sentinel.recordEvent(blockedAgent.id, {
    kind: "limit_blocked",
    label: "Milestone 5 block proof",
    amountUsdc: PRICE_USDC,
    category: CATEGORY,
  });
  assert(blockEvent.kind === "limit_blocked", "block recorded in the real hosted event log");

  // ============ Positive case: a real ALLOW → a real payment is attempted ============
  console.log("\n--- Positive case: authorization allowed ---\n");

  const allowedAgent = await sentinel.agents.create({
    name: "Milestone 5 — Authorized Agent",
    model: "gpt-4o-mini",
    budgetUsdc: 1,
    perTxLimitUsdc: 1,
    expiresAt,
    categories: [CATEGORY],
  });
  assert(Boolean(allowedAgent.id), "authorized agent created via the real hosted API");

  const allowVerdict = await sentinel.check(allowedAgent.id, {
    amountUsdc: PRICE_USDC,
    category: CATEGORY,
  });
  assert(allowVerdict.allowed === true, "real /check returns ALLOWED for a request within budget");

  // Only now, having read allowed === true from the real HTTP response above,
  // do we call the real (unmodified) payment execution route.
  let settlement: {
    success?: boolean;
    transaction?: string;
    network?: string;
    payer?: string;
  } | null = null;
  let attemptOk = false;
  if (allowVerdict.allowed) {
    const buyRes = await fetch(`${APP_URL}/api/x402/buy`, { method: "POST" });
    const buyBody = await buyRes.json();
    attemptOk = buyBody.ok === true;
    settlement = buyBody.payment ?? null;
  }
  assert(
    attemptOk,
    "real x402 payment attempt via /api/x402/buy returned ok:true (attempt succeeded)",
  );
  assert(Boolean(settlement?.transaction), "a real Solana transaction signature was returned");
  assert(
    settlement?.success === true,
    "the facilitator itself reports settlement success (not merely a local flag)",
  );

  // Independent confirmation #1: re-verify on-chain via the existing,
  // unmodified /api/verify-payment route — a separate code path, a separate
  // query, never trusting the same process's own "success" boolean alone.
  let verifyBody: { verified?: boolean; amountUsdc?: string; recipient?: string } = {};
  if (settlement?.transaction) {
    const verifyRes = await fetch(`${APP_URL}/api/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        signature: settlement.transaction,
        expectedTo: process.env.X402_PAY_TO_ADDRESS,
        minAmount: String(PRICE_USDC),
      }),
    });
    verifyBody = await verifyRes.json();
  }
  assert(
    verifyBody.verified === true,
    "independent on-chain re-verification confirms settlement (finalized, right recipient, right amount)",
  );

  // Independent confirmation #2: the buyer wallet's own USDC balance actually dropped.
  const walletAfterPayment = await walletBalances();
  const usdcDelta = Number(walletBefore.usdc - walletAfterPayment.usdc) / 1_000_000;
  assert(
    Math.abs(usdcDelta - PRICE_USDC) < 1e-6,
    `independent balance check: buyer wallet USDC dropped by exactly $${PRICE_USDC} (observed: $${usdcDelta})`,
  );

  // Only after independent on-chain confirmation do we record the settlement.
  const trustBefore = await sentinel.agents.trust(allowedAgent.id);
  const paymentEvent = await sentinel.recordEvent(allowedAgent.id, {
    kind: "payment_success",
    label: "Milestone 5 real x402 settlement",
    amountUsdc: PRICE_USDC,
    category: CATEGORY,
    txHash: settlement!.transaction,
  });
  assert(
    paymentEvent.txHash === settlement!.transaction,
    "settlement recorded in the real hosted event log with its real tx signature",
  );
  const trustAfter = await sentinel.agents.trust(allowedAgent.id);
  assert(
    trustAfter.sampleSize > trustBefore.sampleSize,
    "trust score's sample size grew after real settlement",
  );

  // ============ Whole-org hash chain: block + settlement, re-queried and re-verified ============
  const chainRows = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.orgId, org.id))
    .orderBy(eventsTable.at);
  assert(
    chainRows.length === 2,
    "both the block and the settlement are persisted in this org's log",
  );
  const chainInput = chainRows.map((r) => ({
    ...toAgentEvent(r),
    hash: r.hash,
    prevHash: r.prevHash,
  }));
  const chainResult = await verifyEventChain(chainInput);
  assert(
    chainResult.valid === true,
    "the full, re-queried event history verifies as an untampered hash chain",
  );

  console.log(`\n${passed} passed, ${failed} failed.\n`);
  console.log(
    "Reminder: this proves orchestration — this script's payment attempt was gated by a real\n" +
      "Sentinel decision. It does not prove architectural enforcement: /api/x402/buy still has no\n" +
      "knowledge of Sentinel and would pay unconditionally if called directly by something else.\n",
  );
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
