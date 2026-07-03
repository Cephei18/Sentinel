# Tech Stack

> What we run, why, and the sharp edges. Versions from `package.json`
> (2026-07-03).

## Core

| Layer | Choice | Version | Why / notes |
|---|---|---|---|
| Framework | Next.js (App Router) | **16.2.7** | Pages + API routes + middleware in one deployable. ⚠ v16 conventions differ from older docs/training data — consult `node_modules/next/dist/docs/` (AGENTS.md rule). |
| Language | TypeScript, strict | ^5 | Non-negotiable for a money-adjacent domain. |
| UI | React 19 · Tailwind v4 · motion 12 · lucide · sonner | — | Tailwind v4 = CSS-first config in `globals.css` (no tailwind.config). cva+tailwind-merge for variants (`cn`). |
| AI | Vercel AI SDK v6 (`ai` ^6, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/react`) | v6 | Streaming tool-calling; UI renders `message.parts`. Provider chosen by available key. Note: `openai` + `@anthropic-ai/sdk` raw SDKs are also installed but unused by app code — candidates for removal. |
| Chain | viem 2 · wagmi 2 | viem **pinned 2.52.2** via pnpm override | Multiple viem copies in the graph (wagmi/privy/x402) break TS types — upgrade all-at-once only, with `pnpm typecheck` proof. ethers ^6 is installed but unused by app code — removal candidate. |
| Wallets/auth | Privy (`@privy-io/react-auth` 3, `@privy-io/wagmi` 4) | — | Single identity layer: email/social → embedded wallet; external wallets same provider. Client-only mount (SSR throws). Server wallets + signing-time policies are the M2 backstop. |
| Payments | x402 (`x402-next`, `x402-fetch`, `x402-axios` 1.2.x) | ⚠ **deprecated V1 line** | Ecosystem moved to `@x402/*` V2 (Dec 2025). Migration = Roadmap M2. `@coinbase/onchainkit` installed for optional Base UX. |
| Validation | zod | ^4 | Env schemas (`lib/env.ts`), API bodies. |
| State | React context + localStorage | — | v1 only (ADR-004). TanStack Query underneath wagmi. |

## Chain config

Base Sepolia (84532) default / Base mainnet (8453) via `NEXT_PUBLIC_CHAIN`.
Native USDC (6 decimals): `0x036C…CF7e` (Sepolia) / `0x8335…2913` (mainnet).
Public RPC fallbacks; override with `BASE_RPC_URL`/`BASE_SEPOLIA_RPC_URL`.
x402 facilitator: `https://x402.org/facilitator` (testnet default) or
`X402_FACILITATOR_URL` (CDP for mainnet).

## Tooling

- **pnpm 9** (lockfile + `.npmrc`: auto-install-peers, no strict peers).
- ESLint 9 flat config (`next/core-web-vitals` + TS) · Prettier 3 + tailwind
  plugin (printWidth 100, double quotes).
- husky + lint-staged pre-commit (eslint --fix + prettier on staged).
- **vitest** — engine test suite (`src/lib/agents/*.test.ts`), added 2026-07-03.
- `tsx` CLIs in `scripts/` (self-contained; deliberate constant duplication —
  KNOWN_LIMITATIONS #14).
- `pnpm preflight` = typecheck + lint + check-env. **CI: none yet (M1 gap).**
- Deploy target: Vercel (`vercel.json`; 30s maxDuration on `agent` + `buy`).

## Env vars (full reference in `.env.example`)

Client: `NEXT_PUBLIC_PRIVY_APP_ID` (absent ⇒ demo mode), `NEXT_PUBLIC_CHAIN`,
optional OnchainKit/WC/app-url. Server: `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`
(either), `AGENT_PRIVATE_KEY` (hot key — testnet only; replaced by Privy
server wallets in M2), `X402_PAY_TO_ADDRESS` (activates the 402 gate),
optional facilitator/RPC overrides.

## Target-stack decisions already made (ADR-012)

`@x402/*` V2 · Privy server wallets + policy engine · Postgres append-only
event store (hash-chained) · hand-rolled deterministic policy evaluator →
Cedar when policy count grows · OTel GenAI semantic conventions · EAS on Base
for attestation anchoring. Rationale: `memory/research-notes.md`.
