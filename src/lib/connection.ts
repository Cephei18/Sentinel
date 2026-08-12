import { Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { activeCluster } from "./solana";
import { clientEnv } from "./env";
import { FALLBACK_RPC } from "./constants";

/**
 * Solana RPC connection. The exported `connection` is safe everywhere (reads
 * only). Keypair helpers that touch a secret key are server-only.
 */

function rpcFor(cluster: string): string {
  const dedicated = process.env.SOLANA_RPC_URL; // server-only, may embed a provider API key
  return dedicated || clientEnv.NEXT_PUBLIC_SOLANA_RPC_URL || FALLBACK_RPC[cluster];
}

/** Read-only connection for the active cluster. Reused across the app. */
export const connection = new Connection(rpcFor(activeCluster), "confirmed");

/** Build a fresh connection for any cluster (e.g. verifying a tx on the other network). */
export function getConnection(cluster: string = activeCluster) {
  return new Connection(rpcFor(cluster), "confirmed");
}

/**
 * Parse a Solana secret key from either base58 (Phantom's "export private
 * key" format) or a JSON byte-array string (solana-keygen / Solana CLI
 * format, e.g. the contents of ~/.config/solana/id.json).
 */
function parseSecretKey(raw: string): Uint8Array {
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    return Uint8Array.from(JSON.parse(trimmed) as number[]);
  }
  return bs58.decode(trimmed);
}

/**
 * Derive the server-side agent keypair from AGENT_PRIVATE_KEY.
 * Used for autonomous tx execution and x402 paying. Server-only.
 */
export function getAgentKeypair(): Keypair {
  const pk = process.env.AGENT_PRIVATE_KEY;
  if (!pk) throw new Error("AGENT_PRIVATE_KEY is not set — run `pnpm wallet:new` to mint one.");
  return Keypair.fromSecretKey(parseSecretKey(pk));
}
