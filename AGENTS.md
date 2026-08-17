<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: Sentinel

Sentinel lets organizations give autonomous AI agents real financial
authority that grows only as fast as the agent proves it deserves it. Scoped
authorization + guardrails + an audit log are the foundation (increasingly
table stakes market-wide); the trust → earned autonomy → capital allocation
loop is the reason the company exists. Source of truth: `context/sentinel.md`.
Onboard via `docs/SYSTEM_OVERVIEW.md` → `docs/CURRENT_STATE.md` →
`docs/KNOWN_LIMITATIONS.md`; standards in `docs/ENGINEERING_STANDARDS.md`.

## Rules for working in this repo

- **Constraints are binding:** read `docs/CONSTRAINTS.md`. Highlights: the
  event log is append-only; trust is derived, never stored; scoring/policy
  code must stay pure + deterministic (`src/lib/agents/` imports no framework
  code, no `Date.now()` inside — time is passed in).
- **Guardrails have ONE implementation:** `src/lib/agents/authorization.ts`.
  Never hand-write scope checks in components or routes. Any *new*
  value-moving path needs a server-side (or signing-time) check — client
  checks are previews.
- **Engine changes require tests** (`src/lib/agents/*.test.ts`, `pnpm test`).
  The seed workforce (Atlas/Nova/Probe) is the scoring canary — if their
  ordering or tiers change, the demo story broke.
- **Money:** all USDC amounts via `parseUsdc`/`formatUsdc` (6 decimals).
  Secrets only via `serverEnv()`. AI tools return unsigned intents — the model
  never holds keys.
- **Demo mode must keep working:** `pnpm dev` with an empty `.env.local` runs
  the full founder flow. Don't break it.
- Record load-bearing decisions in `docs/DECISIONS.md` (ADR) or
  `memory/decision-log.md` (working notes); keep docs in the same PR as the
  behavior change.
- Verify with `pnpm preflight && pnpm test` before calling work done.
