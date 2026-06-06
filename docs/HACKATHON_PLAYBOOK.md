# Hackathon Playbook — Base + Privy + x402

## The judging thesis
Base/Privy/x402 hackathons reward **a working onchain payment that a judge can trigger live**,
wrapped in a story about *agentic commerce* (software that pays software). Win by showing a
real USDC settlement on a block explorer inside your 3-minute demo.

## Highest-signal project ideas

1. **Agent-to-API micropayments (x402).** An AI agent autonomously pays per-request for data,
   compute, or tools. You already have both sides — extend `/api/premium` into something real
   (a paid LLM proxy, a paid search, a paid dataset). *This is the headline theme.*
2. **AI checkout / "buy with one sentence".** User tells the agent what to buy; agent quotes,
   prepares the USDC transfer, user approves in Privy. See `AgentChat` + `prepareUsdcTransfer`.
3. **Autonomous treasury / subscriptions.** Agent pays recurring invoices in USDC on a schedule.
4. **Pay-per-use API marketplace.** List endpoints; each is x402-gated at a different price.
5. **Onchain tipping / creator payments** with embedded wallets (zero-friction via Privy email login).

## Build order (first 3 hours)
1. `pnpm install` → Privy app id → `pnpm dev`. Confirm login + balance. (20 min)
2. Pick ONE flow above. Delete the dashboard cards you don't need. (10 min)
3. Make the value real: wire your actual product behind `/api/premium` (seller) **or** your
   agent's `payingFetch()` to a real x402 endpoint (buyer). (60 min)
4. Get a real on-chain USDC tx happening end-to-end on Base Sepolia. (60 min)
5. Polish the one screen judges will see. (30 min)

## Scope discipline
- **One** killer flow, demoed live, beats five half-flows.
- Stay on **Base Sepolia** until the very end; only consider mainnet if a sponsor requires it.
- Hardcode demo data everywhere except the payment itself. The payment must be real.
- Keep the agent's job narrow — one tool used well reads better than ten that flake.

## Sponsor-bonus checklist
- **Privy:** use embedded wallets (email login → wallet with no extension) — it's their flagship.
- **Base:** show the tx on sepolia.basescan.org; mention USDC + sub-cent fees.
- **x402:** show the 402 → pay → 200 cycle and the settlement hash (`X402Demo` does this).

## Reusable pieces already built for you
- `useWallet()`, `useUsdcBalance()`, `usePayment()`, `useAgent()` hooks.
- `<UsdcPayment />`, `<WalletStatus />`, `<AgentChat />`, `<X402Demo />` components.
- `buildUsdcTransfer()`, `payingFetch()`, `verify-payment` route, `simulate()`/`waitForTx()`.
- CLI: `pnpm send-usdc`, `pnpm balance`, `pnpm wallet:new`.

## Pitch template (say this)
> "**[Name]** lets [user/agent] pay for [thing] in USDC on Base — autonomously. Watch:
> I click once, an AI agent hits a paywalled API, pays a cent in USDC over x402, and here's
> the settlement on Basescan. No cards, no checkout, no human in the loop."
