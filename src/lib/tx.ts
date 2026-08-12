import { type Transaction, type VersionedTransaction, type PublicKey } from "@solana/web3.js";
import { EXPLORER_URL } from "./constants";
import { activeCluster } from "./solana";
import { getConnection } from "./connection";

function clusterQuery(cluster: string): string {
  return cluster === "mainnet-beta" ? "" : `?cluster=${cluster}`;
}

/** Block-explorer deep links — never hand-build these in components. */
export function explorerTx(signature: string, cluster: string = activeCluster): string {
  return `${EXPLORER_URL}/tx/${signature}${clusterQuery(cluster)}`;
}

export function explorerAddress(
  address: string | PublicKey,
  cluster: string = activeCluster,
): string {
  return `${EXPLORER_URL}/address/${address.toString()}${clusterQuery(cluster)}`;
}

/**
 * Simulate a transaction before sending. Catches failures (insufficient
 * balance, missing ATA, bad instruction) with the actual reason instead of a
 * failed on-chain tx.
 */
export async function simulate(
  transaction: Transaction | VersionedTransaction,
  cluster: string = activeCluster,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const connection = getConnection(cluster);
  try {
    const result = await connection.simulateTransaction(transaction as VersionedTransaction);
    if (result.value.err) {
      return { ok: false, reason: JSON.stringify(result.value.err) };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: extractErrorReason(err) };
  }
}

/** Estimate the network fee for a transaction message, in lamports. */
export async function estimateTxFee(
  transaction: Transaction,
  cluster: string = activeCluster,
): Promise<{ lamports: number }> {
  const connection = getConnection(cluster);
  if (!transaction.recentBlockhash) {
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
  }
  const fee = await connection.getFeeForMessage(transaction.compileMessage());
  return { lamports: fee.value ?? 5000 };
}

/** Poll for confirmation and return a normalized success/failure summary. */
export async function waitForTx(signature: string, cluster: string = activeCluster) {
  const connection = getConnection(cluster);
  const timeoutMs = 60_000;
  const pollMs = 1000;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { value } = await connection.getSignatureStatus(signature);
    if (value?.confirmationStatus === "confirmed" || value?.confirmationStatus === "finalized") {
      return { success: !value.err, explorer: explorerTx(signature, cluster), err: value.err };
    }
    if (value?.err) {
      return { success: false, explorer: explorerTx(signature, cluster), err: value.err };
    }
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
  throw new Error(`Timed out waiting for confirmation of ${signature}`);
}

/** Pull a human-readable reason out of a Solana simulation/send error. */
export function extractErrorReason(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as { message?: string };
    return e.message || "Unknown error";
  }
  return String(err);
}
