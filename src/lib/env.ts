import { z } from "zod";

/**
 * Environment validation. Two surfaces:
 *  - `clientEnv`  → NEXT_PUBLIC_* values, safe in the browser, validated at module load.
 *  - `serverEnv()` → secrets, validated lazily and ONLY on the server.
 *
 * Next.js inlines NEXT_PUBLIC_* at build time, so they must be referenced
 * statically (process.env.NEXT_PUBLIC_X), which is why they're listed explicitly.
 */

const clientSchema = z.object({
  NEXT_PUBLIC_PRIVY_APP_ID: z
    .string()
    .min(1, "Set NEXT_PUBLIC_PRIVY_APP_ID — get it at https://dashboard.privy.io"),
  NEXT_PUBLIC_SOLANA_CLUSTER: z.enum(["mainnet-beta", "devnet"]).default("devnet"),
  NEXT_PUBLIC_SOLANA_RPC_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

const _clientParsed = clientSchema.safeParse({
  NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
  NEXT_PUBLIC_SOLANA_CLUSTER: process.env.NEXT_PUBLIC_SOLANA_CLUSTER,
  NEXT_PUBLIC_SOLANA_RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

if (!_clientParsed.success && process.env.NODE_ENV !== "production") {
  // Surface a readable error in dev instead of a cryptic undefined-at-runtime
  // crash. Silenced in production builds to avoid noisy prerender logs.
  console.error(
    "❌ Invalid client environment variables:",
    z.flattenError(_clientParsed.error).fieldErrors,
  );
}

/** Validated public env. Falls back to safe defaults if parsing failed (dev ergonomics). */
export const clientEnv = _clientParsed.success
  ? _clientParsed.data
  : ({
      NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "",
      NEXT_PUBLIC_SOLANA_CLUSTER:
        (process.env.NEXT_PUBLIC_SOLANA_CLUSTER as "mainnet-beta" | "devnet") ?? "devnet",
      NEXT_PUBLIC_SOLANA_RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    } as z.infer<typeof clientSchema>);

const serverSchema = z.object({
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  // Server-side agent keypair (Solana) used for x402 paying + autonomous tx.
  // Accepts either a base58 secret key (Phantom export format) or a JSON
  // byte-array string (solana-keygen / Solana CLI format).
  AGENT_PRIVATE_KEY: z
    .string()
    .regex(
      /^(\[[\d,\s]+\]|[1-9A-HJ-NP-Za-km-z]{80,90})$/,
      "AGENT_PRIVATE_KEY must be a base58 secret key or a JSON byte array — run `pnpm wallet:new`",
    )
    .optional(),
  // Wallet that receives x402 payments on your resource server.
  X402_PAY_TO_ADDRESS: z
    .string()
    .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, "X402_PAY_TO_ADDRESS must be a base58 Solana address")
    .optional(),
  X402_FACILITATOR_URL: z.string().url().optional(),
  SOLANA_RPC_URL: z.string().url().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let _serverEnv: ServerEnv | null = null;

/** Lazily validate + cache server env. Throws if called in the browser. */
export function serverEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() must only be called on the server.");
  }
  if (_serverEnv) return _serverEnv;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(
      "❌ Invalid server environment variables:",
      z.flattenError(parsed.error).fieldErrors,
    );
    throw new Error("Invalid server environment variables. Check your .env.local.");
  }
  _serverEnv = parsed.data;
  return _serverEnv;
}
