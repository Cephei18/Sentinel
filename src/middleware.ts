import { NextResponse } from "next/server";
import { paymentMiddleware } from "x402-next";
import { X402_TESTNET_FACILITATOR } from "@/lib/constants";

/**
 * x402 payment gate (the SELLER/resource-server side).
 *
 * Any request to a matched route returns HTTP 402 with payment requirements
 * until the caller attaches a valid `X-PAYMENT` header. The facilitator
 * verifies + settles the USDC payment on Base, then the request proceeds.
 *
 * Set X402_PAY_TO_ADDRESS to your receiving wallet to activate the gate.
 * Without it, routes are left open so the app still runs locally.
 */
const payTo = process.env.X402_PAY_TO_ADDRESS as `0x${string}` | undefined;
const network = (process.env.NEXT_PUBLIC_CHAIN === "base" ? "base" : "base-sepolia") as
  | "base"
  | "base-sepolia";

export const middleware = payTo
  ? paymentMiddleware(
      payTo,
      {
        "/api/premium": {
          price: "$0.01",
          network,
          config: { description: "Premium onchain market data (x402-gated)" },
        },
      },
      { url: (process.env.X402_FACILITATOR_URL ?? X402_TESTNET_FACILITATOR) as `https://${string}` },
    )
  : () => NextResponse.next();

export const config = {
  // Only run middleware on the gated routes (keep it off static assets).
  matcher: ["/api/premium/:path*"],
};
