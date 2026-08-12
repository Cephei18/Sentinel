/**
 * Canonical on-chain constants for Solana. Centralized so every component,
 * hook, and script reads from a single source of truth.
 */

/** Native USDC SPL mint addresses (6 decimals on every cluster). */
export const USDC_MINT: Record<string, string> = {
  "mainnet-beta": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  devnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", // Circle's official devnet USDC mint
};

export const USDC_DECIMALS = 6;

/** Solana Explorer base URL — the cluster suffix is appended by tx.ts. */
export const EXPLORER_URL = "https://explorer.solana.com";

/** Public RPCs used as fallbacks when no dedicated provider is configured. */
export const FALLBACK_RPC: Record<string, string> = {
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
  devnet: "https://api.devnet.solana.com",
};

/** Faucet links surfaced in the UI/docs for grabbing devnet funds fast. */
export const FAUCETS = {
  solanaDevnetSol: "https://faucet.solana.com",
  circleUsdc: "https://faucet.circle.com", // select "Solana Devnet"
} as const;

/** Default x402 v2 facilitator (PayAI) — serves both devnet and mainnet. */
export const X402_FACILITATOR = "https://facilitator.payai.network";
