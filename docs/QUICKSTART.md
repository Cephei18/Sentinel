# Quickstart

## 1. Install + run

```bash
pnpm install
Copy-Item .env.example .env.local   # macOS/Linux: cp .env.example .env.local
pnpm dev
```

The app runs at http://localhost:3000 even before you add keys — wallet login and the AI
agent simply stay disabled until you fill them in.

## 2. Get your keys (≈3 minutes)

| Key | Where | Required? |
| --- | --- | --- |
| `NEXT_PUBLIC_PRIVY_APP_ID` | [dashboard.privy.io](https://dashboard.privy.io) → create app → **App ID** | ✅ for login |
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com/api-keys) | ⬜ (or Anthropic) for agent |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) | ⬜ alt agent provider |

### Privy setup (the one required step)
1. Create an app in the Privy dashboard.
2. Copy the **App ID** → `NEXT_PUBLIC_PRIVY_APP_ID` in `.env.local`.
3. In Privy → **Wallet configuration**, enable **Solana** (embedded wallets → Solana; the
   starter's Privy config sets `walletChainType: "solana-only"`, so make sure Solana is the
   enabled chain type for embedded wallets in the dashboard too).
4. In Privy → **Login methods**, enable Email, Wallet, Google.
5. In **Allowed origins**, add `http://localhost:3000` (and your Vercel URL later).

## 3. Create + fund the agent wallet

```bash
pnpm wallet:new          # prints a fresh Solana address + secret key
# paste AGENT_PRIVATE_KEY (and optionally X402_PAY_TO_ADDRESS) into .env.local
```

`AGENT_PRIVATE_KEY` accepts either a base58 secret key (Phantom's "export private key"
format) or a JSON byte-array string (the `solana-keygen` / Solana CLI format).

Fund it on **devnet**:
- SOL (for fees): https://faucet.solana.com
- USDC (for payments): https://faucet.circle.com → select **Solana Devnet**

Check it landed:

```bash
pnpm balance
```

## 4. Verify everything

```bash
pnpm check-env     # green check = ready
pnpm preflight     # typecheck + lint + env (run before your demo)
```

## 5. Try the flows
- Open `/dashboard` → **Connect Wallet** (Privy modal) → see your live USDC balance.
- **Send USDC** card → move devnet USDC to any Solana address.
- **x402 Autonomous Purchase** → server agent pays a gated API by itself.
- **Commerce Agent** → "Quote a payment of 2.50 USDC to <a base58 address>".

## Switch to mainnet
Set `NEXT_PUBLIC_SOLANA_CLUSTER=mainnet-beta` in `.env.local`. Everything (USDC mint, explorer,
x402 network) flips automatically. There's no runtime chain-switching — Solana wallets have no
"switch chain" action, so exactly one cluster is active per deployment. Use real funds
carefully.
