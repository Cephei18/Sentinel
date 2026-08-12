import type { VersionedTransaction } from "@solana/web3.js";
import { createX402Client } from "x402-solana/client";
import { getAgentKeypair } from "./connection";
import { x402Network } from "./solana";

/**
 * x402 paying client (the AGENT/BUYER side), on x402-solana (protocol v2).
 * x402 turns HTTP 402 "Payment Required" into a real, automatic flow:
 *   1. Client hits a paid endpoint and gets 402 + v2 payment requirements.
 *   2. This wraps the agent's server-side Keypair as a wallet adapter that
 *      signs the payment transaction directly (no Privy UI in the loop —
 *      this is the autonomous agent, not a human wallet).
 *   3. The request is retried with a `PAYMENT-SIGNATURE` header.
 *   4. The facilitator verifies + settles on Solana; the server returns the data.
 *
 * Server-only — uses the agent's Solana keypair via getAgentKeypair().
 */

/** A `fetch` that transparently pays x402 v2 invoices with the agent keypair. */
export function payingFetch(): typeof fetch {
  const keypair = getAgentKeypair();
  const client = createX402Client({
    wallet: {
      address: keypair.publicKey.toBase58(),
      signTransaction: async (tx: VersionedTransaction) => {
        tx.sign([keypair]);
        return tx;
      },
    },
    network: x402Network as "solana" | "solana-devnet",
  });
  return client.fetch.bind(client) as typeof fetch;
}

/**
 * Decode the `PAYMENT-RESPONSE` header the resource server returns after
 * settlement (see api/premium/route.ts for where it's set). Contains the
 * settlement signature + network — perfect for showing "proof of payment"
 * in a demo.
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
