# Security

> Threat model, current posture, and the checklist. Sentinel's product *is*
> security-adjacent (financial guardrails for agents), so honesty here is
> doubly required. Status labels: ✅ in place · ⚠ partial · ❌ gap (tracked in
> KNOWN_LIMITATIONS / ROADMAP).

## Assets to protect

1. The **server agent wallet key** (`AGENT_PRIVATE_KEY`) — can move real USDC.
2. The **event log** — trust, audit, and (later) compliance evidence derive
   from it; integrity is the product.
3. **LLM/API credentials** and the Privy app.
4. Users' wallets (never our custody — Privy/user-held).

## Threat model (v1) and posture

| Threat | Vector | Posture |
|---|---|---|
| Guardrail bypass | POST `/api/x402/buy` directly — server pays with no auth/authorization check | ❌ **Known P0.** Client-only enforcement. Testnet-only funds until M2 (server-side check + Privy signing policy backstop). |
| Wallet drain / griefing | Same route, repeated | ❌ No rate limit. Mitigation now: fund minimally, testnet, rotate. M2: auth + rate limits + per-key caps. |
| Event-log tampering | localStorage is user-editable | ❌ Inherent to v1 custody. M2: server custody, append-only, hash chain; M6: Merkle + EAS anchoring. |
| Trust-score gaming | Micro-payment farming, self-reported tasks | ⚠ Documented v1 weakness (TRUST_MODEL). M5: decay, amount weighting, evidence weighting. |
| Secret leakage to client | Env mishandling | ✅ zod-validated split; `serverEnv()` throws in browser; NEXT_PUBLIC_* whitelist is the entire client surface; health route returns booleans only. |
| Key custody | Raw hex key in env | ⚠ Acceptable testnet-only. M2: Privy server wallets (keys in wallet infra, signing-time policies). |
| Prompt injection → value movement | LLM chat manipulated into transfers | ✅ Architecture: value-moving tools return **unsigned intents**; user signs. Read-only tools can leak nothing sensitive (public chain data). Keep this invariant for every new tool. |
| Fake payment claims | Client asserts "paid" | ✅ `/api/verify-payment` verifies on-chain (⚠ tighten multi-transfer recipient summing — #9). |
| Malicious x402 server / facilitator | Buyer side auto-pays | ⚠ Buyer only calls our own endpoint today. M8 (paying third parties): allowlists via categories, facilitator pinning, per-counterparty limits. |
| XSS → localStorage/state theft | Injected script | ⚠ Standard React escaping; no `dangerouslySetInnerHTML` in repo. Add CSP headers at M2 (they matter once sessions exist). |
| Supply chain | 40+ deps, crypto libs | ⚠ pnpm lockfile committed; viem pinned. Add dependency audit + Dependabot/Renovate in CI (M1 remainder). x402 V1 packages receive security patches only — migrate (M2). |

## Rules for contributors (enforced in review)

1. **No new value-moving path without a server-side (or signing-time)
   authorization check.** Client checks are previews (CONSTRAINTS #9).
2. **The model never holds keys; tools never sign.** Unsigned intents only.
3. Secrets via `serverEnv()` only; never log secrets or full private keys —
   scripts print faucet-ready addresses, never echo stored keys back.
4. All USDC math through `parseUsdc`/`formatUsdc`.
5. New API routes: zod-validate the body, bound the work (`maxDuration`),
   return no internal error details beyond a safe message.
6. Events are append-only — never write code that edits or deletes one.
7. Anything touching the wallet, the log, or scoring requires a second
   reviewer (see ENGINEERING_STANDARDS review process).

## Incident basics (pre-formal-process)

Kill switches, in order: unset `X402_PAY_TO_ADDRESS` (disables the gate),
unset/rotate `AGENT_PRIVATE_KEY` (disables buyer), pause agents in UI
(governance-level). Wallet compromised ⇒ `pnpm wallet:new`, move funds,
rotate env, redeploy. Write the timeline into `memory/decision-log.md`.

## Compliance trajectory (M6)

SOC2-for-AI expectations we build toward: tamper-evident identity-bound logs,
attribution of privileged agent actions to accountable humans, PII redaction
before persistence, versioned policy governance, human override + kill switch
evidence, retention policy. Our event log is designed to *be* this evidence.
