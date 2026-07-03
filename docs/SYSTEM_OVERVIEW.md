# System Overview

> The plain-language tour for a new engineer. Read this, then
> `ARCHITECTURE.md` for structure, `DATA_FLOW.md` for mechanics,
> `CURRENT_STATE.md` for honest status. ~10 minutes.

## What you're looking at

A Next.js 16 app that demonstrates **Sentinel**: a founder hires autonomous AI
workers, grants each a *scoped* budget, and the system blocks out-of-scope
spending, settles in-scope payments in USDC on Base (via x402), and turns all
of that behaviour into an explainable trust score that decides how much
autonomy and capital each worker gets.

Three pages tell the story:

- **`/dashboard`** — the operations room: roster, portfolio stats, rankings,
  live activity, an AI commerce chat, and payment demos.
- **`/graph`** — the organization in motion: nodes are workers (size/color =
  trust), edges are agent-to-agent payments; plus the delegation panel where a
  trusted worker hires another.
- **`/agents/[id]`** — one worker: trust ring, factor breakdown, authorization
  card, governance (tier + budget recommendation), the "run purchase" action,
  and its event feed.

## The five ideas that matter

1. **Authorization** — the grant: budget, per-tx cap, expiry, categories.
   (`lib/agents/types.ts`)
2. **Guardrail** — before any purchase, the request is checked against that
   grant: status → expiry → category → per-tx → budget. Fail ⇒ a
   `limit_blocked` event, value never moves. (`lib/agents/authorization.ts`)
3. **Event log** — append-only record of everything: grants, settlements,
   failures, blocks, completed tasks. The single source of truth.
4. **Trust engine** — recomputes a 0–100 score from the log on every read:
   reliability 40% · discipline 25% · completion 20% · consistency 15%, each
   with a written reason, plus a confidence level. (`lib/agents/reputation.ts`)
5. **Governance** — trust ⇒ autonomy tier (Supervised/Trusted/Autonomous ⇒ who
   may delegate) and a budget recommendation the founder applies in one click.
   (`lib/agents/governance.ts`)

## Where state lives (v1 truth)

In your browser. `agents-provider.tsx` keeps `{agents, events}` in React state
persisted to localStorage. There is no database; each browser is its own
universe, seeded with three demo workers (Atlas: excellent record, Nova: good
with one wobble, Probe: reckless and paused). "Reset demo" reseeds.

Everything else — scores, spend, tiers, graph edges — is **derived on read**
from that log by pure functions in `lib/agents/`. That's deliberate: the
engine never changes when the storage does.

## The one real payment

When configured (`AGENT_PRIVATE_KEY` funded with testnet USDC +
`X402_PAY_TO_ADDRESS`), the "Autonomous purchase" button triggers a genuine
x402 flow: the server's agent wallet calls the app's own 402-gated
`/api/premium` endpoint, gets HTTP 402 with payment requirements, signs a USDC
authorization, retries, the facilitator settles on Base, and the UI links the
settlement transaction. Unconfigured (or on failure), it records a
clearly-labelled **simulated** settlement instead so the flow never dead-ends.

## What's real vs demo (memorize this)

| Real | Demo-only |
|---|---|
| Trust/governance engine (pure, tested) | State custody (localStorage) |
| Guardrail *logic* | Guardrail *placement* (client-side; server pays blindly) |
| x402 settlement path (when configured) | Agent-to-agent settlement (simulated coordination) |
| Privy wallets, USDC transfers, on-chain verification | Task completion (self-reported) |
| Explainable trust deltas | Multi-user/org anything |

The full gap list: `KNOWN_LIMITATIONS.md`. The plan to close it: `ROADMAP.md`.

## Repo mental map

```
context/sentinel.md      why we exist (source of truth)
docs/                    engineering + product docs (start: this file)
memory/                  working notes: decisions, project memory, research
src/lib/agents/          ★ the engine — pure, deterministic, tested
src/lib/                 chain/payment plumbing (viem, usdc, x402, env)
src/components/agents/   the workforce UI + the client store
src/app/                 pages + API routes; middleware.ts = x402 gate
scripts/                 wallet-new · check-env · balance · send-usdc
```

## Run it

```bash
pnpm install && cp .env.example .env.local && pnpm dev   # full demo, no keys
pnpm test        # engine test suite
pnpm preflight   # typecheck + lint + env check
```

Add keys per `README.md` / `QUICKSTART.md` to light up wallets, AI chat, and
real settlement, in that order.
