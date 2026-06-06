# Architecture

## Layers
```
app/            Next.js App Router — pages + API routes (the edges)
  api/agent         streaming tool-calling AI agent (Node runtime)
  api/premium       x402-gated resource (seller)
  api/x402/buy      agent auto-pays the gate (buyer)
  api/verify-payment  onchain USDC verification
middleware.ts   x402 payment gate (runs before matched routes)

components/      UI — providers, ui/* primitives, feature blocks
hooks/           React data layer — useWallet/usePayment/useUsdcBalance/useAgent
lib/             framework-agnostic core (the brain)
  chains · constants · env · viem · usdc · tx · x402 · wagmi · ai/*
scripts/         tsx CLIs (self-contained, no Next imports)
```

Dependency direction: `app` → `components`/`hooks` → `lib`. `lib` never imports up. This keeps
the core portable (you can lift `lib/` into a different app later).

## Key flows

**Wallet auth.** `Providers` mounts `PrivyProvider → QueryClient → WagmiProvider(@privy-io/wagmi)`.
Privy owns identity + embedded/external wallets; the bridge feeds the connected account into
wagmi so all wagmi hooks (`useReadContract`, `useWriteContract`) work normally.

**USDC payment.** `usePayment` → validates → `useUsdcTransfer` (`writeContract` transfer) →
`useWaitForTransactionReceipt` → success + explorer link. All amounts via `parseUsdc/formatUsdc`
(6 decimals).

**x402 (both sides).**
- *Seller:* `middleware.ts` runs `paymentMiddleware(payTo, routes, facilitator)`; unmatched-payment
  requests get HTTP 402 with requirements; valid `X-PAYMENT` requests pass through to the route.
- *Buyer:* `payingFetch()/payingAxios()` wrap a client with the agent wallet; on 402 they sign a
  USDC authorization and retry, then expose the settlement via `X-PAYMENT-RESPONSE`.

**AI agent.** `/api/agent` uses Vercel AI SDK v6 `streamText` + `commerceTools`. Read-only tools
run server-side; value-moving tools return **unsigned** intents the user signs in their wallet —
the model never holds keys. Client renders `message.parts` (text + tool chips).

## The one switch
`NEXT_PUBLIC_CHAIN` (`base-sepolia` | `base`) drives `lib/chains.ts`, which every other module
reads for the active chain, USDC address, explorer, RPC, and x402 network. Flip it to change
networks everywhere.

## Env boundary
`clientEnv` (NEXT_PUBLIC_*, validated at load) is browser-safe. `serverEnv()` validates secrets
lazily and throws if called in the browser. Secrets (`AGENT_PRIVATE_KEY`, AI keys) never cross to
the client.

## Production notes
- Swap public RPCs for dedicated ones (`BASE_RPC_URL`, `BASE_SEPOLIA_RPC_URL`).
- For mainnet x402, use the CDP facilitator (`@coinbase/x402`) instead of the testnet one.
- Add rate limiting + auth to gated/agent routes before real traffic.
- The server agent wallet is a hot wallet — fund minimally; rotate after the event.
