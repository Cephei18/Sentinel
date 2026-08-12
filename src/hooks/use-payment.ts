"use client";

import { useCallback, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useUsdcTransfer } from "./use-usdc-transfer";
import { useWallet } from "./use-wallet";

export type PaymentStatus = "idle" | "validating" | "signing" | "confirming" | "success" | "error";

function isValidSolanaAddress(value: string): boolean {
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * High-level payment flow for a checkout button. Wraps useUsdcTransfer with
 * input validation and a single `status` enum for UI.
 *
 * No network-switch step here, unlike the old EVM version — Solana has no
 * "wrong network" concept for a connected wallet to be nudged out of.
 */
export function usePayment() {
  const { isConnected } = useWallet();
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
      if (!isValidSolanaAddress(to)) {
        setError("Invalid recipient address.");
        setStatus("error");
        return;
      }
      if (Number(amount) <= 0) {
        setError("Amount must be greater than zero.");
        setStatus("error");
        return;
      }

      try {
        setStatus("signing");
        await transfer.send(to, amount);
        setStatus("confirming");
      } catch {
        setError("Payment was rejected or failed.");
        setStatus("error");
      }
    },
    [isConnected, transfer],
  );

  // Promote to success once the transaction confirms.
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
