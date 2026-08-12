# Known Limitations & Repository Audit

> The honest, prioritized gap list between the hackathon MVP and a production
> governance product. Audited 2026-07-03 (full code read + component survey).
> Severity: 🔴 existential for the product thesis · 🟠 must fix before real users
> · 🟡 debt worth paying down · ⚪ cosmetic.
>
> Items marked ✅ were fixed in the 2026-07-03 onboarding pass.

## 🔴 P0 — Governance that doesn't actually govern

1. **Guardrails are enforced only in the browser.**
   `guardrail()` runs in [`agent-run-action.tsx`](../src/components/agents/agent-run-action.tsx)
   / [`agent-commerce.tsx`](../src/components/agents/agent-commerce.tsx), while
   [`/api/x402/buy`](../src/app/api/x402/buy/route.ts) spends from the server
   agent wallet **unconditionally** — anyone who POSTs to it bypasses every
   check. For a product whose thesis is "every payment is checked before value
   moves," enforcement placement is the product. *Why it persists:* the system
   of record is client-side localStorage, so the server has nothing to check
   against. *Fix:* server-custodied state + authorization check at the payment
   boundary + Privy signing-time policies as the hard backstop (Roadmap M1–M2).

2. **No persistence or tenancy: the "system of record" is one browser's
   localStorage.** No database, no users, no orgs, no API for agents to
   integrate against. Every trust score and audit trail dies with a cleared
   cache. The provider seam (`agents-provider.tsx`) was built for this swap —
   exercise it (Roadmap M2).

3. **The event log is mutable in practice.** Events are "immutable" by
   convention only — any client code (or the user via devtools) can rewrite
   `sentinel.store.v1`. Trust derived from a tamperable log is not trust. *Fix:*
   server custody, append-only writes, hash chaining (Roadmap M2); later
   Merkle-batched integrity proofs (Roadmap M6) — Solana has no direct EAS
   equivalent, so the anchoring mechanism is still an open research question,
   not a settled choice (see Roadmap M6/M9).

## 🟠 P1 — Correctness & security

4. ~~**Duplicated, divergent guardrail logic.** Two hand-written `guardrail()`
   implementations drifted: the delegation path never re-checks payer `status`
   (relies on a UI filter) and **never checks the payee at all** — a paused or
   revoked agent can still be hired, paid, and earn trust as a payee.~~
   ✅ Fixed: single `checkAuthorization()` / `checkDelegation()` in
   [`src/lib/agents/authorization.ts`](../src/lib/agents/authorization.ts),
   used by both components, with tests.

5. **`/api/x402/buy` is unauthenticated and unrated.** Even setting governance
   aside, the route lets any visitor drain the server wallet $0.01 at a time
   (and `maxDuration: 30` of RPC work per call). Needs auth + rate limiting the
   moment it deploys anywhere public with a funded key.

6. **`AGENT_PRIVATE_KEY` is a raw hot key (base58 or JSON byte-array) in env.**
   Acceptable for a devnet demo; unacceptable beyond it. Replace with Privy
   server wallets on Solana so keys live in wallet infrastructure with
   signing-time policies (Roadmap M2).

7. **Trust engine is gameable by design (documented v1 simplifications):** no
   time decay, no amount weighting (a $0.01 success = a $500 success),
   self-reported `task_completed`, no counterparty diversity — an agent can
   farm trust with micro-payments. Fine while the loop is closed; must be fixed
   before scores carry economic weight (Trust v2, Roadmap M5; see
   `TRUST_MODEL.md`). Two calibration findings from the 2026-07-03 test pass:
   (a) penalty curves are mild — 50% reliability + 2 blocks still scored ~72;
   (b) the new-agent baseline (72) lands *inside* the Trusted band, so a
   brand-new agent may delegate — arguably contradicting "autonomy is earned"
   (should likely start Supervised until confidence ≥ medium).

8. ~~**x402 dependencies are the deprecated V1 line.** `x402-next` / `x402-fetch`
   / `x402-axios` 1.2.x receive security patches only; the ecosystem moved to a
   V2 architecture (headers, multi-chain, discovery). Migrate deliberately.~~
   ✅ Done as part of the Solana migration: the app now runs on `x402-solana`
   (protocol v2, PayAI Network), with `PAYMENT-SIGNATURE`/`PAYMENT-RESPONSE`
   headers and the gate implemented directly in `/api/premium` (x402-solana
   ships no Next.js middleware helper, so `middleware.ts` was removed rather
   than ported). Verified against the installed package's types/README and
   exercised via `pnpm dev`'s degradation ladder, but **not yet exercised
   end-to-end against a funded live devnet wallet + live facilitator
   settlement** — treat that path as unverified until it is.

