import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * An x402-gated "premium" endpoint. The payment gate lives in middleware.ts —
 * by the time execution reaches here, payment has already been verified.
 * This is the data the buyer paid $0.01 USDC to access.
 */
export async function GET() {
  return NextResponse.json({
    resource: "premium-market-data",
    paidWith: "x402 / USDC",
    generatedAt: new Date().toISOString(),
    data: {
      baseTvlUsd: 4_812_300_000,
      usdcVolume24hUsd: 1_204_500_000,
      topPair: "USDC/ETH",
      sentiment: "bullish",
    },
  });
}
