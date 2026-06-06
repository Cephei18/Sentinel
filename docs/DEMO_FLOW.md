# Demo Flow — the 3-minute judge script

Goal: a judge watches a **real USDC payment settle on Base** without you touching config.

## Before you present (pre-flight)
```bash
pnpm preflight     # typecheck + lint + env all green
pnpm balance       # agent wallet has ETH (gas) + USDC
```
- [ ] `.env.local` has a real `NEXT_PUBLIC_PRIVY_APP_ID`
- [ ] AI key set (`OPENAI_API_KEY` or `ANTHROPIC_API_KEY`)
- [ ] Agent wallet funded on Base Sepolia (≥ 0.05 ETH, ≥ 1 USDC)
- [ ] `X402_PAY_TO_ADDRESS` set (activates the x402 gate)
- [ ] A second browser wallet / address ready to receive
- [ ] Basescan tab open: https://sepolia.basescan.org
- [ ] `pnpm dev` already running, `/dashboard` loaded

## The script (≈3 min)

**0:00 — Hook (15s).**
"Software paying software. This is an AI agent that pays for an API by itself, in USDC, on Base."

**0:15 — Auth (20s).**
Click **Connect Wallet** → log in with **email** (Privy embedded wallet). Emphasize: no
extension, no seed phrase — a wallet in 5 seconds. The `WalletStatus` card shows live USDC.

**0:35 — Human payment (40s).**
In **Send USDC**, paste the receiver, enter `1.00`, **Pay**. Show the toast → click **View** →
the tx on Basescan confirming in ~2s. "Real USDC, sub-cent fee, instant."

**1:15 — x402 autonomous payment (50s).** ⭐ the money shot
Click **Run x402 purchase** in the **x402 Autonomous Purchase** card. Narrate the cycle:
"The endpoint returns 402 Payment Required → the agent signs a USDC payment → retries →
gets the data. Here's the settlement hash." Click it → Basescan.

**2:05 — AI agent (40s).**
In **Commerce Agent**: *"Quote a payment of 2.50 USDC to 0x…, then prepare the transfer."*
Show the tool chips firing and the prepared (unsigned) transfer. "The model never holds keys —
it proposes, the user approves."

**2:45 — Close (15s).**
"Email login, autonomous USDC payments, on-chain proof — all on Base. That's agentic commerce."

## If something fails live
- Wallet won't connect → check Privy **Allowed origins** includes your URL.
- x402 button errors → agent wallet out of USDC/ETH, or `X402_PAY_TO_ADDRESS` unset. Fall back
  to the **Send USDC** flow (always works) and *describe* the x402 path.
- Agent 500 → AI key missing/rate-limited. Switch provider key and reload.
- Keep `pnpm send-usdc <to> <amt>` in a terminal as a guaranteed-working backup payment.
