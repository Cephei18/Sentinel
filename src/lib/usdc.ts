import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  getAccount,
  createTransferInstruction,
  TokenAccountNotFoundError,
} from "@solana/spl-token";
import { USDC_MINT, USDC_DECIMALS } from "./constants";
import { activeCluster } from "./solana";
import { getConnection } from "./connection";

/**
 * USDC helpers. USDC uses 6 decimals — the #1 source of "why did I send
 * 1,000,000x too much" bugs. Always go through parseUsdc / formatUsdc.
 *
 * Unlike an ERC-20, USDC on Solana lives on Associated Token Accounts (ATAs)
 * derived from (wallet pubkey, mint) — a wallet's own address is never where
 * its USDC balance is read from or written to.
 */

/** USDC SPL mint for the active cluster. */
export function usdcMint(cluster: string = activeCluster): PublicKey {
  const mint = USDC_MINT[cluster];
  if (!mint) throw new Error(`No USDC mint configured for cluster ${cluster}`);
  return new PublicKey(mint);
}

/** "1.5" USDC → 1500000n (base units). */
export function parseUsdc(amount: string | number): bigint {
  const [whole, frac = ""] = String(amount).split(".");
  const paddedFrac = frac.padEnd(USDC_DECIMALS, "0").slice(0, USDC_DECIMALS);
  return BigInt(whole || "0") * 10n ** BigInt(USDC_DECIMALS) + BigInt(paddedFrac || "0");
}

/** 1500000n → "1.5" (human string). */
export function formatUsdc(amount: bigint): string {
  const divisor = 10n ** BigInt(USDC_DECIMALS);
  const whole = amount / divisor;
  const frac = (amount % divisor).toString().padStart(USDC_DECIMALS, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole.toString();
}

/**
 * Read a wallet's USDC balance (raw bigint + formatted string). A wallet that
 * has never received USDC has no ATA yet — that's a balance of 0, not an error.
 */
export async function getUsdcBalance(
  owner: PublicKey,
  cluster: string = activeCluster,
): Promise<{ raw: bigint; formatted: string }> {
  const connection = getConnection(cluster);
  const ata = await getAssociatedTokenAddress(usdcMint(cluster), owner);
  try {
    const account = await getAccount(connection, ata);
    return { raw: account.amount, formatted: formatUsdc(account.amount) };
  } catch (err) {
    if (err instanceof TokenAccountNotFoundError) {
      return { raw: 0n, formatted: "0" };
    }
    throw err;
  }
}

/**
 * Build an SPL USDC transfer instruction between two wallets' ATAs.
 * Callers must ensure the destination ATA exists first (see
 * `use-usdc-transfer.ts`) — sending to a wallet with no USDC ATA yet fails
 * on-chain, unlike an ERC-20 transfer to a fresh EOA.
 */
export async function buildUsdcTransferInstruction(
  from: PublicKey,
  to: PublicKey,
  amount: string | number,
  cluster: string = activeCluster,
) {
  const mint = usdcMint(cluster);
  const [sourceAta, destAta] = await Promise.all([
    getAssociatedTokenAddress(mint, from),
    getAssociatedTokenAddress(mint, to),
  ]);
  return createTransferInstruction(sourceAta, destAta, from, parseUsdc(amount));
}
