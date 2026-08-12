# Project Memory

> Durable working context for anyone (human or agent) picking up Sentinel.
> Complements `context/sentinel.md` (vision) and `docs/CURRENT_STATE.md`
> (technical snapshot). Keep entries dated; prune when superseded.

## What this project is (10 seconds)

Sentinel = trust + governance infrastructure for autonomous AI workforces.
Originally a Base × Privy × x402 hackathon MVP (June 2026 — won 2nd place at a
Base × Privy hackathon); migrated to Solana (Aug 2026) for a Solana Hacker
House submission — a personal shift into the Solana ecosystem, not a response
to a technical failure of the Base version. Demonstrates: hire agent with
scoped budget → guardrail blocks out-of-scope spend → real x402 USDC
settlement on Solana → deterministic explainable trust score → autonomy tiers
→ trust-driven budget allocation → org graph of agent-to-agent delegation.

## Ground truth people forget

- **The whole demo state is client-side** (localStorage, key
  `sentinel.store.v1`). There is no database. "Reset demo" reseeds it.
- **Guardrails are enforced in the browser**, not in the API route that spends
  real money. Known, documented, top of roadmap. Do not build new features that
  deepen this pattern.
- **Demo mode is a first-class product feature** of the MVP: no Privy app id →
  entire founder flow works with simulated settlements, clearly labelled. Any
  refactor must keep the wallet-free path working until we decide otherwise.
- **The x402 payment is real** when `AGENT_PRIVATE_KEY` (funded, devnet USDC,
  base58 or JSON byte-array — not hex) + `X402_PAY_TO_ADDRESS` are set; the app
  pays *itself* ($0.01) via `/api/x402/buy` → 402-gated `/api/premium`, gated
  inline in the route itself (`middleware.ts` was deleted — x402-solana has no
  Next.js middleware helper).
- **Next.js here is v16** — APIs/conventions may differ from training data;
  check `node_modules/next/dist/docs/` before writing framework code (per
  AGENTS.md).
- **Chain stack is Solana** (`@solana/web3.js` + `@solana/spl-token`, x402 via
  `x402-solana`/PayAI protocol v2) — no viem/wagmi/OnchainKit left, and no
  dependency-version pin currently needed.
- Repo git history is 3 shallow commits; the codebase itself is the archaeology.

## Environment / accounts

- Cluster default: devnet (`NEXT_PUBLIC_SOLANA_CLUSTER`, flip to
  `mainnet-beta` for mainnet). No runtime chain-switching.
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
- **2026-08-12** — Base/EVM → Solana migration for a Solana Hacker House
  submission. Full chain-touching stack ported; `lib/agents/` engine
  untouched, all 39 tests pass unmodified. See `docs/DECISIONS.md`
  (ADR-013–016) and `memory/decision-log.md` (D-017–020) for the decisions.
