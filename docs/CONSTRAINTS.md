# Constraints

> Non-negotiables that bound every design, feature, and refactor. Derived from
> `context/sentinel.md` (philosophy) plus practical constraints of the stack
> and market. If a proposal violates one of these, the proposal changes — or
> `context/sentinel.md` is deliberately amended first.

## Product philosophy (hard constraints)

1. **Autonomy is earned.** No agent gets un-supervised authority by default;
   tiers unlock from demonstrated behaviour. No feature may grant blanket
   authority as a convenience.
2. **Trust stays explainable.** Every score decomposes into named factors with
   human-readable reasons; every delta attributable to events. No opaque score
   of record, ever. ML advises; it does not decide.
3. **Governance beats automation.** When a check and a convenience conflict,
   the check wins. Blocked-with-reason is a success state.
4. **Deny by default.** Anything outside an explicit grant is blocked.
5. **Humans keep a kill switch and an override path** — at every autonomy tier,
   forever. Progressive autonomy narrows *when* approval is needed, never
   *whether* it's possible.
6. **The event log is append-only.** No mutation, no deletion; corrections are
   new events. Log integrity outranks features.

## Engineering constraints

7. **Deterministic core.** Scoring and policy decisions are pure functions of
   logged inputs — replayable, version-stamped, no wall-clock/randomness inside
   projections (timestamps live in events).
8. **Layering:** `app → components/hooks → lib`; `lib` never imports up;
   `lib/agents` imports no framework code.
9. **Enforcement placement:** any *new* value-moving path must check
   authorization server-side (or at wallet signing). Client-side checks are
   previews. (v1 legacy paths are grandfathered until Roadmap M2 — do not add
   more.)
10. **Simulation is labelled.** Simulated settlements must be visually and
    data-distinguishable (`simulated` flag / label) from real ones. Target
    state: explicit mode, never silent fallback.
11. **USDC amounts** go through `parseUsdc`/`formatUsdc` (6 decimals). Money in
    human units at UI/domain edges, base units at chain edges.
12. **Secrets never reach the client.** `serverEnv()` on the server only;
    NEXT_PUBLIC_* is the entire client surface.
13. **Document decisions.** Anything load-bearing gets an ADR in
    `DECISIONS.md`; assumptions get written down (`memory/`) — never silently
    assumed.

## Stack constraints (current reality)

14. **Next.js 16** — conventions differ from older training data; consult
    `node_modules/next/dist/docs/` before framework-level changes (AGENTS.md).
15. **viem pinned 2.52.2** via pnpm override — duplicate-viem type breakage;
    upgrade deliberately, all-at-once, with typecheck proof.
16. **pnpm** is the package manager (lockfile, vercel.json, docs all assume it).
17. **Wallet-free demo mode must keep working** (providers gate on Privy id) —
    it is the sales demo and the sandbox — until a deliberate decision retires
    it.

## Business constraints (from research, revisit quarterly)

18. **Don't build what the ecosystem provides:** rails (x402/AP2), custody
    (Privy/CDP), frameworks, MCP gateways, seller-side billing.
19. **Rail-neutral ledger.** Nothing in the domain model may assume x402 or
    even crypto settlement — `txHash` is already optional evidence, keep it so.
20. **Name "Sentinel" is presumed temporary** — avoid deep coupling of the name
    into APIs, package names, and storage keys where cheap to avoid (e.g. keep
    `sentinel.store.v1` but don't mint new externally-visible "sentinel-*"
    identifiers casually).
