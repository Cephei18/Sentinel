import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";
import { activeChain, activeChainId } from "./chains";
import { FALLBACK_RPC } from "./constants";

/**
 * viem clients. The public client is safe everywhere (reads only).
 * Wallet/account helpers that touch a private key are server-only.
 *
 * Return types are inferred (not annotated) so they bind to this module's
 * single viem instance — avoids TS "two different types" errors when the
 * dependency graph pulls multiple viem copies.
 */

function rpcFor(chainId: number): string {
  if (chainId === base.id) return process.env.BASE_RPC_URL || FALLBACK_RPC[base.id];
  if (chainId === baseSepolia.id)
    return process.env.BASE_SEPOLIA_RPC_URL || FALLBACK_RPC[baseSepolia.id];
  return FALLBACK_RPC[chainId];
}

/** Read-only client for the active chain. Reused across the app. */
export const publicClient = createPublicClient({
  chain: activeChain,
  transport: http(rpcFor(activeChainId)),
});

/** Build a fresh public client for any chain (e.g. verifying a tx on the other network). */
export function getPublicClient(chainId: number = activeChainId) {
  const chain = chainId === base.id ? base : baseSepolia;
  return createPublicClient({ chain, transport: http(rpcFor(chainId)) });
}

/**
 * Derive the server-side agent account from AGENT_PRIVATE_KEY.
 * Used for autonomous tx execution and x402 paying. Server-only.
 */
export function getAgentAccount() {
  const pk = process.env.AGENT_PRIVATE_KEY;
  if (!pk) throw new Error("AGENT_PRIVATE_KEY is not set — run `pnpm wallet:new` to mint one.");
  return privateKeyToAccount(pk as `0x${string}`);
}

/** Wallet client bound to the agent account on the active chain. Server-only. */
export function getAgentWalletClient() {
  return createWalletClient({
    account: getAgentAccount(),
    chain: activeChain,
    transport: http(rpcFor(activeChainId)),
  });
}
