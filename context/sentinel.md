# Sentinel — Source of Truth

> This file is the canonical statement of what Sentinel is, why it exists, and the
> principles every technical and product decision must serve. If any other document
> contradicts this one, this one wins — or this one gets deliberately amended.
>
> Last substantive revision: 2026-07-03.

## One sentence

**Sentinel lets organizations give autonomous AI agents real financial authority that grows only as fast as the agent proves it deserves it.**

Scoped authorization, pre-flight guardrails, and an append-only event log are
the foundation this rests on — necessary, and rapidly becoming table stakes
across the agent-governance market. The reason Sentinel exists is what sits on
top of that foundation: a deterministic, explainable trust score that turns
demonstrated behavior into earned autonomy and earned capital, never granted
upfront. See `docs/VISION.md` for the full positioning rationale and
`memory/decision-log.md` (2026-08-18 entry) for how this wording was chosen.

## The problem

Companies are beginning to operate fleets of autonomous AI agents that spend money,
call paid APIs, hire other agents, and act with real economic consequence. Payment
rails for this already exist (x402 + USDC on Solana settles machine-to-machine payments
in seconds). What does **not** exist is the management layer a responsible operator
needs before handing an agent financial authority:

- **Scoped authority** instead of a shared key: budget, per-transaction ceiling,
  expiry, spend categories.
- **Pre-flight governance**: every action checked against that scope *before* value
  moves — over-limit, off-category, expired, or paused ⇒ blocked.
- **Earned autonomy**: an explainable, deterministic trust score computed from an
  immutable event log, gating how much an agent may do without a human in the loop.
- **Capital allocation**: trust drives budget recommendations; capital flows to
  agents that demonstrate reliability.
- **Observability**: a live view of the org — who pays whom, whose reliability is
  moving, every decision auditable after the fact.

Today an operator hands an agent an API key and hopes. Sentinel replaces hope with
governance. Shorthand: **Stripe + Rippling + GitHub, for AI agents.**

## What the vision is NOT

- Not "build a better AI agent." Sentinel is the layer *around* agents, agnostic to
  which framework or model powers them.
- Not a wallet or a payment rail. Sentinel governs and audits payments made over
  rails it does not own (x402 today; others as they mature).
- Not an autonomous-org toy. The customer is a human organization that must answer
  for what its agents do — to its CFO, its auditors, its regulators.

## Core philosophy (constraints on every future decision)

1. **Autonomy is earned through demonstrated behaviour.** New agents start
   supervised; tiers unlock as the record justifies them. Never grant autonomy by
   default.
2. **Trust must remain explainable.** Every point of a trust score is attributable
   to a named factor with a plain-language reason. Deterministic recompute from the
   event log — never a stored mutable number, never an opaque ML score at the core.
   (Models may *advise* — e.g. anomaly flags — but the score of record stays
   deterministic and reproducible.)
3. **Governance is more important than automation.** When governance and
   convenience conflict, governance wins. A blocked action with a clear reason is a
   feature, not a failure.
4. **Enforcement must sit where value moves.** A check that can be bypassed by
   skipping the UI is theatre. The authorization decision belongs server-side / at
   the payment boundary. (The hackathon MVP violates this — known, documented, and
   the first thing the production architecture fixes.)
5. **The event log is the product.** Immutable, append-only history of every
   attempt, block, settlement, and delegation. Trust, spend, autonomy, and audit
   evidence are all *derived* from it. Protect its integrity above all else.
6. **Deterministic over opaque.** Same inputs ⇒ same outputs, replayable, testable.

## The wedge → platform path (working hypothesis)

1. **Wedge (now):** spend governance + explainable trust for teams running paying
   agents — scoped authorizations, pre-flight blocks, audit log, trust-gated
   autonomy. Smallest thing a customer will pay for: "let my agents spend without
   me losing sleep."
2. **Expansion:** policy engine (beyond spend: tools, data, actions), enterprise
   dashboard, SOC2-grade audit exports, integrations (MCP gateways, agent
   frameworks, CI systems).
3. **Platform:** hosted control plane + SDK + API; progressive autonomy as a
   managed service; portable reputation (attestations) so an agent's record travels;
   trust-aware agent marketplace routing.
4. **Moat:** proprietary corpus of agent behavioural history + the trust models
   derived from it; being the system of record for "what did our agents do and why
   was it allowed."

(Validated/challenged in `docs/RESEARCH → memory/research-notes.md` and
`docs/ROADMAP.md`; revise here when evidence demands.)

## Current implementation status

The repository contains the hackathon MVP (Solana × Privy × x402 hackathon): a
Next.js 16 app demonstrating the full founder loop — hire → govern → block →
settle → delegate → allocate — on seeded client-side state, with a real x402/USDC
settlement path when a funded wallet is configured. The trust engine
(`src/lib/agents/`) is pure, deterministic, and framework-agnostic by design; the
store is localStorage behind a swappable provider seam. See
`docs/CURRENT_STATE.md` for the honest gap list between demo and product.

## Canonical vocabulary

| Term | Meaning |
|---|---|
| **Agent / Worker** | An autonomous AI process granted scoped financial authority |
| **Authorization** | The scope grant: budget, per-tx limit, expiry, categories |
| **Event** | Immutable record of an agent action (payment, block, task, grant) |
| **Trust score** | Deterministic 0–100 blend of reliability, discipline, completion, consistency — with confidence |
| **Autonomy tier** | Supervised → Trusted → Autonomous; gates delegation rights |
| **Guardrail** | Pre-flight check of an action against the authorization |
| **Delegation** | A sufficiently-trusted agent hiring/paying another agent |

## Where everything else lives

- Architecture (current + target): `docs/ARCHITECTURE.md`, `docs/SYSTEM_OVERVIEW.md`
- Honest current state & gaps: `docs/CURRENT_STATE.md`, `docs/KNOWN_LIMITATIONS.md`
- Trust & governance models in depth: `docs/TRUST_MODEL.md`, `docs/GOVERNANCE_MODEL.md`
- Domain model: `docs/DOMAIN_MODEL.md` · Data flow: `docs/DATA_FLOW.md`
- Strategy & market: `docs/VISION.md`, `memory/research-notes.md`
- Plan: `docs/ROADMAP.md`, `docs/NEXT_STEPS.md`
- Decisions: `docs/DECISIONS.md` (log), `memory/decision-log.md` (running notes)
- Standards: `docs/ENGINEERING_STANDARDS.md`, `docs/SECURITY.md`
