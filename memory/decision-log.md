# Decision Log

> Running log of significant decisions — newest first. Each entry: date, decision,
> why, consequences. Promote long-lived architectural decisions into
> `docs/DECISIONS.md` as numbered ADRs; this file is the working notebook.

## 2026-08-18 — Positioning reframe: "earned authority" over "trust & governance infrastructure"

- **D-021 · Reworded the canonical one-sentence definition** in
  `context/sentinel.md` (and its echo in `AGENTS.md`) from "the trust and
  governance infrastructure for autonomous AI workforces" to an
  earned-authority framing: agents start scoped and supervised, and
  demonstrated behavior — not a default grant — is what expands autonomy and
  capital. **Why:** a competitor scan (AlterAuth, Agentic Fabriq, Multifactor,
  Golf.dev, OneCLI) showed scoped credentials + pre-flight policy check +
  audit log are now near-identical table-stakes language across a *second*,
  unrelated wave of funded companies (credential/IAM-for-agents), independent
  of the payment-rail competitors already tracked in `memory/research-notes.md`.
  The repo's own `docs/VISION.md` and `research-notes.md` had already reached
  this conclusion ("budget caps... explainable scoring mechanics —
  replicable... moat forms only from accumulated cross-employer behavioral
  history") but it hadn't propagated into the canonical one-liner, which is
  what `AGENTS.md`/`CLAUDE.md` and every onboarding path actually surface.
  **Consequence:** the trust → autonomy tier → capital allocation loop is now
  named explicitly as the reason Sentinel exists, with scoped auth/guardrails/
  audit log explicitly demoted to "foundation, increasingly table stakes" in
  the same sentence — not overclaimed as a moat, since the scoring mechanism
  itself is still replicable and the real moat (accumulated cross-tenant
  corpus) is unearned until there's real customer volume behind it.
- **D-022 · Landing page + pitch deck copy updated to match.** Hero line
  changed from "Give AI agents money. Keep the keys." to "Give AI agents
  money. Let them earn more." (`src/app/page.tsx`); `docs/SLIDES.md` title
  slide updated from "The operating system for AI-native companies" (a third,
  unreconciled positioning variant) to the same hero line, so the deck and the
  live product open on one sentence, not three. Added a one-line "foundation"
  caption to the landing page's control-plane section so the enforcement
  visual doesn't stand alone as the lead idea ahead of the trust/earned-
  autonomy loop. **Not changed:** the guardrail-block hero visual itself, and
  full section reordering — flagged as a larger, lower-priority follow-up, not
  bundled into this pass.
- **Also updated (accuracy, not positioning):** `docs/CURRENT_STATE.md` and
  `docs/KNOWN_LIMITATIONS.md` were stale relative to code — a hosted
  `/api/v1` API (`src/lib/db/`, `src/app/api/v1/agents/**`) already implements
  real server-side `checkAuthorization()` calls and hash-chained events
  (`computeEventHash`/`prevHash`) against Postgres, ahead of what those docs
  described. Documented as a *parallel* surface: `/api/x402/buy`, the one live
  demo payment path, still doesn't call it, so the P0 enforcement-placement
  gap is unchanged in the one path a visitor can actually exercise.
  `memory/research-notes.md` gained a subsection on the credential/IAM
  competitive flank above.
- **Deliberately not touched:** `docs/TRUST_MODEL.md` weights/thresholds, the
  new-agent baseline (72, lands in Trusted band — a known contradiction with
  "autonomy is earned by default," tracked since D-016), and the "Sentinel"
  name — all depend on customer validation or a separate rename decision, not
  on this positioning pass.

## 2026-08-12 — Base/EVM → Solana migration

- **D-017 · Migrate from Base/EVM to Solana.** Not a technical failure of the
  Base version (it won 2nd place at a Base × Privy hackathon). Driver: repo
  owner is personally shifting into the Solana ecosystem and wants Sentinel as
  a flagship proof-of-work project + a Solana Hacker House submission.
  `viem`/`wagmi`/OnchainKit → `@solana/web3.js` + `@solana/spl-token`; hex
  addresses/hashes → base58; "chain" → "cluster" (devnet default,
  mainnet-beta prod), still no runtime switching. `lib/chains.ts` →
  `lib/solana.ts`, `lib/viem.ts` → `lib/connection.ts`, `wagmi.ts` +
  `middleware.ts` deleted. **`lib/agents/` needed zero changes** — full import
  audit + all 39 vitest tests pass unmodified, which is the real validation of
  the D-004/ADR-003 layering bet. Promoted to ADR-013.
- **D-018 · Kept Privy over `@solana/wallet-adapter-react`.** Reconfigured for
  Solana (`embeddedWallets.solana`, `walletChainType: "solana-only"`) instead
  of standing up a second wallet stack. Preserves the existing login UX;
  `@privy-io/wagmi` dropped (nothing left to bridge). Privy-as-identity-layer
  (D-006) stands; the wagmi-bridge detail of it doesn't. Promoted to ADR-014.
- **D-019 · Ported x402 via `x402-solana` (PayAI, protocol v2) rather than cut
  the payment-rail demo.** New `PAYMENT-SIGNATURE`/`PAYMENT-RESPONSE` headers;
  facilitator `facilitator.payai.network` (devnet + mainnet-beta, replaces
  `x402.org/facilitator`). `middleware.ts` deleted outright — x402-solana has
  no Next.js middleware helper — gate now lives inline in
  `/api/premium/route.ts`. Why port instead of cut: Solana already carries
  ~65% of x402 volume, and "agent autonomously pays a gated API" is one of the
  five load-bearing product ideas, not a peripheral demo. Also completes the
  x402-V1→V2 migration D-005/ADR-012 flagged. Promoted to ADR-015.
- **D-020 · Collapsed RPC env vars from two pairs to one.** Base-era config had
  mainnet/testnet × client/server RPC vars (4). Solana has no runtime
  chain-switching, so it's now just `SOLANA_RPC_URL` /
  `NEXT_PUBLIC_SOLANA_RPC_URL`, picked by `NEXT_PUBLIC_SOLANA_CLUSTER`.
  Promoted to ADR-016.

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
