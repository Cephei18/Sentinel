# Tech Stack

> What we run, why, and the sharp edges. Versions from `package.json`.

## Core

| Layer | Choice | Version | Why / notes |
|---|---|---|---|
| Framework | Next.js (App Router) | **16.2.7** | Pages + API routes in one deployable. ⚠ v16 conventions differ from older docs/training data — consult `node_modules/next/dist/docs/` (AGENTS.md rule). |
| Language | TypeScript, strict | ^5 | Non-negotiable for a money-adjacent domain. |
| UI | React 19 · Tailwind v4 · motion 12 · lucide · sonner | — | Tailwind v4 = CSS-first config in `globals.css` (no tailwind.config). cva+tailwind-merge for variants (`cn`). |
| AI | Vercel AI SDK v6 (`ai` ^6, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/react`) | v6 | Streaming tool-calling; UI renders `message.parts`. Provider chosen by available key. Note: `openai` + `@anthropic-ai/sdk` raw SDKs are also installed but unused by app code — candidates for removal. |
| Chain | `@solana/web3.js` · `@solana/spl-token` · `bs58` | web3.js **^1.98** | Full replacement for viem/wagmi/ethers — no chain-abstraction library needed since there's exactly one cluster active at a time. `bs58` decodes base58 secret keys / addresses. |
| Wallets/auth | Privy (`@privy-io/react-auth` 3) reconfigured for Solana | — | Single identity layer: email/social → embedded Solana wallet; external Solana wallets same provider (`embeddedWallets: { solana: {...} }`, `walletChainType: "solana-only"`). Client-only mount (SSR throws). Ships with Solana peer packages `@solana-program/memo`, `@solana-program/system`, `@solana-program/token`, `@solana/kit` — marked "optional" in Privy's own package.json, but its Solana bundle statically imports them, so they're installed directly here or the app 500s on any page importing `useWallet`. No more `@privy-io/wagmi` (deleted — Solana has no wagmi-style config to bridge into). |
| Payments | `x402-solana` (protocol v2, PayAI Network) | ^3 | Replaces the deprecated V1 line (`x402-next`, `x402-fetch`, `x402-axios`) entirely. v2 uses `PAYMENT-SIGNATURE` request / `PAYMENT-RESPONSE` response headers. No Next.js middleware helper exists for v2 — the seller-side extract/verify/settle flow lives directly inside `src/app/api/premium/route.ts`. `@coinbase/onchainkit` is gone (Base-only, no Solana equivalent needed). |
| Validation | zod | ^4 | Env schemas (`lib/env.ts`), API bodies. |
| State | React context + localStorage | — | v1 only (ADR-004). |

## Chain config

Solana devnet (default) / mainnet-beta via `NEXT_PUBLIC_SOLANA_CLUSTER`. No
runtime chain-switching — Solana wallets have no "switch chain" UI action, so
exactly one cluster is active per deployment, chosen at build/env time.

USDC (SPL, 6 decimals): mainnet mint `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
/ devnet mint `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`. Balances live on
Associated Token Accounts (ATAs) derived from `(wallet pubkey, mint)` — not
read directly off the wallet address the way an ERC-20 balance was.

Public RPC fallbacks; override with `SOLANA_RPC_URL` (server, can embed a
paid provider key) / `NEXT_PUBLIC_SOLANA_RPC_URL` (client, public-safe) — just
one pair now, since there's only one active cluster.

x402 facilitator: PayAI's `https://facilitator.payai.network` (serves both
devnet and mainnet) by default, overridable with `X402_FACILITATOR_URL`.

Addresses are base58 Solana pubkeys (not `0x` hex); transaction identifiers
are base58 signatures, ~87-88 chars (not fixed 66-char hex hashes). Explorer
is Solana Explorer (`explorer.solana.com/tx/{sig}?cluster=devnet`), not
Basescan.

## Tooling

- **pnpm 9** (lockfile + `.npmrc`: auto-install-peers, no strict peers). The
  `pnpm.overrides.viem` pin from the Base version is gone — no viem left to
  pin.
- ESLint 9 flat config (`next/core-web-vitals` + TS) · Prettier 3 + tailwind
  plugin (printWidth 100, double quotes).
- husky + lint-staged pre-commit (eslint --fix + prettier on staged).
- **vitest** — engine test suite (`src/lib/agents/*.test.ts`); all 39 tests
  pass unmodified post-migration — the engine has zero chain imports.
- `tsx` CLIs in `scripts/` (self-contained; deliberate constant duplication —
  KNOWN_LIMITATIONS #14): `wallet-new` (`Keypair.generate()`), `balance` /
  `send-usdc` (SPL ATA-based, via `@solana/spl-token`), `check-env`,
  `_shared.ts` (Connection/mint/explorer helpers).
- `pnpm preflight` = typecheck + lint + check-env. **CI: none yet (M1 gap).**
- Deploy target: Vercel (`vercel.json`; 30s maxDuration on `agent` + `buy`).

## Dependencies removed in the Solana migration

`@coinbase/onchainkit`, `@privy-io/wagmi`, `ethers`, `viem`, `wagmi`, `x402`,
`x402-axios`, `x402-fetch`, `x402-next`, plus the `pnpm.overrides.viem` pin.

## Dependencies added

`@solana/web3.js`, `@solana/spl-token`, `bs58`, `x402-solana`, plus Privy's
Solana peer packages `@solana-program/memo`, `@solana-program/system`,
`@solana-program/token`, `@solana/kit` (required directly — see Wallets/auth
row above).

## Env vars (full reference in `.env.example`)

Client: `NEXT_PUBLIC_PRIVY_APP_ID` (absent ⇒ demo mode),
`NEXT_PUBLIC_SOLANA_CLUSTER`, optional `NEXT_PUBLIC_SOLANA_RPC_URL`/app-url.
Server: `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` (either), `AGENT_PRIVATE_KEY`
(Solana secret key — base58 or JSON byte-array; devnet only for now, replaced
by Privy server wallets in M2), `X402_PAY_TO_ADDRESS` (base58 address,
activates the 402 gate), optional `SOLANA_RPC_URL` / `X402_FACILITATOR_URL`
overrides. Dropped entirely, no Solana equivalent:
`NEXT_PUBLIC_ONCHAINKIT_API_KEY`, `NEXT_PUBLIC_WC_PROJECT_ID`.

## Target-stack decisions already made (ADR-012)

x402-solana V2 · Privy Solana server wallets + policy engine · Postgres
append-only event store (hash-chained) · hand-rolled deterministic policy
evaluator → Cedar when policy count grows · OTel GenAI semantic conventions ·
on-chain attestation anchoring on Solana. Rationale: `memory/research-notes.md`.
