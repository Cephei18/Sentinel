# Project Memory

> Durable working context for anyone (human or agent) picking up Sentinel.
> Complements `context/sentinel.md` (vision) and `docs/CURRENT_STATE.md`
> (technical snapshot). Keep entries dated; prune when superseded.

## What this project is (10 seconds)

Sentinel = trust + governance infrastructure for autonomous AI workforces.
Hackathon MVP (Base × Privy × x402, June 2026) demonstrating: hire agent with
scoped budget → guardrail blocks out-of-scope spend → real x402 USDC settlement
on Base → deterministic explainable trust score → autonomy tiers → trust-driven
budget allocation → org graph of agent-to-agent delegation.

## Ground truth people forget

- **The whole demo state is client-side** (localStorage, key
  `sentinel.store.v1`). There is no database. "Reset demo" reseeds it.
- **Guardrails are enforced in the browser**, not in the API route that spends
  real money. Known, documented, top of roadmap. Do not build new features that
  deepen this pattern.
- **Demo mode is a first-class product feature** of the MVP: no Privy app id →
  entire founder flow works with simulated settlements, clearly labelled. Any
  refactor must keep the wallet-free path working until we decide otherwise.
- **The x402 payment is real** when `AGENT_PRIVATE_KEY` (funded, Base Sepolia
  USDC) + `X402_PAY_TO_ADDRESS` are set; the app pays *itself* ($0.01) via
  `/api/x402/buy` → 402-gated `/api/premium`.
- **Next.js here is v16** — APIs/conventions may differ from training data;
  check `node_modules/next/dist/docs/` before writing framework code (per
  AGENTS.md).
- **viem is pinned 2.52.2 via pnpm override** — multiple viem copies in the
  graph cause TS type mismatch errors. Don't "upgrade" casually.
- Repo git history is 3 shallow commits; the codebase itself is the archaeology.

## Environment / accounts

- Chain default: Base Sepolia (`NEXT_PUBLIC_CHAIN`, flip to `base` for mainnet).
- `.env.local` exists locally, untracked. `.env.example` documents every var.
- Useful scripts: `pnpm wallet:new`, `check-env`, `preflight`, `balance`,
  `send-usdc` (backup demo payment path).

## Open questions (carry forward)

1. **Naming:** "Sentinel" collides with Microsoft Sentinel, SentinelOne, and
   other agent-governance projects (market research, 2026-07). Rename likely
   needed before public launch.
2. First customer profile: teams already running paying agents (crypto-native)
   vs enterprises wanting governance before payments (fiat, x402-less)? Affects
   whether payment rails or policy engine leads the roadmap.
3. When the backend lands, does the trust engine stay TypeScript (shared package)
   or move behind a service boundary with a versioned scoring spec?
4. How to verify `task_completed` honestly (counterparty attestation, output
   verification) — trust v2 blocker.

## Session log

- **2026-07-03** — Founding-engineer onboarding: full code read, market+tech
  research, context system created (`context/`, `docs/`, `memory/`), audit and
  roadmap written, engine test suite added. See `docs/NEXT_STEPS.md` for the
  hand-off state.
