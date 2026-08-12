/**
 * Pre-flight env checklist. Run before demos:
 *   pnpm check-env
 * Verifies required vars and warns about optional-but-recommended ones.
 */
import { config } from "dotenv";
import { log } from "./_shared";

config({ path: ".env.local" });

type Check = { key: string; required: boolean; hint: string };

const CHECKS: Check[] = [
  {
    key: "NEXT_PUBLIC_PRIVY_APP_ID",
    required: true,
    hint: "dashboard.privy.io → App → App ID (enable Solana embedded wallets)",
  },
  {
    key: "NEXT_PUBLIC_SOLANA_CLUSTER",
    required: false,
    hint: "'devnet' (default) or 'mainnet-beta'",
  },
  {
    key: "OPENAI_API_KEY",
    required: false,
    hint: "enables the AI agent (or use ANTHROPIC_API_KEY)",
  },
  { key: "ANTHROPIC_API_KEY", required: false, hint: "alt AI provider" },
  { key: "AGENT_PRIVATE_KEY", required: false, hint: "server agent wallet — pnpm wallet:new" },
  { key: "X402_PAY_TO_ADDRESS", required: false, hint: "receiving wallet — activates x402 gate" },
];

let hardFail = false;
log.title("🔎 Environment check");

for (const c of CHECKS) {
  const val = process.env[c.key];
  if (val && val.length > 0) {
    log.ok(`${c.key}`);
  } else if (c.required) {
    log.err(`${c.key} — MISSING (required). ${c.hint}`);
    hardFail = true;
  } else {
    log.warn(`${c.key} — not set. ${c.hint}`);
  }
}

const hasAi = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
if (!hasAi) log.warn("No AI key set — the agent route will return 500 until you add one.");

console.log();
if (hardFail) {
  log.err("Missing required vars. Copy .env.example → .env.local and fill them in.");
  process.exit(1);
} else {
  log.ok("Core env looks good. You're clear to run `pnpm dev`.");
}
