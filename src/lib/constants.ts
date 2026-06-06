import { type Address } from "viem";

/**
 * Canonical on-chain constants for Base. Centralized so every component,
 * hook, and script reads from a single source of truth.
 */

/** Native USDC token addresses (6 decimals on every chain). */
export const USDC_ADDRESS: Record<number, Address> = {
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base Mainnet
  84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia
};

export const USDC_DECIMALS = 6;

/** Block explorers, keyed by chainId. */
export const EXPLORER_URL: Record<number, string> = {
  8453: "https://basescan.org",
  84532: "https://sepolia.basescan.org",
};

/** Public RPCs used as fallbacks when no dedicated provider is configured. */
export const FALLBACK_RPC: Record<number, string> = {
  8453: "https://mainnet.base.org",
  84532: "https://sepolia.base.org",
};

/** Faucet links surfaced in the UI/docs for grabbing testnet funds fast. */
export const FAUCETS = {
  baseSepoliaEth: "https://portal.cdp.coinbase.com/products/faucet",
  baseSepoliaEthAlt: "https://www.alchemy.com/faucets/base-sepolia",
  circleUsdc: "https://faucet.circle.com", // select Base Sepolia
} as const;

/** Default x402 facilitator (free, testnet) — settles payments on Base Sepolia. */
export const X402_TESTNET_FACILITATOR = "https://x402.org/facilitator";

/** Minimal ERC-20 ABI covering everything the starter needs. */
export const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;
