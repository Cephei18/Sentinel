<div align="center">

<br />

# ◈ Sentinel

### The operating system for AI-native companies.

**Hire autonomous AI workers, allocate budgets, govern their spending, and let an explainable trust score decide who earns more autonomy.**

<br />

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Base](https://img.shields.io/badge/Base-USDC-0052FF?logo=coinbase&logoColor=white)](https://base.org)
[![Privy](https://img.shields.io/badge/Privy-Embedded_Wallets-6A4DFF)](https://privy.io)
[![x402](https://img.shields.io/badge/x402-Autonomous_Payments-16C784)](https://github.com/coinbase/x402)
[![Status](https://img.shields.io/badge/build-passing-16C784)](#run-it)

<sub>Next.js 16 · React 19 · Tailwind v4 · Framer Motion · Vercel AI SDK v6 · wagmi/viem 2</sub>

<br />

[**The thesis**](#-the-thesis) · [**90-second demo**](#-a-founder-managing-an-ai-company-in-90-seconds) · [**Sponsor tech**](#-how-the-sponsor-tech-is-used) · [**Trust engine**](#-trust-scoring-methodology) · [**Architecture**](#-architecture) · [**Run it**](#-run-it)

</div>

---

## ◆ The thesis

The next company won't be built only from humans, departments, and contractors. Founders will assemble a workforce of **autonomous AI workers** — a research agent, a growth agent, a procurement agent — that spend money, buy APIs, hire each other, and coordinate on their own.

With **x402** and stablecoins, that already works: an agent can pay for a service, or another agent's work, autonomously — settled in USDC on Base in seconds. Which opens the question no infrastructure answers today:

> ### How does a founder *manage, trust, govern, and allocate capital* to a workforce of autonomous AI workers?

Right now you hand an agent a key and hope. **Sentinel is the operating system for that workforce:**

| | | |
|---|---|---|
| 🪪 **Hire & authorize** | Bring on a worker with *scoped* financial authority — budget, per-tx ceiling, expiry, categories | not a blank cheque |
| 🛡️ **Govern** | Every payment is checked against that scope *before* value moves | over-limit / off-category / expired / paused → **blocked** |
| 📊 **Score** | Behaviour becomes an explainable, deterministic trust score | reliability · discipline · completion · consistency |
| 💰 **Allocate by trust** | Trust gates an **autonomy tier** and drives **budget recommendations** | capital flows to who earns it |
| 🌐 **Observe** | The **organization graph** shows the company in motion | who's paying whom, whose reliability is moving |

<div align="center"><br /><b>Stripe + Rippling + GitHub — for AI agents.</b><br />The layer that turns a pile of autonomous agents into a governable company.<br /><br /></div>

---

## ◆ A founder managing an AI company, in 90 seconds

| # | Step | What happens | Where |
|---|---|---|---|
| 1 | **Hire** | Bring on an AI worker with a scoped budget (budget · per-tx · expiry · categories) | `/dashboard` → *Hire AI worker* |
| 2 | **Govern** | Pause a worker, let it attempt a purchase → **blocked by guardrail**, reliability dips, logged | `/agents/[id]` |
| 3 | **Settle** | Resume, run it → an **x402 USDC payment** settles on Base, trust rises live | `/agents/[id]` |
| 4 | **Delegate** | A trusted worker hires another (trust-aware) → a payment edge animates, both reputations evolve | `/graph` |
| 5 | **Allocate** | Sentinel recommends scaling the reliable worker's budget — apply it in one click | `/agents/[id]` → *Governance* |

Every trust change surfaces as an explainable delta — `Trust +3 · Successful x402 settlement` · `Trust −4 · Authorization guardrail` — as a live toast **and** a permanent line in the operations log. A worker's trust sets its **autonomy tier** — `Supervised → Trusted → Autonomous` — and only sufficiently reliable workers may delegate to others.

> 🔒 **Bulletproof demo.** The whole founder flow — graph, hire, govern, block, delegate, allocate — runs on **seeded client state with no wallet, key, or internet**. The on-chain x402 settlement is real when a funded wallet is configured, and falls back to a clearly-labelled simulation otherwise. The demo never dead-ends.

---

## ◆ How the sponsor tech is used

<table>
<tr><td width="33%" valign="top">

### 🔐 Privy
**Delegated authority + embedded wallets.**

Single identity/wallet layer ([providers.tsx](src/components/providers.tsx)). Email/social login mints an embedded wallet that bridges into wagmi. The user delegates *scoped* spend authority to a worker rather than sharing keys — value-moving AI tools return **unsigned intents** ([tools.ts](src/lib/ai/tools.ts)).

</td><td width="33%" valign="top">

### ⚡ x402
**Autonomous, HTTP-native payments — both sides.**

*Seller:* [middleware.ts](src/middleware.ts) gates [/api/premium](src/app/api/premium/route.ts) with HTTP `402`.
*Buyer:* [`payingFetch`](src/lib/x402.ts) signs a USDC authorization on a `402` and retries; [/api/x402/buy](src/app/api/x402/buy/route.ts) is the agent paying for a service **by itself**, gated by its own authorization.

</td><td width="33%" valign="top">

### 🔵 Base + USDC
**The settlement layer.**

One switch — `NEXT_PUBLIC_CHAIN` — drives the active chain, USDC address, explorer, and x402 network across the app ([chains.ts](src/lib/chains.ts)). Defaults to Base Sepolia; flip to Base mainnet in one line.

</td></tr>
</table>

---

## ◆ Trust scoring methodology

Trust is **deterministic, explainable, and event-derived** — never a stored mutable number. It's recomputed purely from an agent's immutable event log ([reputation.ts](src/lib/agents/reputation.ts)), so it's always reproducible and auditable.

A weighted blend of four normalised factors:

| Factor | Weight | What it measures |
|---|:---:|---|
| **Payment reliability** | `40%` | Share of payment attempts that settled successfully on-chain |
| **Spending discipline** | `25%` | Stays within budget + per-tx limits; guardrail violations erode it |
| **Task completion** | `20%` | Work delivered relative to payments made |
| **Consistency** | `15%` | Confidence from a longer clean track record |

Each factor carries a plain-language reason, and the score reports a **confidence level** (low/medium/high) from sample size — a perfect record over 2 events ≠ over 50. New workers start from a cautious baseline and *earn* their rating.

**Trust → autonomy & capital** ([governance.ts](src/lib/agents/governance.ts)) — score isn't a vanity metric, it has economic consequence:

- **Autonomy tier** — `Supervised → Trusted → Autonomous`. Supervised workers *cannot* delegate; trust must be earned first.
- **Budget recommendation** — reliable workers are recommended for *more* capital, unreliable ones for *less*. The founder applies it in one click.

> This is the seam where a production system plugs in on-chain attestations, counterparty ratings, and anomaly models — the shape stays the same.

---

## ◆ Architecture

```
app/
  page.tsx              ▸ landing — "enter the network"
  dashboard/            ▸ Operations: roster, live stats, workforce intelligence
  graph/                ▸ Organization graph + agent-to-agent delegation
  agents/[id]/          ▸ worker profile: trust ring, breakdown, governance, run
  api/                  ▸ agent (AI) · premium (x402 seller) · x402/buy (buyer) · verify-payment
  middleware.ts         ▸ x402 payment gate

lib/agents/             ▸ the brain — framework-agnostic, pure, testable
  types.ts                Agent · Authorization · AgentEvent
  reputation.ts           deterministic trust engine + delta projection
  governance.ts           autonomy tiers + budget recommendations
  seed.ts · format.ts     demo workforce · presentation helpers

components/agents/      ▸ trust UI: graph, score ring, breakdown, roster,
                          governance, delegation, activity feed, rankings
  agents-provider.tsx     client store (system of record) + derived trust
components/demo-mode.tsx  ▸ wallet-free demo resilience
```

**Derived, not stored.** The store ([agents-provider.tsx](src/components/agents/agents-provider.tsx)) holds only agents + the event log; trust, spend, and autonomy are *derived* on read. Its surface (`agents`, `events`, `createAgent`, `recordEvent`, `payAgent`, `setBudget`) is the deliberate seam to swap localStorage for an API + Postgres **without touching the UI or the engine**.

```
app  →  components / hooks  →  lib        (lib never imports up — the core is portable)
```

---

## ◆ Run it

```bash
pnpm install
cp .env.example .env.local            # PowerShell: Copy-Item .env.example .env.local
pnpm dev                              # ▸ http://localhost:3000
```

That's it — **Sentinel boots straight into demo mode** with a seeded workforce and the full founder flow, no credentials required. To light up real wallets + on-chain settlement, add the env below and:

```bash
pnpm wallet:new       # mint a server agent wallet → paste AGENT_PRIVATE_KEY
pnpm check-env        # verify wiring
pnpm preflight        # typecheck + lint + env check (run before demoing)
```

### Environment

| Variable | Scope | Required | Purpose |
|---|:---:|:---:|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | client | for wallets¹ | Privy app id — [dashboard.privy.io](https://dashboard.privy.io) |
| `NEXT_PUBLIC_CHAIN` | client | – | `base-sepolia` (default) or `base` |
| `OPENAI_API_KEY` *or* `ANTHROPIC_API_KEY` | server | for AI agent | powers the tool-calling commerce agent |
| `AGENT_PRIVATE_KEY` | server | for real x402 | server agent wallet (`0x…`, 32-byte hex) — `pnpm wallet:new` |
| `X402_PAY_TO_ADDRESS` | server | for real x402 | wallet that receives x402 payments — activates the gate |
| `BASE_RPC_URL` · `BASE_SEPOLIA_RPC_URL` | server | – | dedicated RPCs (defaults to public) |
| `NEXT_PUBLIC_ONCHAINKIT_API_KEY` · `X402_FACILITATOR_URL` | mixed | – | optional integrations |

<sub>¹ Without a Privy app id the app runs in **demo mode** — the entire workforce experience works; only wallet/on-chain widgets show placeholders.</sub>

Fund the agent wallet on testnet: [ETH faucet](https://portal.cdp.coinbase.com/products/faucet) · [USDC faucet](https://faucet.circle.com).

```bash
pnpm build            # production build
pnpm balance [addr]   # ETH + USDC balance
pnpm send-usdc <to> <amt>   # CLI USDC transfer (guaranteed-working backup payment)
```

---

## ◆ Where this goes

- **Reputation as a primitive** — portable on-chain attestations so a worker's trust travels across platforms.
- **Risk & anomaly detection** — spending-pattern analysis, trust decay, approval escalation on outliers.
- **Agent marketplaces** — trust-aware discovery and routing: hire the most *reliable* provider, not the cheapest.
- **Reputation staking** — workers post collateral against their score; misbehaviour is slashable.

<div align="center"><br /><i>A believable glimpse of the financial infrastructure layer for the autonomous agent economy.</i><br /><br /></div>

---

## ◆ Docs

[Architecture](docs/ARCHITECTURE.md) · [Demo flow](docs/DEMO_FLOW.md) · [Pitch deck](docs/SLIDES.md) · [Quickstart](docs/QUICKSTART.md) · [Common errors](docs/COMMON_ERRORS.md) · [Cheatsheet](docs/CHEATSHEET.md)

<div align="center"><sub>Built for the Base × Privy × x402 hackathon.</sub></div>
