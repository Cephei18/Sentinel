"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useWallets, useSignAndSendTransaction } from "@privy-io/react-auth/solana";

/**
 * Unified wallet hook: one place for auth state + the connected Solana
 * wallet. Privy owns both auth (login/logout, embedded wallets) and the
 * connected account on Solana — there's no separate wagmi-style account
 * hook to stitch in.
 *
 * Solana has no "wrong network" / "switch chain" concept: the cluster is
 * chosen by the app's own RPC endpoint (see lib/solana.ts), not requested
 * from the wallet, so the old onWrongNetwork/switchToActiveChain pair has
 * no equivalent here and is intentionally dropped.
 */
export function useWallet() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { ready: walletsReady, wallets } = useWallets();
  const { signAndSendTransaction } = useSignAndSendTransaction();

  const wallet = wallets[0];

  return {
    /** Privy SDK finished initializing. */
    ready: ready && walletsReady,
    /** User has logged in via Privy. */
    authenticated,
    /** A Solana wallet is connected. */
    isConnected: Boolean(wallet),
    address: wallet?.address,
    user,
    wallet,
    signAndSendTransaction,
    login,
    logout,
  };
}
