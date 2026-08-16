/**
 * Hash chaining for the event log — makes tampering detectable independent
 * of the database. Each event's hash commits to the previous event's hash
 * plus its own content, so rewriting history requires recomputing every
 * hash from the tampered point forward.
 *
 * Uses the Web Crypto API (`crypto.subtle`, available in both browsers and
 * Node 18+) rather than Node's `crypto` module, so this file stays
 * importable anywhere the rest of lib/agents/ is: no platform-specific
 * dependency, same as the reputation and authorization engines.
 */
import type { AgentEvent } from "./types";

/** The subset of an event's fields committed to the hash chain. */
export type HashableEvent = Pick<
  AgentEvent,
  | "agentId"
  | "kind"
  | "label"
  | "amountUsdc"
  | "category"
  | "txHash"
  | "counterpartyId"
  | "trustDelta"
  | "at"
>;

/** Explicit key order so the hash never depends on object key insertion order. */
function canonicalize(event: HashableEvent): string {
  return JSON.stringify({
    agentId: event.agentId,
    kind: event.kind,
    label: event.label,
    amountUsdc: event.amountUsdc ?? null,
    category: event.category ?? null,
    txHash: event.txHash ?? null,
    counterpartyId: event.counterpartyId ?? null,
    trustDelta: event.trustDelta ?? null,
    at: event.at,
  });
}

function toHex(digest: ArrayBuffer): string {
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Compute the hash for an event given the previous event's hash in the
 * same agent's chain (or null for the first event). Same inputs always
 * produce the same hash: deterministic and independently verifiable.
 */
export async function computeEventHash(
  prevHash: string | null,
  event: HashableEvent,
): Promise<string> {
  const payload = `${prevHash ?? "genesis"}:${canonicalize(event)}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));
  return toHex(digest);
}

/**
 * Verify a chain of events (oldest first) by recomputing each hash and
 * checking it matches what was stored, and that prevHash links are intact.
 */
export async function verifyEventChain(
  events: Array<HashableEvent & { hash: string; prevHash: string | null }>,
): Promise<{ valid: true } | { valid: false; brokenAt: number }> {
  let prev: string | null = null;
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (e.prevHash !== prev) return { valid: false, brokenAt: i };
    const recomputed = await computeEventHash(prev, e);
    if (recomputed !== e.hash) return { valid: false, brokenAt: i };
    prev = e.hash;
  }
  return { valid: true };
}
