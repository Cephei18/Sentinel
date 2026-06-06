import axios, { type AxiosInstance } from "axios";
import { wrapFetchWithPayment } from "x402-fetch";
import { withPaymentInterceptor } from "x402-axios";
import { getAgentWalletClient } from "./viem";

/**
 * x402 paying clients (the AGENT/BUYER side).
 *
 * x402 turns HTTP 402 "Payment Required" into a real, automatic flow:
 *   1. Client hits a paid endpoint and gets 402 + payment requirements.
 *   2. These wrappers sign a USDC payment authorization with the agent wallet.
 *   3. The request is retried with an `X-PAYMENT` header.
 *   4. The facilitator verifies + settles on Base; the server returns the data.
 *
 * All server-only — they use the agent's private key via getAgentWalletClient().
 */

/** A `fetch` that transparently pays x402 invoices with the agent wallet. */
export function payingFetch(): typeof fetch {
  const walletClient = getAgentWalletClient();
  // wrapFetchWithPayment signs + retries on 402 automatically.
  return wrapFetchWithPayment(fetch, walletClient as never) as typeof fetch;
}

/** An axios instance that transparently pays x402 invoices. */
export function payingAxios(baseURL?: string): AxiosInstance {
  const walletClient = getAgentWalletClient();
  return withPaymentInterceptor(axios.create({ baseURL }), walletClient as never);
}

/**
 * Decode the `X-PAYMENT-RESPONSE` header the server returns after settlement.
 * Contains the settlement tx hash + network — perfect for showing "proof of
 * payment" in a demo.
 */
export function decodePaymentResponse(headerValue?: string | null): {
  success?: boolean;
  transaction?: string;
  network?: string;
  payer?: string;
} | null {
  if (!headerValue) return null;
  try {
    const json = Buffer.from(headerValue, "base64").toString("utf-8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}
