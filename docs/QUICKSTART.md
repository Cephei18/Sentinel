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
| `NEXT_PUBLIC_ONCHAINKIT_API_KEY` | [portal.cdp.coinbase.com](https://portal.cdp.coinbase.com) | ⬜ OnchainKit components |

### Privy setup (the one required step)
1. Create an app in the Privy dashboard.
2. Copy the **App ID** → `NEXT_PUBLIC_PRIVY_APP_ID` in `.env.local`.
3. In Privy → **Login methods**, enable Email, Wallet, Google.
4. In **Allowed origins**, add `http://localhost:3000` (and your Vercel URL later).

## 3. Create + fund the agent wallet

```bash
pnpm wallet:new          # prints a fresh address + private key
# paste AGENT_PRIVATE_KEY (and optionally X402_PAY_TO_ADDRESS) into .env.local
```

Fund it on **Base Sepolia**:
- ETH (for gas): https://portal.cdp.coinbase.com/products/faucet
- USDC (for payments): https://faucet.circle.com  → choose **Base Sepolia**

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
- **Send USDC** card → move testnet USDC to any address.
- **x402 Autonomous Purchase** → server agent pays a gated API by itself.
- **Commerce Agent** → "Quote a payment of 2.50 USDC to 0x…".

## Switch to mainnet
Set `NEXT_PUBLIC_CHAIN=base` in `.env.local`. Everything (USDC address, explorer, x402
network) flips automatically. Use real funds carefully.
