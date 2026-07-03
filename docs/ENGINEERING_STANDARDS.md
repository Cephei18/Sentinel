# Engineering Standards

> How we build Sentinel. Practical, enforced-by-review rules — not
> aspirational boilerplate. Cross-references: `CONSTRAINTS.md` (invariants),
> `SECURITY.md` (security rules), `DECISIONS.md` (ADRs).

## Coding standards

- **TypeScript strict**; no `any` except at library boundaries with a comment.
  Domain types live in `lib/agents/types.ts` — extend there, don't redeclare.
- **Purity where it matters:** anything in `lib/agents/` is a pure function of
  its inputs — no `Date.now()`, no randomness, no IO (timestamps and ids come
  from callers/store). If you need impurity, you're in the wrong layer.
- **Layering:** `app → components/hooks → lib`; `lib` never imports up;
  `lib/agents` imports nothing from React/Next. Client components say
  `"use client"`; server-only modules guard against browser use (see
  `serverEnv()` pattern).
- **Naming:** files kebab-case; components PascalCase; hooks `use-*`; event
  kinds snake_case (`payment_success`). Money fields say their unit
  (`amountUsdc`, `perTxLimitUsdc`); bigint base units only at chain edges.
- **Comments** explain *why* and document invariants ("append-only", "server
  agrees with client"), never narrate the next line. Module-header comments
  describing the file's role (current house style) — keep.
- **UI:** variants via cva + `cn`; trust colors/labels only through
  `lib/agents/format.ts` (one visual language for trust everywhere).

## Folder conventions

```
src/lib/agents/     pure domain engine (+ colocated *.test.ts)
src/lib/            chain/env/ai plumbing (framework-free)
src/hooks/          React data access
src/components/     feature folders + ui/ primitives
src/app/            routes only — pages compose components, no business logic
scripts/            self-contained tsx CLIs
docs/ · memory/ · context/   see SYSTEM_OVERVIEW repo map
```
New domain logic goes in `lib/agents/` first, UI second. If a component grows
domain rules (the old guardrail mistake — ADR-011), extract immediately.

## Documentation conventions

- Every ADR-worthy decision → `docs/DECISIONS.md`; working notes →
  `memory/decision-log.md`; assumptions written down, always.
- A PR that changes behavior updates the affected doc in the same PR
  (`CURRENT_STATE.md`, `API_SPEC.md`, etc.). Docs that lie are worse than no
  docs — see the pre-onboarding `ARCHITECTURE.md`.
- Mermaid for diagrams (renders on GitHub, diffable).

## Testing strategy

- **Engine (lib/agents): exhaustive unit tests** — pure functions, no excuse.
  Every scoring factor, every guardrail branch, every governance threshold,
  determinism (same events ⇒ same score) and order-independence where claimed.
  Vitest, colocated `*.test.ts`.
- **API routes:** request-level tests with mocked chain clients (M2, when
  routes hold logic worth testing).
- **E2E:** Playwright smoke of the founder flow in demo mode (hire → block →
  settle → allocate) — the demo never dead-ending is a product requirement;
  add before any refactor of the store (M2).
- **Non-negotiable:** a change to `reputation.ts` / `governance.ts` /
  `authorization.ts` without tests does not merge. Scoring changes include a
  before/after on the seed workforce in the PR description (Atlas/Nova/Probe
  scores are the canary).
- Coverage is a smell-detector, not a goal; the engine at ~100% matters, UI
  percentage doesn't.

## Branch & release strategy

- Trunk-based: short-lived branches `feat/*`, `fix/*`, `docs/*`, `chore/*` off
  `main`; squash-merge; `main` always deployable (Vercel preview per PR).
- Conventional-commit style subjects (`feat: server-side guardrail check`) —
  keeps changelog generation open as an option.
- No long-lived release branches until customers force versioning (M4 SDK
  starts semver at `0.x`).

## Review process

- Every PR reviewed by someone who didn't write it (or, solo-founder mode:
  a self-review pass after a break + the checklists below — and say so).
- **Two-reviewer (or explicit extra-care) surfaces:** wallet/signing code, the
  event log write path, scoring/governance/authorization logic, anything
  touching env/secrets.
- Review checklist: constraints respected (CONSTRAINTS.md)? enforcement
  placement right (server/signing, not UI)? events append-only? money units
  correct? docs updated? tests for engine changes?

## Security checklist (pre-merge, from SECURITY.md)

No new unguarded value path · no secrets client-side or in logs · zod on new
route bodies · unsigned-intent rule for AI tools intact · USDC via
parseUsdc/formatUsdc · deps: no new package without a reason in the PR.

## Architecture review checklist (for M-milestone-sized changes)

Which ADR covers this (or write one) · does it keep decisions deterministic +
replayable · does it preserve per-factor explainability · does it keep the
engine framework-free · migration path for stored events (schema version) ·
kill-switch/override story · what does the demo mode do.

## Definition of done

Code + tests green (`pnpm preflight && pnpm test`) · docs updated · ADR if
load-bearing · demo mode still works (`pnpm dev` with empty env) · no new
KNOWN_LIMITATIONS entry unless deliberately accepted and written down.

## Contributor onboarding (day one)

1. Read `context/sentinel.md` → `docs/SYSTEM_OVERVIEW.md` →
   `docs/CURRENT_STATE.md` → `docs/KNOWN_LIMITATIONS.md` (in that order).
2. `pnpm install && cp .env.example .env.local && pnpm dev` — click through
   the founder flow in demo mode (hire, pause, block, run, delegate, allocate).
3. `pnpm test` — read the engine tests; they're the executable spec.
4. Skim `docs/DECISIONS.md` + `docs/CONSTRAINTS.md` — the things you must not
   accidentally break.
5. First contribution: something from `docs/NEXT_STEPS.md` marked `good-first`.
