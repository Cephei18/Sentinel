# Common Errors & Fixes

## Setup / tooling

**`pnpm` not found / corepack signature error.**
Installed via `npm install -g pnpm@9` (Node 20-compatible). pnpm 10 needs Node ≥ 22.13.
If you upgrade Node to 22 LTS later, you can move to pnpm 10.

**Peer dependency warnings on install.** Expected and harmless: optional `utf-8-validate`,
Farcaster mini-app transitive deps, a patch-level `viem` diff. Install still succeeds.

**`wagmi` types mismatch / OnchainKit complaining.** Keep **wagmi 2 + viem 2**. wagmi 3 breaks
the OnchainKit/Privy peer matrix. This starter pins `wagmi@2.19.5`.

## Privy / wallet

**"appId is required" / login modal does nothing.** `NEXT_PUBLIC_PRIVY_APP_ID` is empty or
wrong. Set it from dashboard.privy.io and restart `pnpm dev` (NEXT_PUBLIC vars are build-time).

**Login works but wallet stays disconnected.** Add your origin (`http://localhost:3000`) to
Privy → **Allowed origins**.

**Hydration mismatch warnings.** Wallet UI differs server vs client. Gate wallet-dependent
rendering on `useWallet().ready` / `isConnected` (the provided components already do).

## Payments / USDC

**Sent 1,000,000× too much (or too little).** USDC has **6 decimals**. Always go through
`parseUsdc()` / `formatUsdc()` — never `parseEther`.

**`transfer` reverts.** Insufficient USDC, or you're on the wrong network. `usePayment()` calls
`simulate()` first and auto-switches chains; check the agent has testnet USDC (`pnpm balance`).

**Wrong network.** The whole app follows `NEXT_PUBLIC_CHAIN`. Mixing a mainnet wallet with a
`base-sepolia` app = failed tx. Use the network badge / "Switch to Base Sepolia" button.

## x402

**`/api/x402/buy` returns 500.** Needs `AGENT_PRIVATE_KEY` (funded with Base Sepolia USDC).
The gate also needs `X402_PAY_TO_ADDRESS` set, or `/api/premium` isn't actually gated.

**402 loop / payment not accepted.** Ensure the gate `network` matches the buyer's chain and
the facilitator URL is reachable (`https://x402.org/facilitator` for testnet).

**Middleware not running.** `matcher` in `src/middleware.ts` only covers `/api/premium/:path*`.
Add your gated paths there.

## AI agent

**Agent route 500: "Set OPENAI_API_KEY or ANTHROPIC_API_KEY".** Add one to `.env.local`, restart.

**Tools never fire.** The model decides when to call tools — prompt it explicitly ("check the
balance of 0x…"). Multi-step chaining is capped by `stopWhen: stepCountIs(5)`.

**`message.content` is undefined.** AI SDK v6 uses `message.parts` (text + tool parts), not
`.content`. Render parts (see `AgentChat`).

## Build / deploy

**`next build` fails on env.** This starter uses a non-empty Privy fallback so builds pass
without creds. Real validation errors print as "❌ Invalid … environment variables".

**Edge runtime error importing viem/node APIs.** Routes that use viem set `runtime = "nodejs"`.
Don't switch them to edge.

**Vercel: missing env at runtime.** Add every var from `.env.example` in Vercel → Project →
Settings → Environment Variables (NEXT_PUBLIC_* included).
