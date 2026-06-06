import { base, baseSepolia } from "viem/chains";
import { type Chain } from "viem";
import { clientEnv } from "./env";

/**
 * Single switch that flips the whole app between mainnet and testnet.
 * Driven by NEXT_PUBLIC_CHAIN. Default is Base Sepolia for safe hacking.
 */
export const IS_MAINNET = clientEnv.NEXT_PUBLIC_CHAIN === "base";

/** The chain the app actively targets. */
export const activeChain: Chain = IS_MAINNET ? base : baseSepolia;

/** Both chains are supported by wallets/wagmi; the active one is the default. */
export const supportedChains = [activeChain, IS_MAINNET ? baseSepolia : base] as const;

// Narrowed to the configured chain ids so wagmi's chainId params type-check.
export const activeChainId = activeChain.id as 8453 | 84532;

/** Human label for badges/UI. */
export const chainLabel = IS_MAINNET ? "Base" : "Base Sepolia";

/** x402 network identifier string expected by the protocol. */
export const x402Network: "base" | "base-sepolia" = IS_MAINNET ? "base" : "base-sepolia";
