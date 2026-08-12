"use client";

import { useCallback, useState } from "react";
import { PublicKey, Transaction, type TransactionInstruction } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  getAccount,
  createAssociatedTokenAccountIdempotentInstruction,
  TokenAccountNotFoundError,
} from "@solana/spl-token";
import bs58 from "bs58";
import { toast } from "sonner";
import { activeCluster } from "@/lib/solana";
import { connection } from "@/lib/connection";
import { usdcMint, buildUsdcTransferInstruction } from "@/lib/usdc";
import { explorerTx, waitForTx } from "@/lib/tx";
import { useWallet } from "./use-wallet";

const CHAIN_FOR_CLUSTER = {
  "mainnet-beta": "solana:mainnet",
  devnet: "solana:devnet",
} as const;

/**
 * One-call USDC transfer hook with toast feedback + confirmation tracking.
 * Surfaces the three states judges care about: signing → pending → confirmed.
 *
 * Unlike an ERC-20 send, a recipient with no USDC ATA yet needs one created
 * first — this hook does that automatically (idempotent, so it's a no-op if
 * the ATA already exists) rather than letting the transfer fail on-chain.
 */
export function useUsdcTransfer() {
  const { wallet, signAndSendTransaction } = useWallet();
  const [signature, setSignature] = useState<string | undefined>();
  const [isSigning, setIsSigning] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const send = useCallback(
    async (to: string, amount: string | number) => {
      if (!wallet) throw new Error("No wallet connected.");
      setIsSigning(true);
      setIsConfirmed(false);
      try {
        const from = new PublicKey(wallet.address);
        const recipient = new PublicKey(to);
        const mint = usdcMint();

        const instructions: TransactionInstruction[] = [];
        const destAta = await getAssociatedTokenAddress(mint, recipient);
        try {
          await getAccount(connection, destAta);
        } catch (err) {
          if (!(err instanceof TokenAccountNotFoundError)) throw err;
          instructions.push(
            createAssociatedTokenAccountIdempotentInstruction(from, destAta, recipient, mint),
          );
        }
        instructions.push(await buildUsdcTransferInstruction(from, recipient, amount));

        const { blockhash } = await connection.getLatestBlockhash();
        const transaction = new Transaction({ feePayer: from, recentBlockhash: blockhash }).add(
          ...instructions,
        );

        const { signature: sigBytes } = await signAndSendTransaction({
          transaction: transaction.serialize({ requireAllSignatures: false }),
          wallet,
          chain: CHAIN_FOR_CLUSTER[activeCluster],
        });
        const sig = bs58.encode(sigBytes);
        setSignature(sig);
        toast.success("Payment submitted", {
          description: "Waiting for confirmation…",
          action: { label: "View", onClick: () => window.open(explorerTx(sig), "_blank") },
        });

        setIsSigning(false);
        setIsConfirming(true);
        await waitForTx(sig);
        setIsConfirming(false);
        setIsConfirmed(true);
        return sig;
      } catch (err) {
        setIsSigning(false);
        setIsConfirming(false);
        const message = err instanceof Error ? err.message : "Transaction failed";
        toast.error("Payment failed", { description: message.slice(0, 120) });
        throw err;
      }
    },
    [wallet, signAndSendTransaction],
  );

  return {
    send,
    hash: signature,
    isSigning,
    isConfirming,
    isConfirmed,
    explorerUrl: signature ? explorerTx(signature) : undefined,
    reset: () => {
      setSignature(undefined);
      setIsSigning(false);
      setIsConfirming(false);
      setIsConfirmed(false);
    },
  };
}
