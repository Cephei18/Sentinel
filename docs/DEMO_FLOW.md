# Demo Flow — the 3-minute judge script

Goal: in 3 minutes a judge watches **a founder manage an AI-native company** — hiring AI workers, governing their spend, and letting trust allocate autonomy and capital — live, on real rails.

## Before you present (pre-flight)
```bash
pnpm preflight     # typecheck + lint + env all green
pnpm balance       # agent wallet has SOL (fees) + USDC (for the real x402 step)
```
- [ ] `.env.local` has a real `NEXT_PUBLIC_PRIVY_APP_ID` (Solana wallet config enabled)
- [ ] AI key set (`OPENAI_API_KEY` or `ANTHROPIC_API_KEY`)
- [ ] Agent wallet funded on devnet (≥ 0.05 SOL, ≥ 1 USDC) + `X402_PAY_TO_ADDRESS` set
- [ ] Solana Explorer tab open: https://explorer.solana.com/?cluster=devnet
- [ ] `pnpm dev` running, **`/graph` loaded** (open on the network, not on slides)

> The graph, scoring, guardrails, and agent-to-agent flow run on seeded client state — **they
> work with no wallet and no devnet.** Only the single real x402 settlement needs funds; if it's
> down, the demo still lands (see fallback).

## The script (≈3 min)

**0:00 — Org reveal (20s).**
Open on `/graph`. Workers orbit you (the founder) at the center; packets flow along payment edges.
"This is an AI-native company. Each node is an autonomous AI worker. The more reliable, the closer
to me. Sentinel is the operating system that runs it."

**0:20 — Hire a worker (30s).**
Go to **Operations** → **Hire AI worker**. Set a budget, per-tx limit, expiry, categories.
"I don't hand a worker a blank cheque — I delegate *scoped* financial authority."

**0:50 — Govern + settle (50s). ⭐**
Open the new worker's profile. **Pause** it → **Run purchase** → *blocked by guardrail*, toast shows
**Trust −N**. "The guardrail stopped an unauthorized payment, and its reliability dropped."
**Resume** → **Run purchase** → a **real x402 USDC payment settles on Solana** (click the
settlement link to Solana Explorer — a base58 signature, not a hex hash), the trust ring pops up,
toast shows **Trust +N**. "Real money, on-chain, gated by the worker's own authorization — and
you can see exactly why the score moved."

**1:40 — Workers hiring workers (40s).**
Back to `/graph` → **Delegate work**. Hire the highest-reliability provider (selected by default).
A **new edge animates in**; both reputations evolve. "Workers hiring workers — and only *Trusted*
workers can delegate. Trust gates autonomy."

**2:20 — Allocate capital (25s).**
On a top worker's profile → **Governance**: Sentinel recommends *increasing* its budget. Click to
apply. "Reliability isn't cosmetic — it allocates capital. The proven worker earns a bigger budget,
automatically."

**2:45 — Vision close (15s).**
End on the moving graph. "As companies are built from AI workers, someone has to govern them.
Sentinel is the operating system for the AI-native company — built on Solana because that's
already where most of this kind of agent-to-agent payment happens."

## If something fails live
- **x402 settlement errors** (wallet out of funds / env unset) → the guardrail-block and
  agent-to-agent flows need no chain — lead with those and *describe* the on-chain path. Or run
  `pnpm send-usdc <to> <amt>` as a guaranteed real payment.
- **Wallet won't connect** → check Privy **Allowed origins** includes your URL, and that Solana
  is the enabled wallet chain type in the Privy dashboard. (Auth isn't needed for the
  graph/scoring/A2A demo.)
- **Agent chat 500** → AI key missing/rate-limited; switch provider key and reload. Not on the
  critical path — skip it.
- **Fresh browser / empty graph** → the seed repopulates on load; or click *Authorize agent* to
  rebuild the story live.
