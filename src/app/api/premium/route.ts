import { NextResponse } from "next/server";
import { X402PaymentHandler } from "x402-solana/server";
import { serverEnv } from "@/lib/env";
import { usdcMint } from "@/lib/usdc";
import { activeCluster, x402Network } from "@/lib/solana";
import { X402_FACILITATOR } from "@/lib/constants";

export const runtime = "nodejs";

/**
 * x402-gated "premium" endpoint (the SELLER/resource-server side), on
 * x402-solana (protocol v2). Unlike the old x402-next package, x402-solana
 * has no Next.js middleware helper — the extract/verify/settle flow lives
 * directly in the route handler instead of a separate middleware.ts.
 *
 * Set X402_PAY_TO_ADDRESS to your receiving Solana wallet to activate the
 * gate. Without it, the route stays open so the app still runs locally.
 */
export async function GET(req: Request) {
  const payTo = process.env.X402_PAY_TO_ADDRESS;
  if (!payTo) {
    return NextResponse.json(premiumPayload());
  }

  const x402 = new X402PaymentHandler({
    network: x402Network as "solana" | "solana-devnet",
    treasuryAddress: payTo,
    facilitatorUrl: serverEnv().X402_FACILITATOR_URL ?? X402_FACILITATOR,
  });

  const resourceUrl = new URL(req.url).toString();
  const paymentHeader = x402.extractPayment(req.headers);
  const paymentRequirements = await x402.createPaymentRequirements(
    {
      amount: "10000", // $0.01 USDC, atomic units (6 decimals)
      asset: { address: usdcMint(activeCluster).toBase58(), decimals: 6 },
      description: "Premium onchain market data (x402-gated)",
    },
    resourceUrl,
  );

  if (!paymentHeader) {
    const response = x402.create402Response(paymentRequirements, resourceUrl);
    const res = NextResponse.json(response.body, { status: response.status });
    // Signals protocol v2 to the client (x402-solana/client looks for this
    // header first); without it, clients fall back to v1's X-PAYMENT header,
    // which this server's extractPayment() never checks — a silent deadlock.
    res.headers.set(
      "PAYMENT-REQUIRED",
      Buffer.from(JSON.stringify(response.body)).toString("base64"),
    );
    return res;
  }

  const verified = await x402.verifyPayment(paymentHeader, paymentRequirements);
  if (!verified.isValid) {
    return NextResponse.json(
      { error: "Invalid payment", reason: verified.invalidReason },
      { status: 402 },
    );
  }

  const settlement = await x402.settlePayment(paymentHeader, paymentRequirements);
  if (!settlement.success) {
    console.error("x402 settlement failed:", settlement.errorReason);
  }

  const res = NextResponse.json(premiumPayload());
  res.headers.set("PAYMENT-RESPONSE", Buffer.from(JSON.stringify(settlement)).toString("base64"));
  return res;
}

function premiumPayload() {
  return {
    resource: "premium-market-data",
    paidWith: "x402 / USDC",
    generatedAt: new Date().toISOString(),
    data: {
      solanaTvlUsd: 4_812_300_000,
      usdcVolume24hUsd: 1_204_500_000,
      topPair: "USDC/SOL",
      sentiment: "bullish",
    },
  };
}
