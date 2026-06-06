/**
 * Shared helpers for CLI scripts. Self-contained (no Next.js / @ alias) so
 * they run cleanly under `tsx`. Loads env from .env.local.
 */
import { config } from "dotenv";
import { createPublicClient, http, type Address } from "viem";
import { base, baseSepolia } from "viem/chains";

config({ path: ".env.local" });

export const IS_MAINNET = process.env.NEXT_PUBLIC_CHAIN === "base";
export const chain = IS_MAINNET ? base : baseSepolia;
export const chainLabel = IS_MAINNET ? "Base" : "Base Sepolia";

export const USDC: Record<number, Address> = {
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
};

export const RPC: Record<number, string> = {
  8453: process.env.BASE_RPC_URL || "https://mainnet.base.org",
  84532: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
};

export const EXPLORER: Record<number, string> = {
  8453: "https://basescan.org",
  84532: "https://sepolia.basescan.org",
};

export const publicClient = createPublicClient({ chain, transport: http(RPC[chain.id]) });

export const ERC20_ABI = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "a", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amt", type: "uint256" }], outputs: [{ type: "bool" }] },
] as const;

/** Pretty console helpers. */
export const log = {
  ok: (m: string) => console.log(`\x1b[32m✓\x1b[0m ${m}`),
  warn: (m: string) => console.log(`\x1b[33m!\x1b[0m ${m}`),
  err: (m: string) => console.log(`\x1b[31m✗\x1b[0m ${m}`),
  info: (m: string) => console.log(`  ${m}`),
  title: (m: string) => console.log(`\n\x1b[1m${m}\x1b[0m`),
};
