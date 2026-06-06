import { tool } from "ai";
import { z } from "zod";
import { type Address, type Hash } from "viem";
import { getUsdcBalance, parseUsdc } from "../usdc";
import { buildUsdcTransfer } from "../usdc";
import { explorerTx, waitForTx } from "../tx";
import { chainLabel } from "../chains";

/**
 * Wallet-aware AI tools (Vercel AI SDK).
 *
 * Read-only tools (balance, status) execute server-side immediately.
 * Value-moving tools return an *unsigned* intent the client must approve and
 * sign in the user's wallet — the model never holds the user's keys.
 */
export const commerceTools = {
  getUsdcBalance: tool({
    description: `Get the USDC balance of an address on ${chainLabel}.`,
    inputSchema: z.object({
      address: z.string().describe("0x-prefixed wallet address to check"),
    }),
    execute: async ({ address }) => {
      const { formatted } = await getUsdcBalance(address as Address);
      return { address, balanceUsdc: formatted, chain: chainLabel };
    },
  }),

  quotePayment: tool({
    description: "Quote a USDC payment: validate amount + recipient and return a human summary.",
    inputSchema: z.object({
      to: z.string().describe("recipient 0x address"),
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
        chain: chainLabel,
        memo: memo ?? null,
        summary: `Pay ${amount} USDC to ${to} on ${chainLabel}.`,
      };
    },
  }),

  prepareUsdcTransfer: tool({
    description:
      "Prepare an UNSIGNED USDC transfer for the user to approve in their wallet. Returns calldata; does NOT move funds.",
    inputSchema: z.object({
      to: z.string().describe("recipient 0x address"),
      amount: z.string().describe("amount in USDC, human units"),
    }),
    execute: async ({ to, amount }) => {
      const call = buildUsdcTransfer(to as Address, amount);
      return {
        requiresApproval: true,
        call: { to: call.to, data: call.data, value: "0" },
        humanReadable: `Transfer ${amount} USDC to ${to}`,
      };
    },
  }),

  getTransactionStatus: tool({
    description: "Look up the status of a transaction by hash and return an explorer link.",
    inputSchema: z.object({ hash: z.string().describe("0x transaction hash") }),
    execute: async ({ hash }) => {
      try {
        const res = await waitForTx(hash as Hash);
        return {
          confirmed: res.success,
          blockNumber: res.blockNumber.toString(),
          explorer: res.explorer,
        };
      } catch {
        return { confirmed: false, explorer: explorerTx(hash as Hash), note: "pending or not found" };
      }
    },
  }),
};
