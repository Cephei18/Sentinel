# Hackathon Playbook — Solana + Privy + x402

## The judging thesis
Solana Hacker House judges reward **a working on-chain payment that a judge can trigger live**,
wrapped in a story about *agentic commerce* (software that pays software). Win by showing a
real USDC settlement on Solana Explorer inside your 3-minute demo.

Lead with the "why Solana" fact if you need it: Solana already carries roughly **65% of all
x402 transaction volume**, and Solana Foundation is a premier member of the new x402
Foundation (spun out under the Linux Foundation). This isn't a niche integration — it's the
dominant rail for exactly the agentic-payments story you're telling.

## Highest-signal project ideas

1. **Agent-to-API micropayments (x402).** An AI agent autonomously pays per-request for data,
   compute, or tools. You already have both sides — extend `/api/premium` into something real
   (a paid LLM proxy, a paid search, a paid dataset). *This is the headline theme.*
2. **AI checkout / "buy with one sentence".** User tells the agent what to buy; agent quotes,
   prepares the USDC transfer, user approves in Privy. See `AgentChat` + `prepareUsdcTransfer`.
3. **Autonomous treasury / subscriptions.** Agent pays recurring invoices in USDC on a schedule.
4. **Pay-per-use API marketplace.** List endpoints; each is x402-gated at a different price.
5. **On-chain tipping / creator payments** with embedded wallets (zero-friction via Privy email
   login — no browser extension, no seed phrase to write down).

## Build order (first 3 hours)
1. `pnpm install` → Privy app id (Solana enabled) → `pnpm dev`. Confirm login + balance. (20 min)
2. Pick ONE flow above. Delete the dashboard cards you don't need. (10 min)
3. Make the value real: wire your actual product behind `/api/premium` (seller) **or** your
   agent's `payingFetch()` to a real x402 endpoint (buyer). (60 min)
4. Get a real on-chain USDC tx happening end-to-end on Solana devnet. (60 min)
5. Polish the one screen judges will see. (30 min)

## Scope discipline
- **One** killer flow, demoed live, beats five half-flows.
- Stay on **devnet** until the very end; only consider mainnet-beta if a sponsor requires it.
- Hardcode demo data everywhere except the payment itself. The payment must be real.
- Keep the agent's job narrow — one tool used well reads better than ten that flake.

## Sponsor-bonus checklist
- **Privy:** use embedded wallets (email login → Solana wallet with no extension) — it's their
  flagship flow, now Solana-native.
- **Solana:** show the tx on `explorer.solana.com/tx/{signature}?cluster=devnet`; mention USDC +
  sub-cent fees + sub-second finality.
- **x402:** show the 402 → pay → 200 cycle and the settlement signature (`X402Demo` does this),
  and don't be afraid to namedrop the "~65% of x402 volume is on Solana" stat — judges from the
  x402/PayAI/Solana side will recognize it.

## Reusable pieces already built for you
- `useWallet()`, `useUsdcBalance()`, `usePayment()`, `useAgent()` hooks.
- `<UsdcPayment />`, `<WalletStatus />`, `<AgentChat />`, `<X402Demo />` components.
- `buildUsdcTransfer()`, `payingFetch()`, `verify-payment` route, `simulate()`/`waitForTx()`.
- CLI: `pnpm send-usdc`, `pnpm balance`, `pnpm wallet:new`.

## Honesty checklist before you claim it in a pitch
- The engine (trust scoring, guardrails, governance) is unchanged, pure TypeScript, fully
  tested — say that with confidence.
- The x402-solana integration was built and verified against the real installed package's
  types/README, and the wallet-free fallback path was live-tested. It has **not** been run
  end-to-end against a funded devnet wallet + live facilitator settlement — if a judge asks
  "has this actually settled a real payment," the honest answer is "the rails are wired and
  type-verified; a live funded run is the next step," not "yes."
- There is no custom on-chain program here — this rides the existing SPL Token program +
  Privy wallets + x402-solana's facilitator. That's a feature (less surface area, no audit
  needed for a program you didn't write), not a gap — frame it that way if asked.

## Pitch template (say this)
> "**[Name]** lets [user/agent] pay for [thing] in USDC on Solana — autonomously. Watch:
> I click once, an AI agent hits a paywalled API, pays a cent in USDC over x402, and here's
> the settlement on Solana Explorer. No cards, no checkout, no human in the loop — and it's
> riding the same x402-on-Solana rail that already carries most of this protocol's volume."
