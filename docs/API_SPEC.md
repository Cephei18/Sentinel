# API Specification (v1)

> The current HTTP surface. Small on purpose — v1's system of record is
> client-side. The v2 public API (agents/authorizations/events/decisions CRUD
> + `check` endpoint) is sketched at the end and firms up in Roadmap M4.

Base URL: same-origin. All routes Node runtime. No authentication in v1
(⚠ acceptable only because nothing multi-tenant exists; see
KNOWN_LIMITATIONS #5).

## `GET /api/health`
Liveness + configuration sanity. Returns active chain and boolean presence of
each provider credential (never values).
```json
{ "status": "ok", "chain": "Base Sepolia", "chainId": 84532,
  "providers": { "privy": true, "openai": false, "anthropic": true,
                 "agentWallet": true, "x402Gate": true },
  "time": "…" }
```

## `POST /api/agent`
Streaming tool-calling commerce agent (AI SDK v6 UI-message stream).
- **Body:** `{ messages: UIMessage[] }`
- **Model:** `gpt-4o-mini` if `OPENAI_API_KEY`, else `claude-3-5-haiku-latest`
  if `ANTHROPIC_API_KEY`, else 500 with setup hint.
- **Tools:** `getUsdcBalance`, `quotePayment`, `prepareUsdcTransfer`
  (returns **unsigned** calldata, `requiresApproval: true`),
  `getTransactionStatus`. Max 5 chained steps.
- **Returns:** UI message stream (`toUIMessageStreamResponse`).

## `GET /api/premium` — x402-gated (seller side)
The paid resource. Gating happens in `middleware.ts` *before* this route: with
`X402_PAY_TO_ADDRESS` set, unpaid requests receive **HTTP 402** with payment
requirements (price `$0.01`, USDC, active network, facilitator
`X402_FACILITATOR_URL` or the public testnet default); requests bearing a
valid `X-PAYMENT` header settle via the facilitator and pass through.
Unset ⇒ gate disabled (local dev). Returns demo market-data JSON.

## `POST /api/x402/buy` — autonomous purchase (buyer side)
Server agent wallet (from `AGENT_PRIVATE_KEY`) pays the gated endpoint via
`payingFetch` and returns proof.
- **Body:** none. **Success:**
  `{ ok: true, data: …, payment: { success, transaction, network, payer } }`
- **Failure:** `{ ok: false, error }` (500).
- ⚠ v1: no auth, no rate limit, **no authorization check** — the caller's
  guardrail is trusted. This is the enforcement gap (P0-1); do not copy this
  pattern.

## `POST /api/verify-payment`
Server-side proof a tx moved USDC. Never trust a client's "I paid."
- **Body:** `{ hash: 0x…64, expectedTo?: 0x…40, minAmount?: "1.5" }`
- Reads the receipt, sums decoded USDC `Transfer` logs, checks recipient/
  amount. **Returns:** `{ verified, amountUsdc, recipient, explorer }` or
  `{ verified: false, reason }`.
- Known looseness: sums transfers across recipients, keeps last recipient
  (KNOWN_LIMITATIONS #9).

## Middleware
`middleware.ts` — x402 `paymentMiddleware` on matcher `/api/premium/:path*`
only; no-op function when the gate is unconfigured.

---

## v2 surface (target sketch — Roadmap M2/M4)

```
POST   /v1/decisions/check      { agentKey, action, amount, category, counterparty }
                                → { allow|block, reason, decisionId, trace }   ← the product
POST   /v1/events               append (server-stamped, hash-chained)
GET    /v1/agents · POST /v1/agents · PATCH /v1/agents/:id (status, authorization)
GET    /v1/agents/:id/trust     score + factors + confidence + history
GET    /v1/agents/:id/events    paginated log
POST   /v1/payments/x402        governed spend: check → sign (Privy policy) → settle → record
GET    /v1/audit/export         why-trail evidence bundles
```
Auth: org API keys (server) + per-agent keys (scoped). Every `check` verdict
persists with its full input set — decisions are replayable by construction.
