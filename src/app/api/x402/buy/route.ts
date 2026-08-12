import { NextResponse } from "next/server";
import { payingFetch, decodePaymentResponse } from "@/lib/x402";
import { clientEnv } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Demonstrates the AGENT/BUYER side of x402.
 * The server agent keypair automatically pays the x402-gated /api/premium
 * endpoint and returns the data plus a proof-of-payment settlement signature.
 *
 * Requires AGENT_PRIVATE_KEY (funded with devnet USDC) and an active
 * x402 gate (X402_PAY_TO_ADDRESS set).
 */
export async function POST() {
  try {
    const fetchWithPay = payingFetch();
    const url = `${clientEnv.NEXT_PUBLIC_APP_URL}/api/premium`;

    const res = await fetchWithPay(url, { method: "GET" });
    const data = await res.json();

    const settlement = decodePaymentResponse(res.headers.get("payment-response"));

    return NextResponse.json({
      ok: true,
      data,
      payment: settlement, // { success, transaction, network, payer }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "x402 purchase failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
