/**
 * API key authentication for the hosted API (/api/v1/*). One org per key to
 * start; no self-serve issuance yet — keys are minted by hand via
 * scripts/issue-api-key.ts, matching the white-glove onboarding approach for
 * the first design partners (self-serve signup is a later milestone).
 */
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { apiKeys } from "@/lib/db/schema";
import { hashApiKey } from "./hash-key";

export type AuthOutcome = { ok: true; orgId: string } | { ok: false; response: NextResponse };

/**
 * Resolve the `Authorization: Bearer sk_...` header to an org. Callers use:
 *   const auth = await requireAuth(req);
 *   if (!auth.ok) return auth.response;
 */
export async function requireAuth(req: Request): Promise<AuthOutcome> {
  const header = req.headers.get("authorization");
  const rawKey = header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : null;
  if (!rawKey) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Missing or malformed Authorization header. Expected: Bearer <api key>." },
        { status: 401 },
      ),
    };
  }

  const keyHash = await hashApiKey(rawKey);
  const db = getDb();
  const [row] = await db
    .select({ orgId: apiKeys.orgId, revokedAt: apiKeys.revokedAt })
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, keyHash))
    .limit(1);

  if (!row || row.revokedAt) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid or revoked API key." }, { status: 401 }),
    };
  }

  // Best-effort last-used stamp; never block the request on it.
  void db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.keyHash, keyHash));

  return { ok: true, orgId: row.orgId };
}