9. **`verify-payment` sums every USDC token-balance increase in a tx and keeps
   only the last owner seen as "the" recipient**
   ([route.ts](../src/app/api/verify-payment/route.ts)) — a multi-transfer tx
   could satisfy `minAmount` across different recipient ATAs while
   `expectedTo` matches only the final leg. Low stakes today; tighten to
   per-recipient sums when it guards anything real.

## 🟡 P2 — Debt

10. ~~**Zero tests**, despite `lib/agents/` being pure and deterministic —the
    easiest high-value test target imaginable.~~ ✅ Fixed: vitest + engine
    test suite (`src/lib/agents/*.test.ts`).
11. ~~**Dead code:** all of `lib/mock.ts`; `sleep()` in `utils.ts`;
    `CardFooter`; unreachable "failed" branch in `agent-run-action.tsx`
    (its catch falls back to simulated success).~~ ✅ Removed `mock.ts`,
    `sleep()`, and the unreachable branch (kept `CardFooter` — conventional
    UI-kit surface).
12. **Demo-mode fallbacks mask real failures:** a failed real x402 settlement
    silently becomes a "simulated success" event that *raises* trust. Right
    for a hackathon stage, wrong for a product — make simulation an explicit
    mode, never a fallback (Roadmap M1).
13. **Hardcoded product values** scattered in components: `RESOURCE` price
    ($0.01) duplicating `/api/premium` and `middleware.ts` pricing; `$0.01` in
    `x402-demo.tsx`; watchlist thresholds (66/55) in `workforce-rankings.tsx`
    duplicating governance tier constants; dialog defaults in
    `create-agent-dialog.tsx`. Centralize in `lib` as they next get touched.
14. **`scripts/_shared.ts` hand-copies USDC/RPC/explorer constants** from
    `lib/constants.ts` (deliberate — no `@` alias in scripts — but drift-prone;
    a tsx-compatible import or generated constants file would remove the risk).
15. **Trust recompute is O(events) on every read**, called per-agent per-render
    across roster/graph/rankings. Invisible at demo scale; needs memoization or
    snapshot projections once the log lives server-side and grows.
16. **No CI.** Husky runs lint-staged locally, but nothing runs
    typecheck/lint/tests on push (Roadmap M1).

## ⚪ P3 — Cosmetic / consistency

17. ~~`.env.example` header still says "Base Pay — Hackathon Starter".~~ ✅ Fixed.
18. ~~`ARCHITECTURE.md` predates the Sentinel layer (omits `lib/agents/*`,
    `components/agents/*`, 2 of 6 hooks).~~ ✅ Rewritten.
19. ~~`package.json` `name` is `"base"`; landing footer says "Built for the
    Base + Privy hackathon"; `.vscode/extensions.json` recommends a Solidity
    extension with no Solidity in the repo.~~ ✅ Fixed as part of the Solana
    migration: `package.json` `name` is now `"sentinel"`, landing copy and
    `.vscode/extensions.json` updated. The name-collision question below is
    unrelated and still open.
20. Minor UI duplication: budget-bar block (`agent-card` / `authorization-card`),
    `tierVariant` mapping (`governance-card` / `workforce-rankings`), `nowMs`
    snapshot pattern ×3. Extract when next touched; not worth churn now.
21. IIFE-in-JSX readability smell in `agents/[id]/page.tsx` and
    `governance-card.tsx`.

## Strategic (not code)

22. **The name "Sentinel" is heavily collided** (Microsoft Sentinel — now
    marketed as an agentic security platform — SentinelOne, and several
    agent-governance projects already using the name). Rename before any public
    launch; track in `memory/project-memory.md` open questions.
23. **Single-operator worldview.** No concept of organizations, roles, or
    approver workflows — the enterprise buyer's first questions. Designed-for
    but unimplemented (Roadmap M3+).

## What is genuinely good (preserve these)

- The **pure, deterministic, explainable trust engine** with per-factor
  attributions and confidence — the core IP; research (2026) validates
  explainable trust as the right bet.
- **Derived-not-stored** projections over an append-only event log — the right
  architecture, just in the wrong custody.
- **Clean layering** (`app → components/hooks → lib`, lib never imports up) and
  the explicit provider seam for the storage swap.
- **Unsigned-intent AI tools** — the model never holds keys.
- Strict TS, zod-validated env split (client/server), single cluster switch,
  USDC decimal hygiene, wallet-free demo resilience.
- **The trust/governance engine needed zero changes for the Solana
  migration** — `src/lib/agents/` is pure TypeScript with no chain imports
  (confirmed by a full import audit), and all 39 existing vitest tests pass
  unmodified. The actual IP was untouched by the rewrite.
