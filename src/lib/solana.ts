import { clientEnv } from "./env";

/**
 * Single switch that flips the whole app between mainnet-beta and devnet.
 * Driven by NEXT_PUBLIC_SOLANA_CLUSTER. Default is devnet for safe hacking.
 */
export const IS_MAINNET = clientEnv.NEXT_PUBLIC_SOLANA_CLUSTER === "mainnet-beta";

export type SolanaCluster = "mainnet-beta" | "devnet";

/** The cluster the app actively targets. Solana has no "switch chain" wallet
 * action — unlike Base/Base Sepolia, there is exactly one active cluster per
 * deployment, chosen at build/env time, not by the user's wallet. */
export const activeCluster: SolanaCluster = IS_MAINNET ? "mainnet-beta" : "devnet";

/** Human label for badges/UI. */
export const clusterLabel = IS_MAINNET ? "Solana" : "Solana Devnet";

/**
 * x402 network identifier expected by x402-solana. Placeholder pending the
 * Phase 3 payment-rail spike — confirm the exact string the package expects
 * before wiring middleware.ts/x402.ts to it.
 */
export const x402Network: string = IS_MAINNET ? "solana" : "solana-devnet";
