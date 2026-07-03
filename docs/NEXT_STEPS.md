# Next Steps

> The prioritized execution queue. Shorter horizon than `ROADMAP.md`
> (milestones) — this is "what to pick up next," kept current. Updated
> 2026-07-03 after the founding-engineer onboarding pass. `good-first` =
> suitable first contribution.

## Decide (blocking decisions before heavy build)

1. **Product name.** "Sentinel" is saturated (Microsoft Sentinel, SentinelOne,
   Sentinel SCA, several OSS agent-governance projects). Decide before any
   public URL/SDK/package name exists. Evidence: `memory/research-notes.md`.
2. **First-customer bet.** Crypto-native agent teams (x402/Base, leads with
   payments) vs governance-first (rail-neutral, leads with policy+audit).
   Current working bet: crypto-native first (see `VISION.md`) — validate with
   3–5 design-partner conversations before M2 hardens the wrong surface.
3. **Trust v2 calibration posture** (from D-016): should new agents start
   Supervised until confidence ≥ medium? Recommended: yes — it matches
   "autonomy is earned." Small code change, big narrative consistency win.

## Build next (M1 remainder → M2 start)

4. **CI** — GitHub Actions: `pnpm typecheck && pnpm lint && pnpm test` on push
   + PR. `good-first`
5. **Playwright smoke of the demo-mode founder flow** (hire → block → settle →
   delegate → allocate) — protects the refactors M2 requires.
6. **M2 spike: Privy server wallets + policy engine** — prove the
   signing-time-backstop pattern (create wallet, attach spend policy, watch an
   out-of-policy signature get refused). Decision input for ADR-006 execution.
7. **M2 spike: `@x402/*` V2 migration** — port `middleware.ts` + `payingFetch`
   on a branch; measure blast radius (V1 packages are deprecated).
8. **Event store schema draft** — Postgres append-only `events` table with
   hash chain + `agents`/`authorizations`; write the migration and the
   provider-seam API contract (`API_SPEC.md` v2 sketch is the start).
9. **Server-side guardrail in `/api/x402/buy`** — even before full state
   migration: require the client to POST the agent id, have the server load
   state (once it exists) and run `checkAuthorization` + auth + rate limit.
   The single highest-leverage security change in the repo.

## Paper cuts (fold into touched code, don't batch)

10. Centralize `RESOURCE` pricing with `/api/premium`/middleware price
    (`lib/constants.ts`). `good-first`
11. Watchlist thresholds in `workforce-rankings.tsx` → import governance
    constants (export `TRUSTED_MIN`). `good-first`
12. Tighten `verify-payment` multi-transfer recipient summing (audit #9).
13. Remove unused deps (`ethers`, raw `openai`/`@anthropic-ai/sdk` — verify
    first) and the Solidity VSCode extension recommendation. `good-first`
14. `package.json` name `"base"` → project name (pending decision #1).

## Continuous

- Keep `memory/decision-log.md` and this file current as work lands.
- Re-verify flagged research items before any external material
  (`memory/research-notes.md` "unverified" lists).
- Design-partner outreach notes → `memory/research-notes.md`.

## Recently completed (2026-07-03 onboarding pass)

Full code read + audit (`KNOWN_LIMITATIONS.md`) · context system
(`context/sentinel.md`, 18 docs, `memory/`) · market + technology research ·
strategy (`VISION.md`) + roadmap · shared guardrail module
(`lib/agents/authorization.ts`, fixes payee/status gaps) · vitest + 39-test
engine suite (caught the Probe miscalibration, D-016) · dead-code removal ·
README/AGENTS.md onboarding surfaces.
