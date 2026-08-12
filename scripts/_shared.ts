/**
 * Shared helpers for CLI scripts. Self-contained (no Next.js / @ alias) so
 * they run cleanly under `tsx`. Loads env from .env.local.
 */
import { config } from "dotenv";
import { Connection, clusterApiUrl, type Cluster } from "@solana/web3.js";
import bs58 from "bs58";

config({ path: ".env.local" });

export const IS_MAINNET = process.env.NEXT_PUBLIC_SOLANA_CLUSTER === "mainnet-beta";
export const cluster: "mainnet-beta" | "devnet" = IS_MAINNET ? "mainnet-beta" : "devnet";
export const clusterLabel = IS_MAINNET ? "Solana" : "Solana Devnet";

export const USDC_MINT: Record<string, string> = {
  "mainnet-beta": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  devnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
};

export const RPC = process.env.SOLANA_RPC_URL || clusterApiUrl(cluster as Cluster);

export const EXPLORER = "https://explorer.solana.com";
export const explorerQuery = IS_MAINNET ? "" : `?cluster=${cluster}`;

export const connection = new Connection(RPC, "confirmed");

/** Pretty console helpers. */
export const log = {
  ok: (m: string) => console.log(`\x1b[32m✓\x1b[0m ${m}`),
  warn: (m: string) => console.log(`\x1b[33m!\x1b[0m ${m}`),
  err: (m: string) => console.log(`\x1b[31m✗\x1b[0m ${m}`),
  info: (m: string) => console.log(`  ${m}`),
  title: (m: string) => console.log(`\n\x1b[1m${m}\x1b[0m`),
};

/** Parse AGENT_PRIVATE_KEY: base58 (Phantom export) or a JSON byte-array string. */
export function parseSecretKey(raw: string): Uint8Array {
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    return Uint8Array.from(JSON.parse(trimmed) as number[]);
  }
  return bs58.decode(trimmed);
}
