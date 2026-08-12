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
2026-07-28, `@x402` velocity). **Superseded in part by ADR-013/ADR-015** — the
chain moved to Solana before M2 landed, so the x402 V2 migration happened as
part of that move (`x402-solana`, not `@x402/*`); the EAS-anchoring half of
this decision has no direct Solana equivalent yet (see ADR-013, OBSERVABILITY.md).

## ADR-013 · Migrate from Base/EVM to Solana
**Context (2026-08-12).** The repo owner is personally shifting into the
Solana ecosystem and wants Sentinel as a flagship proof-of-work project and a
Solana Hacker House submission. This is **not** a response to a technical
failure of the Base version — that version won 2nd place at a Base × Privy
hackathon and was working end-to-end.
**Decision.** Port the entire chain-touching surface from Base/EVM to Solana:
`@solana/web3.js` + `@solana/spl-token` replace viem/wagmi/OnchainKit; SPL USDC
(6 decimals, balance on an ATA) replaces the ERC-20; base58 addresses and
transaction signatures replace `0x` hex; "cluster" (`devnet` default /
`mainnet-beta`) replaces "chain" with no runtime chain-switching, same as
before. `src/lib/chains.ts` → `src/lib/solana.ts`, `src/lib/viem.ts` →
`src/lib/connection.ts`, `src/lib/wagmi.ts` and `src/middleware.ts` deleted.
**Consequences.** Full rewrite of every chain-touching route, hook, component,
and script; `src/lib/agents/` (the trust/governance engine) needed **zero**
changes — confirmed by a full import audit and all 39 existing vitest tests
passing unmodified, which validates the ADR-003 layering bet under a real
cross-ecosystem migration, not just a hypothetical one. Branding follows:
`package.json` name → `"sentinel"`, brand color → `#14F195` (Solana green).
Same "no custom on-chain program, rides existing infra" shape as the Base
version — this was a rail swap, not a re-architecture.

## ADR-014 · Keep Privy (reconfigured for Solana) over `@solana/wallet-adapter-react`
**Context.** ADR-005 chose Privy as the single identity/wallet layer for
Base. The Solana migration reopens the wallet-stack question.
**Decision.** Keep Privy, reconfigured for Solana
(`embeddedWallets: { solana: {...} }`, `walletChainType: "solana-only"`),
rather than switching to `@solana/wallet-adapter-react`.
**Consequences.** Preserves the existing login UX (email/social embedded
wallets, external wallet connect) with no user-facing disruption and avoids
running two wallet stacks side by side. `@privy-io/wagmi` is dropped (no EVM
chain left to bridge into) — the wagmi-bridge half of ADR-005 is retired;
Privy itself as the identity layer stands.

## ADR-015 · Port x402 via `x402-solana` (PayAI, protocol v2) rather than drop the payment-rail demo
**Context.** ADR-012 already flagged migrating off deprecated x402 V1
packages. The Solana migration forced a sharper version of that question:
port the payment rail to the new chain, or cut the "agent autonomously pays a
gated API" demo entirely?
**Decision.** Port to `x402-solana` (PayAI Network, protocol v2) — new
`PAYMENT-SIGNATURE`/`PAYMENT-RESPONSE` headers, facilitator
`https://facilitator.payai.network` (serves both devnet and mainnet-beta,
replacing `x402.org/facilitator`). `x402-next`/`x402-fetch`/`x402-axios` are
dropped; `src/middleware.ts` is deleted outright (x402-solana has no Next.js
middleware helper) and the gate is inlined directly in
`src/app/api/premium/route.ts`.
**Consequences.** Completes the V2 migration ADR-012 called for, on the new
chain directly. Rationale for porting rather than cutting: Solana already
carries roughly 65% of x402 transaction volume, and the paid-API-autonomous-
purchase loop is one of the product's five load-bearing ideas
(`context/sentinel.md`) — dropping it would have cut a core demo, not a
peripheral one.

## ADR-016 · Collapse RPC env vars from two pairs to one
**Context.** The Base-era config carried mainnet/testnet × client/server RPC
var pairs alongside `NEXT_PUBLIC_CHAIN` switching (ADR-008).
**Decision.** Since Solana has no runtime chain-switching, collapse to one
pair: `SOLANA_RPC_URL` (server) / `NEXT_PUBLIC_SOLANA_RPC_URL` (client), with
`NEXT_PUBLIC_SOLANA_CLUSTER` selecting devnet vs mainnet-beta.
**Consequences.** Simpler `.env.example` and `check-env.ts`; one fewer axis of
drift risk than the four-var Base setup. Supersedes the chain-var mechanics of
ADR-008 (the "one env switch" principle survives; the specific vars don't).
