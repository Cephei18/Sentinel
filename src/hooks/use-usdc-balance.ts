"use client";

import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import { getUsdcBalance, formatUsdc } from "@/lib/usdc";

/**
 * Live USDC balance for a wallet address (refetches every 10s).
 * Returns both the raw bigint and a formatted human string.
 *
 * There's no wagmi-style read-hook on Solana, so this polls
 * `getUsdcBalance` (the same ATA-lookup helper the server uses) directly via
 * react-query — one implementation shared by client and server, rather than
 * the old split between a wagmi hook and a viem helper.
 */
export function useUsdcBalance(address?: string) {
  const query = useQuery({
    queryKey: ["usdc-balance", address],
    queryFn: () => getUsdcBalance(new PublicKey(address as string)),
    enabled: Boolean(address),
    refetchInterval: 10_000,
  });

  const raw = query.data?.raw ?? 0n;

  return {
    raw,
    formatted: formatUsdc(raw),
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
