# Data Flow

> How data moves through Sentinel v1, end to end. Structure in
> `ARCHITECTURE.md`; this doc is the mechanics.

## 1. State & derivation (the core loop)

```mermaid
flowchart LR
  UI[UI action] -->|DraftEvent| P[agents-provider]
  P -->|stamp id, at, trustDelta| L[(events + agents<br/>localStorage sentinel.store.v1)]
  L -->|on read| R[reputation.ts<br/>computeTrustScore / computeSpend]
  R --> G[governance.ts<br/>autonomyFor / budgetRecommendation]
  R --> V[views: ring, breakdown,<br/>rankings, graph, feeds]
  G --> V
```

- Writes: `createAgent`, `recordEvent`, `payAgent`, `setStatus`, `setBudget` —
  all funnel through the provider, which persists the whole store on change.
- `recordEvent` stamps `trustDelta` by scoring before/after
  (`projectScoreDelta`) so feeds can explain every movement.
- Reads are pure recomputation over the full log — no cached scores anywhere.

## 2. Guardrailed autonomous purchase (single agent)

```mermaid
sequenceDiagram
  participant U as Profile UI (agent-run-action)
  participant A as checkAuthorization (lib/agents)
  participant S as /api/x402/buy (server)
  participant PR as /api/premium (x402 gate lives here)
  participant F as PayAI facilitator → Solana

  U->>A: status·expiry·category·per-tx·budget
  alt blocked
    A-->>U: reason
    U->>U: record limit_blocked (trust dips)
  else clear
    U->>S: POST (demo mode skips straight to simulated settle)
    S->>PR: payingFetch GET /api/premium
    PR-->>S: 402 + v2 payment requirements
    S->>PR: retry + PAYMENT-SIGNATURE (signed USDC tx, agent keypair)
    PR->>F: verify + settle on Solana
    F-->>PR: settlement
    PR-->>S: data + PAYMENT-RESPONSE (settlement signature)
    S-->>U: { ok, data, payment }
    U->>U: record payment_success + task_completed (trust rises)
  end
  Note over U,S: ⚠ v1: the server never re-checks authorization —<br/>client-enforced only (KNOWN_LIMITATIONS #1)
```

Failure at any server step ⇒ the UI records a **labelled simulated**
settlement instead (demo resilience; see CONSTRAINTS #10 for the target rule).

## 3. Agent-to-agent delegation

`agent-commerce.tsx` → `checkDelegation()` (payer status/expiry/tier/category/
per-tx/budget + payee status) → `payAgent(payer, payee, amount, service)` →
two linked events: payer `payment_success` (+`counterpartyId`) and payee
`task_completed`. No on-chain settlement in v1 — simulated coordination. The
`counterpartyId` pair is what `trust-graph.tsx` projects into animated edges
(dedup by payer→payee, count accumulates).

## 4. AI commerce chat

`agent-chat.tsx` (`useChat`) → `POST /api/agent` → AI SDK v6 `streamText`
(OpenAI else Anthropic) with `commerceTools`, up to 5 steps. Read-only tools
(balance, status, quote) execute server-side; `prepareUsdcTransfer` returns
an **unsigned transaction** streamed back as tool parts — the user signs in
their own wallet (Privy, Solana). Chat state is ephemeral (not in the event log).

## 5. User USDC payment + verification

`usdc-payment.tsx` → `usePayment` state machine (validate → sign via
`useUsdcTransfer`/Privy Solana wallet → wait for confirmation) → optional
server-side proof: `POST /api/verify-payment { signature, expectedTo,
minAmount }` → the server reads the parsed transaction over the RPC
connection, diffs pre/post USDC token balances across every account the tx
touched (Solana has no ABI-decoded `Transfer` event log to decode), confirms
amount/recipient. Server verification exists precisely because "the client
said it paid" is never trusted — the one place v1 already follows the target
enforcement philosophy.

## 6. Environment & configuration flow

`NEXT_PUBLIC_SOLANA_CLUSTER` → `lib/solana.ts` → everything (active cluster,
USDC mint, explorer, x402 network, RPC connection, scripts' equivalents).
`clientEnv` validated at module load (browser-safe); `serverEnv()` lazy,
server-only, throws in browser. Missing Privy id ⇒ `providers.tsx` renders the
demo-mode tree (no Privy mounted at all) — the reason the whole app works
with zero configuration.

## 7. Seed & reset

First load (no stored state) ⇒ `buildSeed(Date.now())` constructs Atlas/Nova/
Probe and ~25 back-dated events (relative to now, so feeds look fresh).
`DemoReset` clears and reseeds. Seed never runs at module scope — SSR/client
consistency.

## v2 deltas (when M2 lands)

The provider's write surface becomes API calls; the log becomes an append-only
Postgres table (hash-chained); guardrail evaluation moves inside the server
spend path with verdict+inputs logged; wallet signing moves to Privy server
wallets (Solana) with policy backstop. **No diagram above changes shape —
only custody and placement.** That's the point of the seams.
