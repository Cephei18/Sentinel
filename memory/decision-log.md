# Decision Log

> Running log of significant decisions — newest first. Each entry: date, decision,
> why, consequences. Promote long-lived architectural decisions into
> `docs/DECISIONS.md` as numbered ADRs; this file is the working notebook.

## 2026-07-03 — Founding-engineer onboarding pass (this repo transformation)

- **D-016 · Seed strengthened so Probe stays Supervised.** Test canary caught
  that "reckless" Probe scored ~72 (Trusted, cleared to delegate) — discipline/
  reliability penalties are milder than the demo narrative. Minimal fix: one
  more seeded failed payment (score → ~64, Supervised, on the watchlist).
  **Carry-forward for Trust v2:** at 50% payment reliability + 2 guardrail
  blocks the scorer still cleared delegation — penalty curves need a
  calibration pass against intended personas (tracked in TRUST_MODEL v2 list).

- **D-013 · `context/sentinel.md` created as the canonical source of truth.**
  It did not exist despite being referenced as such; all strategy/architecture
  docs now defer to it. Amend it deliberately, never casually.
- **D-014 · Docs system layout.** `docs/` = durable engineering/product docs;
  `memory/` = working notes (this log, project memory, research notes);
  `context/` = the single source-of-truth statement. Rationale: separate "what a
  new engineer must trust" from "what the team is currently thinking."
- **D-015 · Enforcement relocation declared the #1 technical priority.** The
  guardrail runs client-side (`agent-run-action.tsx`) while `/api/x402/buy`
  spends unconditionally. For a governance product this inversion is
  existential, not cosmetic. Target: server-side authorization at the payment
  boundary. (See KNOWN_LIMITATIONS #1, ROADMAP M1.)

## Reconstructed from the hackathon codebase (decisions inherited, 2026-06)

- **D-001 · Trust is derived, never stored.** Recomputed from the immutable
  event log on every read (`reputation.ts`). Consequence: reproducible/auditable
  scores; cost: O(events) per read — acceptable now, needs snapshotting at scale.
- **D-002 · Deterministic linear-blend scorer with per-factor explanations**
  over any ML/opaque approach. Consequence: every point attributable; ML later
  only as advisory input.
- **D-003 · Client-side store behind a provider seam.** `agents-provider.tsx`
  exposes `agents/events/createAgent/recordEvent/payAgent/setBudget` so
  localStorage can be swapped for API+Postgres without touching UI or engine.
  Deliberate hackathon scope cut with a named escape hatch.
- **D-004 · lib never imports up** (`app → components/hooks → lib`). Keeps the
  engine portable to a future backend service.
- **D-005 · x402 both sides in one app.** Seller: `middleware.ts` gates
  `/api/premium` with 402. Buyer: server agent wallet pays via `payingFetch`.
  Chosen to demo the full loop without external services.
- **D-006 · Privy as the single identity/wallet layer**, bridged into wagmi via
  `@privy-io/wagmi`; embedded wallet on email/social login. Client-only mount
  (Privy throws during SSR).
- **D-007 · One env switch for chain** (`NEXT_PUBLIC_CHAIN`) drives chain, USDC
  address, explorer, x402 network (`chains.ts`).
- **D-008 · Demo-mode resilience over hard failures.** No Privy id → full app in
  demo mode; failed real payment → clearly-labelled simulated settlement. The
  demo never dead-ends. Consequence: several "always succeed" paths that must be
  removed for production (see KNOWN_LIMITATIONS).
- **D-009 · Seeded workforce built from a passed `nowMs`** (never `Date.now()`
  at module scope) so SSR/client agree and timestamps look fresh.
- **D-010 · viem pinned via pnpm override (2.52.2)** to avoid duplicate-viem
  type errors across wagmi/x402/privy dependency graphs.
- **D-011 · Value-moving AI tools return unsigned intents** (`lib/ai/tools.ts`);
  the model never holds user keys; the user signs in their wallet.
- **D-012 · New-agent trust baseline = 72 (grade BBB, Trusted tier, low
  confidence).** Cautious-but-not-hostile cold start; agents earn movement both
  ways. Note: baseline landing *inside* the Trusted band means brand-new agents
  may delegate — revisit in Trust v2 (arguably new agents should start
  Supervised until confidence ≥ medium).
