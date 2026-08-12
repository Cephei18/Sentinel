import { NextResponse } from "next/server";
import { z } from "zod";
import { getConnection } from "@/lib/connection";
import { usdcMint, formatUsdc, parseUsdc } from "@/lib/usdc";
import { explorerTx } from "@/lib/tx";

export const runtime = "nodejs";

const bodySchema = z.object({
  signature: z.string().min(64).max(90, "Invalid transaction signature"),
  expectedTo: z.string().optional(),
  minAmount: z.string().optional(), // human USDC units
});

/**
 * Server-side payment verification: confirm a tx actually moved USDC
 * (and optionally to whom, and at least how much) before granting access.
 * Never trust the client's "I paid" — verify on-chain here.
 *
 * Solana has no ABI-decoded event logs like an ERC-20 Transfer — instead we
 * diff pre/post token balances for the USDC mint across every account the
 * transaction touched.
 */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ verified: false, error: "Bad request" }, { status: 400 });
  }
  const { signature, expectedTo, minAmount } = parsed.data;

  const connection = getConnection();
  const tx = await connection
    .getParsedTransaction(signature, { maxSupportedTransactionVersion: 0 })
    .catch(() => null);

  if (!tx) {
    return NextResponse.json({ verified: false, reason: "Transaction not found / pending" });
  }
  if (tx.meta?.err) {
    return NextResponse.json({ verified: false, reason: "Transaction failed" });
  }

  const mint = usdcMint().toBase58();
  const pre = new Map(
    (tx.meta?.preTokenBalances ?? [])
      .filter((b) => b.mint === mint)
      .map((b) => [b.accountIndex, b] as const),
  );
  const post = (tx.meta?.postTokenBalances ?? []).filter((b) => b.mint === mint);

  let transferred = 0n;
  let recipient: string | null = null;

  // Sum every USDC balance increase across accounts this tx touched.
  for (const balance of post) {
    const before = pre.get(balance.accountIndex);
    const beforeAmount = BigInt(before?.uiTokenAmount.amount ?? "0");
    const afterAmount = BigInt(balance.uiTokenAmount.amount);
    const delta = afterAmount - beforeAmount;
    if (delta > 0n) {
      transferred += delta;
      recipient = balance.owner ?? recipient;
    }
  }

  const meetsAmount = minAmount ? transferred >= parseUsdc(minAmount) : transferred > 0n;
  const meetsRecipient = expectedTo && recipient ? recipient === expectedTo : true;

  return NextResponse.json({
    verified: meetsAmount && meetsRecipient,
    amountUsdc: formatUsdc(transferred),
    recipient,
    explorer: explorerTx(signature),
  });
}
