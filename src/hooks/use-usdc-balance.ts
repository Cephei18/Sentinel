"use client";

import { useReadContract } from "wagmi";
import { type Address } from "viem";
import { ERC20_ABI } from "@/lib/constants";
import { usdcAddress, formatUsdc } from "@/lib/usdc";
import { activeChainId } from "@/lib/chains";

/**
 * Live USDC balance for an address (defaults to refetch every 10s).
 * Returns both the raw bigint and a formatted human string.
 */
export function useUsdcBalance(address?: Address) {
  const query = useReadContract({
    address: usdcAddress(),
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: activeChainId,
    query: {
      enabled: Boolean(address),
      refetchInterval: 10_000,
    },
  });

  const raw = (query.data as bigint | undefined) ?? 0n;

  return {
    raw,
    formatted: formatUsdc(raw),
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
