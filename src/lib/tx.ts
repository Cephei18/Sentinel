import { decodeFunctionData, type Abi, type Address, type Hash } from "viem";
import { EXPLORER_URL } from "./constants";
import { activeChainId } from "./chains";
import { getPublicClient } from "./viem";

/** Block-explorer deep links — never hand-build these in components. */
export function explorerTx(hash: Hash, chainId: number = activeChainId): string {
  return `${EXPLORER_URL[chainId] ?? EXPLORER_URL[activeChainId]}/tx/${hash}`;
}

export function explorerAddress(address: Address, chainId: number = activeChainId): string {
  return `${EXPLORER_URL[chainId] ?? EXPLORER_URL[activeChainId]}/address/${address}`;
}

/**
 * Simulate a contract call before sending. Catches reverts (insufficient
 * balance, bad args) with the actual reason instead of a failed on-chain tx.
 */
export async function simulate(params: {
  address: Address;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
  account: Address;
  chainId?: number;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const client = getPublicClient(params.chainId ?? activeChainId);
  try {
    await client.simulateContract({
      address: params.address,
      abi: params.abi,
      functionName: params.functionName,
      args: params.args,
      account: params.account,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: extractRevertReason(err) };
  }
}

/** Estimate gas for raw calldata and return both gas units and a wei cost estimate. */
export async function estimateTxCost(params: {
  to: Address;
  data: `0x${string}`;
  account: Address;
  value?: bigint;
  chainId?: number;
}): Promise<{ gas: bigint; maxFeePerGas: bigint; estCostWei: bigint }> {
  const client = getPublicClient(params.chainId ?? activeChainId);
  const [gas, fees] = await Promise.all([
    client.estimateGas({
      account: params.account,
      to: params.to,
      data: params.data,
      value: params.value ?? 0n,
    }),
    client.estimateFeesPerGas(),
  ]);
  const maxFeePerGas = fees.maxFeePerGas ?? 0n;
  return { gas, maxFeePerGas, estCostWei: gas * maxFeePerGas };
}

/** Wait for a receipt and return a normalized success/failure summary. */
export async function waitForTx(hash: Hash, chainId: number = activeChainId) {
  const client = getPublicClient(chainId);
  const receipt = await client.waitForTransactionReceipt({ hash });
  return {
    success: receipt.status === "success",
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed,
    explorer: explorerTx(hash, chainId),
    receipt,
  };
}

/** Best-effort ABI decode of calldata for debugging "what is this tx doing". */
export function decodeCalldata(abi: Abi, data: `0x${string}`) {
  try {
    return decodeFunctionData({ abi, data });
  } catch {
    return null;
  }
}

/** Pull a human-readable revert reason out of a viem error. */
export function extractRevertReason(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as { shortMessage?: string; details?: string; message?: string };
    return e.shortMessage || e.details || e.message || "Unknown error";
  }
  return String(err);
}
