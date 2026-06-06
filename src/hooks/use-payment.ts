"use client";

import { useCallback, useMemo, useState } from "react";
import { type Address, isAddress } from "viem";
import { useUsdcTransfer } from "./use-usdc-transfer";
import { useWallet } from "./use-wallet";

export type PaymentStatus = "idle" | "validating" | "signing" | "confirming" | "success" | "error";

/**
 * High-level payment flow for a checkout button. Wraps useUsdcTransfer with
 * input validation, a single `status` enum for UI, and network guarding.
 */
export function usePayment() {
  const { isConnected, onWrongNetwork, switchToActiveChain } = useWallet();
  const transfer = useUsdcTransfer();
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const pay = useCallback(
    async (to: string, amount: string | number) => {
      setError(null);
      setStatus("validating");

      if (!isConnected) {
        setError("Connect a wallet first.");
        setStatus("error");
        return;
      }
      if (!isAddress(to)) {
        setError("Invalid recipient address.");
        setStatus("error");
        return;
      }
      if (Number(amount) <= 0) {
        setError("Amount must be greater than zero.");
        setStatus("error");
        return;
      }
      if (onWrongNetwork) {
        await switchToActiveChain();
      }

      try {
        setStatus("signing");
        await transfer.send(to as Address, amount);
        setStatus("confirming");
      } catch {
        setError("Payment was rejected or failed.");
        setStatus("error");
      }
    },
    [isConnected, onWrongNetwork, switchToActiveChain, transfer],
  );

  // Promote to success once the receipt confirms.
  const resolvedStatus: PaymentStatus = useMemo(() => {
    if (status === "confirming" && transfer.isConfirmed) return "success";
    return status;
  }, [status, transfer.isConfirmed]);

  return {
    pay,
    status: resolvedStatus,
    error,
    hash: transfer.hash,
    explorerUrl: transfer.explorerUrl,
    isBusy: ["validating", "signing", "confirming"].includes(resolvedStatus),
    reset: () => {
      setStatus("idle");
      setError(null);
      transfer.reset();
    },
  };
}
