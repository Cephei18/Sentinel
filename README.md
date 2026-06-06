# Base Pay — Agentic Commerce Starter

Production-grade hackathon starter for **Base + Privy + x402**: USDC payments, wallet auth,
and AI agents that pay for things. Built to demo in minutes and continue into production.

> Stack: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · wagmi 2 / viem 2 ·
> Privy · OnchainKit · x402 · Vercel AI SDK v6 · pnpm

---

## 60-second start

```bash
pnpm install
cp .env.example .env.local           # PowerShell: Copy-Item .env.example .env.local
# 1) add NEXT_PUBLIC_PRIVY_APP_ID  (https://dashboard.privy.io)
# 2) add OPENAI_API_KEY or ANTHROPIC_API_KEY  (for the AI agent)
pnpm wallet:new                      # mint a server agent wallet, paste key into .env.local
pnpm check-env                       # verify everything is wired
pnpm dev                             # http://localhost:3000
```

Default network is **Base Sepolia** (testnet). Grab funds:
[ETH faucet](https://portal.cdp.coinbase.com/products/faucet) ·
[USDC faucet](https://faucet.circle.com).

---

## What's inside

| Area | Where |
| --- | --- |
| Wallet auth (Privy + wagmi bridge) | [src/components/providers.tsx](src/components/providers.tsx), [src/hooks/use-wallet.ts](src/hooks/use-wallet.ts) |
| USDC payments (hook + UI) | [src/hooks/use-payment.ts](src/hooks/use-payment.ts), [src/components/payment/usdc-payment.tsx](src/components/payment/usdc-payment.tsx) |
| x402 — seller (gate) | [src/middleware.ts](src/middleware.ts), [src/app/api/premium/route.ts](src/app/api/premium/route.ts) |
| x402 — buyer (agent pays) | [src/lib/x402.ts](src/lib/x402.ts), [src/app/api/x402/buy/route.ts](src/app/api/x402/buy/route.ts) |
| AI commerce agent | [src/app/api/agent/route.ts](src/app/api/agent/route.ts), [src/lib/ai/tools.ts](src/lib/ai/tools.ts), [src/components/agent/agent-chat.tsx](src/components/agent/agent-chat.tsx) |
| Onchain verification | [src/app/api/verify-payment/route.ts](src/app/api/verify-payment/route.ts) |
| Chain / USDC / tx utils | [src/lib/chains.ts](src/lib/chains.ts), [src/lib/usdc.ts](src/lib/usdc.ts), [src/lib/tx.ts](src/lib/tx.ts) |
| CLI scripts | [scripts/](scripts/) |

## Commands

```bash
pnpm dev            # dev server (Turbopack)
pnpm build          # production build
pnpm preflight      # typecheck + lint + env check (run before demoing)
pnpm check-env      # validate .env.local
pnpm wallet:new     # generate a funded-test agent wallet
pnpm balance [addr] # ETH + USDC balance
pnpm send-usdc <to> <amt>   # CLI USDC transfer from agent wallet
```

## Docs

- [QUICKSTART](docs/QUICKSTART.md) — get running + get API keys
- [HACKATHON_PLAYBOOK](docs/HACKATHON_PLAYBOOK.md) — winning project ideas + build order
- [DEMO_FLOW](docs/DEMO_FLOW.md) — the 3-minute judge demo script
- [COMMON_ERRORS](docs/COMMON_ERRORS.md) — fixes for the usual landmines
- [CHEATSHEET](docs/CHEATSHEET.md) — addresses, snippets, commands
- [ARCHITECTURE](docs/ARCHITECTURE.md) — how it fits together

## Design decisions

- **Privy is the single wallet layer.** It covers email/social + external wallets + embedded
  wallets, so we skip RainbowKit to avoid duplicate connector providers. wagmi hooks still work.
- **wagmi 2 / viem 2** (not wagmi 3): matches the OnchainKit + Privy peer matrix today.
- **x402 both directions:** middleware gates routes (seller); `payingFetch`/`payingAxios`
  auto-pay 402s (buyer/agent).
- **Keys never touch the model.** Value-moving AI tools return *unsigned* intents for the user
  to approve in their wallet.
