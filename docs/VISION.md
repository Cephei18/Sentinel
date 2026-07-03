# Vision & Startup Strategy

> From hackathon MVP to company. Grounded in the 2026-07-03 market/technology
> research (`memory/research-notes.md`). Defers to `context/sentinel.md` on
> philosophy; this doc is the *business* strategy. Working hypotheses —
> marked ⚠ where evidence is thin — to be revised as customers teach us.

## The one-line company

**Sentinel is the control plane that lets organizations give AI agents real
authority safely — scoped mandates, pre-action enforcement, and explainable,
earned autonomy.**

## Why now (evidence, not vibes)

1. **The workforce exists and is monetizing** — Agentforce >$500M ARR, Devin at
   $25B valuation — but *no AI-workforce platform ships per-agent financial
   authority*. Employers hand agents keys and hope.
2. **The governance gap is measured**: 74% of orgs plan agentic AI, 21% have
   mature agent governance, 35% couldn't immediately stop a rogue agent
   (Deloitte); most orgs can monitor agents but **cannot stop them** (Kiteworks).
   Gartner predicts >40% of agentic projects die by 2027, citing risk controls.
3. **The rails just standardized without a control plane**: x402 under the
   Linux Foundation, Google AP2 at FIDO, Visa/Mastercard tokenized agent
   consent — value moves and delegation gets proven, but **no rail provides
   persistent budgets, category scope, behavioral trust, or graduated
   autonomy across a workforce.** That layer is unowned.
4. **The exit/funding comps validate the category**: Natoma (pre-action policy
   checks for agents) acquired by Snowflake ~1 year after seed; Catena Labs
   raised $48M for adjacent agent-finance governance.

## Answers to the founding questions

### What is the first product?
**The agent spend firewall + trust ledger** (hosted): give each agent a scoped
mandate (budget, per-tx, expiry, categories), enforce it server-side before
value moves, log everything append-only, and compute explainable trust that
gates autonomy. One SDK call wraps an agent's payments/tool spend; one
dashboard shows the CFO/founder the whole workforce. This is the hackathon
demo made real (enforcement server-side, state durable, tenancy added) — not a
pivot.

### Who is the first customer?
⚠ **Agent-native startups already spending money through agents** — teams
building on x402/CDP/Privy on Base, agent-marketplace and agent-employee
companies, and Claude-/GPT-agent shops whose token+API spend is exploding
(Ramp: 13× growth, budgets blown in months). They feel the pain weekly, buy
bottom-up, and tolerate crypto rails. Enterprises standardizing on Entra/Okta
come later, via the fiat/virtual-card rail abstraction — do not lead with them.

### What is the smallest valuable wedge?
Scoped mandates + pre-action blocking + audit log for **one rail (x402/USDC on
Base)**, with Privy signing-time policies as the hard backstop. Deliberately
small: it's the part nobody else productizes end-to-end, and every piece of it
already exists in this repo as a demo.

### What creates recurring revenue?
- SaaS per governed agent/seat + per-decision metering (policy checks are the
  billable event, like auth providers bill MAUs).
- Tiered: free (few agents, community) → team → enterprise (SSO, SOC2
  exports, approval workflows, retention).
- Later: premium trust intelligence (anomaly advisories, benchmark scores) and
  compliance evidence packs.

### What generates proprietary data?
The **cross-tenant corpus of agent behavioral history** — attempts, blocks,
settlements, task outcomes, per-model/per-framework reliability. Nobody else
sits at the decision point that captures both *intent* (attempts, blocks) and
*outcome* (settlement, delivery). This is the FICO-for-agents dataset.

### What becomes the long-term moat?
1. **The behavioral corpus** above (network effects: scores improve with every
   tenant; portable reputation makes leaving costly for *agents*, not just
   employers).
2. **System-of-record gravity**: once Sentinel's log is a company's audit
   evidence (SOC2/insurance), ripping it out is painful.
3. **Ecosystem position**: the neutral trust layer that rails (x402, AP2),
   wallets (Privy, CDP), insurers (AIUC), and marketplaces route through —
   we don't compete with any of them.
4. *Not* a moat: budget caps (Coinbase ships them), explainable scoring
   mechanics (replicable). Speed + corpus + placement are the moat.

### How does today's MVP evolve into the platform?
`ROADMAP.md` sequences it: M1 harden foundations → M2 real control plane
(server enforcement, Postgres event store, Privy backstop, x402 V2) → M3
tenancy + dashboard → M4 SDK/API as the product → M5 trust engine v2 →
M6 audit/compliance surface → M7 policy engine beyond spend → M8 multi-rail →
M9 portable reputation + marketplace. The engine and event-sourced shape never
change; custody, enforcement placement, and surface area do.

## Positioning sentence

*For teams deploying AI agents that spend money and take consequential
actions, Sentinel is the governance control plane that enforces scoped
authority before value moves and turns behavior into explainable, earned
autonomy — unlike observability tools that only watch, wallets that only cap,
and compliance suites that only document.*

## Strategic risks & stances (from research)

| Risk | Stance |
|---|---|
| **Coinbase absorbs the wedge** (native caps/KYT) | Sit above wallets, not beside them: integrate CDP *and* Privy; differentiate on trust, tiers, cross-rail audit. Caps are a feature; governance is a product. |
| **Catena's regulatory moat** | Don't compete on regulation. Developer-first, self-serve, rail-agnostic; partner with regulated custody when enterprises demand it. |
| **x402 volume slump** (−92% from speculative peak) | Multi-rail abstraction by M8 (AP2 mandates, virtual cards). x402 is the beachhead, not the bet. |
| **"Sentinel" name collision** (Microsoft Sentinel, SentinelOne, Sentinel SCA…) | Rename before public launch. Track candidates in `memory/project-memory.md`. |
| **Score liability & gaming** | Scores advise and gate *within customer-set policy*; humans own overrides. Adversarial design review is part of Trust v2 (see `TRUST_MODEL.md`). |
| **Enterprise procurement mismatch** (crypto rails read exotic) | Lead crypto-native; keep the ledger/policy layer rail-neutral so the fiat story is an adapter, not a rewrite. |

## What we refuse to build (focus)

Agent frameworks · payment rails · wallet custody · MCP gateway plumbing ·
opaque ML scores of record · seller-side billing (Nevermined et al.). Each is
either someone's funded business or a violation of `context/sentinel.md`
principles.
