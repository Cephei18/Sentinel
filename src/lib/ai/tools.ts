import { tool } from "ai";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { getUsdcBalance, parseUsdc, usdcMint } from "../usdc";
import { explorerTx, waitForTx } from "../tx";
import { clusterLabel } from "../solana";

/**
 * Wallet-aware AI tools (Vercel AI SDK).
 *
 * Read-only tools (balance, status) execute server-side immediately.
 * Value-moving tools return an *unsigned* intent the client must approve and
 * sign in the user's wallet — the model never holds the user's keys.
 */
export const commerceTools = {
  getUsdcBalance: tool({
    description: `Get the USDC balance of a wallet on ${clusterLabel}.`,
    inputSchema: z.object({
      address: z.string().describe("base58 Solana wallet address to check"),
    }),
    execute: async ({ address }) => {
      const { formatted } = await getUsdcBalance(new PublicKey(address));
      return { address, balanceUsdc: formatted, chain: clusterLabel };
    },
  }),

  quotePayment: tool({
    description: "Quote a USDC payment: validate amount + recipient and return a human summary.",
    inputSchema: z.object({
      to: z.string().describe("recipient base58 Solana address"),
      amount: z.string().describe("amount in USDC, human units e.g. '2.50'"),
      memo: z.string().optional(),
    }),
    execute: async ({ to, amount, memo }) => {
      const baseUnits = parseUsdc(amount).toString();
      return {
        to,
        amount,
        amountBaseUnits: baseUnits,
        token: "USDC",
        chain: clusterLabel,
        memo: memo ?? null,
        summary: `Pay ${amount} USDC to ${to} on ${clusterLabel}.`,
      };
    },
  }),

  prepareUsdcTransfer: tool({
    description:
      "Describe an UNSIGNED USDC transfer intent for the user to approve in their wallet. " +
      "Returns the transfer details, not a ready instruction — building the actual SPL " +
      "transfer needs the connected wallet's own address as the payer, which this " +
      "server-side tool doesn't have. Does NOT move funds.",
    inputSchema: z.object({
      to: z.string().describe("recipient base58 Solana address"),
      amount: z.string().describe("amount in USDC, human units"),
    }),
    execute: async ({ to, amount }) => {
      return {
        requiresApproval: true,
        intent: { to, amount, token: "USDC", mint: usdcMint().toBase58() },
        humanReadable: `Transfer ${amount} USDC to ${to}`,
      };
    },
  }),

  getTransactionStatus: tool({
    description: "Look up the status of a transaction by signature and return an explorer link.",
    inputSchema: z.object({ signature: z.string().describe("base58 transaction signature") }),
    execute: async ({ signature }) => {
      try {
        const res = await waitForTx(signature);
        return { confirmed: res.success, explorer: res.explorer };
      } catch {
        return { confirmed: false, explorer: explorerTx(signature), note: "pending or not found" };
      }
    },
  }),
};
