"use client";

import { useCallback, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { type Address } from "viem";
import { toast } from "sonner";
import { ERC20_ABI } from "@/lib/constants";
import { usdcAddress, parseUsdc } from "@/lib/usdc";
import { activeChainId } from "@/lib/chains";
import { explorerTx } from "@/lib/tx";

/**
 * One-call USDC transfer hook with toast feedback + receipt tracking.
 * Surfaces the three states judges care about: signing → pending → confirmed.
 */
export function useUsdcTransfer() {
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const { writeContractAsync, isPending: isSigning, reset } = useWriteContract();

  const receipt = useWaitForTransactionReceipt({
    hash,
    chainId: activeChainId,
    query: { enabled: Boolean(hash) },
  });

  const send = useCallback(
    async (to: Address, amount: string | number) => {
      try {
        const txHash = await writeContractAsync({
          address: usdcAddress(),
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [to, parseUsdc(amount)],
          chainId: activeChainId,
        });
        setHash(txHash);
        toast.success("Payment submitted", {
          description: "Waiting for confirmation…",
          action: { label: "View", onClick: () => window.open(explorerTx(txHash), "_blank") },
        });
        return txHash;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Transaction failed";
        toast.error("Payment failed", { description: message.slice(0, 120) });
        throw err;
      }
    },
    [writeContractAsync],
  );

  return {
    send,
    hash,
    isSigning,
    isConfirming: receipt.isLoading,
    isConfirmed: receipt.isSuccess,
    explorerUrl: hash ? explorerTx(hash) : undefined,
    reset: () => {
      setHash(undefined);
      reset();
    },
  };
}
