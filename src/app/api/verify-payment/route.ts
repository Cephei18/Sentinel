import { NextResponse } from "next/server";
import { decodeEventLog, getAddress, type Hash } from "viem";
import { z } from "zod";
import { getPublicClient } from "@/lib/viem";
import { ERC20_ABI, USDC_ADDRESS } from "@/lib/constants";
import { formatUsdc, parseUsdc } from "@/lib/usdc";
import { activeChainId } from "@/lib/chains";
import { explorerTx } from "@/lib/tx";

export const runtime = "nodejs";

const bodySchema = z.object({
  hash: z.string().regex(/^0x[0-9a-fA-F]{64}$/, "Invalid tx hash"),
  expectedTo: z.string().optional(),
  minAmount: z.string().optional(), // human USDC units
});

/**
 * Server-side payment verification: confirm a tx actually moved USDC
 * (and optionally to whom, and at least how much) before granting access.
 * Never trust the client's "I paid" — verify on-chain here.
 */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ verified: false, error: "Bad request" }, { status: 400 });
  }
  const { hash, expectedTo, minAmount } = parsed.data;

  const client = getPublicClient();
  const receipt = await client.getTransactionReceipt({ hash: hash as Hash }).catch(() => null);

  if (!receipt) {
    return NextResponse.json({ verified: false, reason: "Transaction not found / pending" });
  }
  if (receipt.status !== "success") {
    return NextResponse.json({ verified: false, reason: "Transaction reverted" });
  }

  const usdc = USDC_ADDRESS[activeChainId].toLowerCase();
  let transferred = 0n;
  let recipient: string | null = null;

  // Sum USDC Transfer events emitted by this tx.
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== usdc) continue;
    try {
      const ev = decodeEventLog({ abi: ERC20_ABI, data: log.data, topics: log.topics });
      if (ev.eventName === "transfer" || ev.eventName === "Transfer") {
        const args = ev.args as unknown as { to: string; amount: bigint };
        transferred += args.amount;
        recipient = args.to;
      }
    } catch {
      // Not a Transfer event we care about.
    }
  }

  const meetsAmount = minAmount ? transferred >= parseUsdc(minAmount) : transferred > 0n;
  const meetsRecipient =
    expectedTo && recipient ? getAddress(recipient) === getAddress(expectedTo) : true;

  return NextResponse.json({
    verified: meetsAmount && meetsRecipient,
    amountUsdc: formatUsdc(transferred),
    recipient,
    explorer: explorerTx(hash as Hash),
  });
}
