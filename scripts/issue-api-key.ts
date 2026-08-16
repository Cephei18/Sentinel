/**
 * Issue a new API key for an org, creating the org if it doesn't exist yet.
 * White-glove onboarding: run this by hand for each design partner.
 *   pnpm issue-api-key "Acme Inc"
 * Copy the printed raw key to the customer — it is hashed before storage
 * and never shown again after this.
 */
import { config } from "dotenv";
import { randomBytes } from "node:crypto";
import { getDb } from "../src/lib/db/client";
import { orgs, apiKeys } from "../src/lib/db/schema";
import { hashApiKey } from "../src/lib/api/hash-key";

config({ path: ".env.local" });

async function main() {
  const orgName = process.argv[2];
  if (!orgName) {
    console.error('Usage: pnpm issue-api-key "<org name>"');
    process.exit(1);
  }

  const db = getDb();
  const [org] = await db.insert(orgs).values({ name: orgName }).returning();

  const rawKey = `sk_${randomBytes(24).toString("base64url")}`;
  const keyHash = await hashApiKey(rawKey);
  await db.insert(apiKeys).values({ orgId: org.id, keyHash });

  console.log(`\nOrg created: ${org.name} (${org.id})`);
  console.log(`\nAPI key (copy this now, it will not be shown again):\n${rawKey}\n`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
