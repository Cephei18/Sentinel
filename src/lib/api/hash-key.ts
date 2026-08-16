/**
 * sha256 hex digest for API keys. Split out from auth.ts (which imports
 * next/server) so scripts/issue-api-key.ts can import just the hashing
 * logic without pulling in a Next.js-only module outside a Next.js runtime.
 */
export async function hashApiKey(rawKey: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(rawKey));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
