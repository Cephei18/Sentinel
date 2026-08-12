# Current State

> Technical snapshot of the repository as of 2026-07-03. What exists, what
> works, what is demo-only. Companion to `KNOWN_LIMITATIONS.md` (the gap list)
> and `ARCHITECTURE.md` (structure).

## TL;DR

A polished, working **hackathon MVP** of the Sentinel founder loop, migrated
from a Next.js 16 + Base/Privy/x402 starter to a Next.js 16 + Solana/Privy/
x402-solana stack for the Solana Hacker House. The trust and governance
*engine* is real, pure, and testable — and untouched by the migration. The
*system around it* is a client-side demo: localStorage state, browser-enforced
guardrails, one live x402 payment path that pays the app itself.

## What demonstrably works

| Capability | Status | Where |
|---|---|---|
| Hire agent with scoped authorization | ✅ real (client state) | `create-agent-dialog` → store |
| Pre-flight guardrail block (status/expiry/category/per-tx/budget) | ✅ real checks, client-enforced | `lib/agents/authorization.ts` via profile + delegation UIs |
| Deterministic explainable trust score + confidence | ✅ real | `lib/agents/reputation.ts` |
| Trust deltas surfaced per event (+3/−4 with reason) | ✅ real | `projectScoreDelta` + toasts + feed |
| Autonomy tiers gating delegation | ✅ real | `lib/agents/governance.ts` |
| Budget recommendations, one-click apply | ✅ real | `governance-card` → `setBudget` |
| x402 seller (402-gated endpoint) | ✅ real when `X402_PAY_TO_ADDRESS` set | `/api/premium` (x402-solana gate lives in the route; no middleware) |
| x402 buyer (agent autonomously pays) | ✅ real on-chain when wallet funded; simulated fallback otherwise | `/api/x402/buy` + `lib/x402.ts` |
| Agent-to-agent delegation + org graph | ⚠ simulated coordination (no on-chain settlement between agent wallets) | `payAgent` + `trust-graph` |
| AI commerce chat (tool-calling, unsigned intents) | ✅ real with an LLM key | `/api/agent` + `lib/ai/*` |
| USDC transfer via user wallet | ✅ real with Privy (Solana) | `use-usdc-transfer`, `usdc-payment` |
| On-chain payment verification | ✅ real | `/api/verify-payment` |
| Wallet-free demo mode | ✅ first-class | `providers.tsx` + `demo-mode.tsx` |

## System shape (v1)

- **State:** one React context (`agents-provider.tsx`) holding `{agents, events}`
  in localStorage (`sentinel.store.v1`). Everything else derived on read.
- **Engine:** `src/lib/agents/` — types, reputation, governance, authorization,
  seed, format. Pure TS, no framework imports, now unit-tested.
- **Chain plumbing:** `src/lib/` — solana/constants/env/connection/usdc/tx/x402.
  One switch (`NEXT_PUBLIC_SOLANA_CLUSTER`) flips devnet ↔ mainnet-beta.
- **Server surface:** 5 routes (`agent`, `premium`, `x402/buy`,
  `verify-payment`, `health`); the x402 gate lives directly in the `premium`
  route handler (x402-solana has no Next.js middleware helper). No database.
- **UI:** landing, `/dashboard` (ops), `/graph` (org), `/agents/[id]` (profile);
  ~18 agent components + wallet/payment/chat components + small ui-kit.

## Degradation ladder (deliberate demo design)

1. **Nothing configured** → full demo mode: seeded workforce, simulated
   settlements, wallet widgets show placeholders. Entire founder flow works.
2. **+ Privy app id** → real login + embedded Solana wallets + USDC transfers.
3. **+ LLM key** → live tool-calling commerce chat.
4. **+ funded `AGENT_PRIVATE_KEY` & `X402_PAY_TO_ADDRESS`** → the autonomous
   purchase settles real USDC on Solana (devnet by default) with a Solana
   Explorer link.

Caveat to keep in mind: at every rung, *failures fall back to labelled
simulation* rather than erroring — great on stage, must become explicit modes
in the product (KNOWN_LIMITATIONS #12).

## Tooling & quality state

- **Quality gates:** strict TS, ESLint 9 flat config, Prettier + tailwind
  plugin, husky + lint-staged pre-commit, `pnpm preflight`
  (typecheck+lint+env). **Tests:** vitest engine suite (added 2026-07-03). **CI: none.**
- **Deploy:** `vercel.json` (pnpm, 30s maxDuration on agent/buy routes). Not
  known to be deployed anywhere currently.
- **Scripts:** `wallet:new`, `check-env`, `balance`, `send-usdc` — all working,
  self-contained (deliberately duplicated constants; see KNOWN_LIMITATIONS #14).
- **Docs:** full context system under `context/`, `docs/`, `memory/`
  (this onboarding pass); demo-era docs (DEMO_FLOW, SLIDES, QUICKSTART,
  CHEATSHEET, COMMON_ERRORS, HACKATHON_PLAYBOOK) remain accurate to the code.

## Honest bottom line

The demo *narrative* ("every payment checked before value moves; trust earned,
explainable, and consequential") is fully implemented **as a single-browser
simulation with one real payment path**. The engine deserves production; the
custody, enforcement placement, identity, and persistence around it are the
work. That gap is precisely mapped in `KNOWN_LIMITATIONS.md` and sequenced in
`ROADMAP.md`.
