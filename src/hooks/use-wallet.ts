"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { activeChainId } from "@/lib/chains";

/**
 * Unified wallet hook: one place for auth state + connected address.
 * Privy owns auth (login/logout, embedded wallets); wagmi owns the
 * connected account + chain. This hook stitches them together.
 */
export function useWallet() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const onWrongNetwork = isConnected && chainId !== activeChainId;

  return {
    /** Privy SDK finished initializing. */
    ready,
    /** User has logged in via Privy. */
    authenticated,
    /** A wallet is connected to wagmi. */
    isConnected,
    address,
    user,
    connector,
    chainId,
    onWrongNetwork,
    login,
    logout,
    /** Jump the wallet to the app's active chain. */
    switchToActiveChain: () => switchChain({ chainId: activeChainId }),
  };
}
