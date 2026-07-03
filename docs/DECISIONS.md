# Architectural Decision Records

> Numbered, durable decisions. Format: context → decision → consequences.
> Working notes live in `memory/decision-log.md`; entries graduate here when
> they're load-bearing. Never delete an ADR — supersede it.

## ADR-001 · Trust is derived from an immutable event log, never stored
**Context.** A stored score can drift, be edited, or become unexplainable.
**Decision.** Persist only agents + append-only events; recompute trust, spend,
autonomy on read via pure functions (`lib/agents/reputation.ts`).
**Consequences.** Reproducible, auditable, testable scores; O(events) reads —
mitigate later with cached projections that remain derivable; log integrity
becomes the crown jewel (drives ADR-007).

## ADR-002 · Deterministic explainable scoring; ML advisory-only
**Context.** Scores gate money; customers, auditors, and courts ask "why."
Research (2026) confirms explainable trust evaluation as best practice and
shows opaque/open reputation systems failing (ERC-8004 Sybil study).
**Decision.** Score of record = weighted blend of named factors, each with a
plain-language reason; versioned algorithm; same events ⇒ same score. ML may
flag anomalies but never silently changes the score.
**Consequences.** Competitive differentiation vs black-box scores; more manual
calibration work; adversarial-gaming review required for every scorer change.

## ADR-003 · Framework-agnostic engine core with strict layering
**Context.** The engine must outlive the current app shell.
**Decision.** `lib/agents/` has zero React/server imports; dependency direction
`app → components/hooks → lib` enforced by convention.
**Consequences.** Engine can move behind a service boundary unchanged; slight
duplication at the edges (e.g. scripts keep their own constants).

## ADR-004 · Client store behind a swappable provider seam (v1 only)
**Context.** Hackathon needed durable-enough state with zero infra.
**Decision.** `agents-provider.tsx` owns `{agents, events}` in localStorage;
its surface is the contract a future API implements.
**Consequences.** Whole-app demo works offline; enforcement cannot be trusted
until custody moves server-side (ADR-006, Roadmap M2). Sunset: M2.

## ADR-005 · Privy as the single identity/wallet layer
**Context.** Need embedded wallets for non-crypto users, external wallets for
crypto-native, and (later) server wallets with signing-time policy.
**Decision.** Privy + `@privy-io/wagmi` bridge; client-only mount (Privy can't
SSR); no Privy id ⇒ demo mode instead of crash.
**Consequences.** One vendor for auth+wallets; Privy's policy engine becomes
the enforcement backstop in M2; CDP kept as fallback option, not dual-run.

## ADR-006 · Enforcement moves to where value moves (target)
**Context.** v1 guardrails run in the browser; `/api/x402/buy` pays blindly.
For a governance product this is inverted (audit P0-1).
**Decision.** Authoritative decision server-side at the payment/tool boundary,
full decision inputs logged with the verdict; wallet signing-time policies
(Privy) as the non-bypassable backstop; UI checks are previews.
**Consequences.** Requires M2 (server custody). Two-layer enforcement means a
bypassed control plane still can't move out-of-policy value.

## ADR-007 · Event sourcing with tamper evidence as the persistence pattern
**Context.** The log is the audit product; SOC2-for-AI expects tamper-evident,
identity-bound records.
**Decision.** Append-only event store (Postgres suffices), hash-chained from
day one; Merkle batching + EAS-anchored roots on Base when compliance surface
lands (M6). Projections are versioned, deterministic, replay-verified.
**Consequences.** Event schema versioning discipline is mandatory; replaying
old events through new scorers must be defined behavior.

## ADR-008 · One env switch for chain; Base Sepolia default
**Decision.** `NEXT_PUBLIC_CHAIN` drives chain/USDC/explorer/x402 network via
`lib/chains.ts`. **Consequences.** No scattered network conditionals; scripts
duplicate constants deliberately (no alias) — accepted drift risk.

## ADR-009 · Demo mode is a first-class product mode
**Context.** Hackathon demos die on missing wallets/keys/wifi.
**Decision.** No credentials ⇒ full founder flow on seeded state with labelled
simulated settlements.
**Consequences.** Bulletproof demos; several silent success-fallbacks that are
wrong for production — v2 rule: **simulation is an explicit mode, never a
fallback** (audit #12).

## ADR-010 · Value-moving AI tools return unsigned intents
**Decision.** LLM tools may read chain state freely but return calldata for
the *user* to sign; the model never holds keys (`lib/ai/tools.ts`).
**Consequences.** Alignment with the delegated-authority thesis; extra
approval step is a feature.

## ADR-011 · Guardrail logic lives in `lib/agents/authorization.ts` only
**Context (2026-07-03).** Two hand-written component guardrails diverged
(missing payer-status and payee checks in the delegation path).
**Decision.** Single `checkAuthorization()`/`checkDelegation()` in the engine;
components call it; tests pin its behavior. Any new spend path must use it.
**Consequences.** One implementation to move server-side in M2.

## ADR-012 · Adopt x402 V2 (`@x402/*`), Cedar-when-needed, OTel GenAI, EAS
**Context.** 2026-07-03 technology research (`memory/research-notes.md`).
**Decision.** Migrate off deprecated x402 V1 packages in M2; hand-rolled
deterministic policy evaluator with full trace logging until policy count
justifies Cedar; OTel GenAI semconv for traces; EAS on Base for anchoring.
**Consequences.** Version-pinning + adapter layers absorb spec churn (MCP
2026-07-28, `@x402` velocity).
