import { encodeFunctionData, formatUnits, parseUnits, type Address } from "viem";
import { ERC20_ABI, USDC_ADDRESS, USDC_DECIMALS } from "./constants";
import { activeChainId } from "./chains";
import { getPublicClient } from "./viem";

/**
 * USDC helpers. USDC uses 6 decimals — the #1 source of "why did I send
 * 1,000,000x too much" bugs. Always go through parseUsdc / formatUsdc.
 */

/** USDC token address for the active chain. */
export function usdcAddress(chainId: number = activeChainId): Address {
  const addr = USDC_ADDRESS[chainId];
  if (!addr) throw new Error(`No USDC address configured for chainId ${chainId}`);
  return addr;
}

/** "1.5" USDC → 1500000n (base units). */
export function parseUsdc(amount: string | number): bigint {
  return parseUnits(String(amount), USDC_DECIMALS);
}

/** 1500000n → "1.5" (human string). */
export function formatUsdc(amount: bigint): string {
  return formatUnits(amount, USDC_DECIMALS);
}

/** Read an address's USDC balance (raw bigint + formatted string). */
export async function getUsdcBalance(
  account: Address,
  chainId: number = activeChainId,
): Promise<{ raw: bigint; formatted: string }> {
  const client = getPublicClient(chainId);
  const raw = (await client.readContract({
    address: usdcAddress(chainId),
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [account],
  })) as bigint;
  return { raw, formatted: formatUsdc(raw) };
}

/**
 * Encode an ERC-20 USDC `transfer(to, amount)` call.
 * Returns `{ to, data, value }` ready for sendTransaction / sendCalls / wagmi.
 */
export function buildUsdcTransfer(to: Address, amount: string | number, chainId: number = activeChainId) {
  const data = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [to, parseUsdc(amount)],
  });
  return { to: usdcAddress(chainId), data, value: 0n } as const;
}
