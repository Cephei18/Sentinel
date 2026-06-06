# Cheat Sheet

## Commands
```bash
pnpm dev                     # dev server
pnpm build && pnpm start     # prod build + serve
pnpm preflight               # typecheck + lint + check-env (run before demo)
pnpm check-env               # validate .env.local
pnpm wallet:new              # mint agent wallet
pnpm balance [address]       # ETH + USDC balance
pnpm send-usdc <to> <amt>    # CLI USDC transfer
pnpm format                  # prettier write
vercel / vercel --prod       # deploy
```

## Addresses & networks
| | Base Sepolia (84532) | Base (8453) |
| --- | --- | --- |
| USDC | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Explorer | sepolia.basescan.org | basescan.org |
| RPC | https://sepolia.base.org | https://mainnet.base.org |

USDC decimals: **6**. x402 testnet facilitator: `https://x402.org/facilitator`.

## Faucets
- Base Sepolia ETH — https://portal.cdp.coinbase.com/products/faucet
- Base Sepolia USDC — https://faucet.circle.com

## Copy-paste snippets

**USDC checkout card**
```tsx
import { UsdcPayment } from "@/components/payment/usdc-payment";
<UsdcPayment recipient="0x..." amount="2.50" label="Buy Report" />
```

**Wallet state**
```tsx
const { address, isConnected, login, logout } = useWallet();
const { formatted } = useUsdcBalance(address);
```

**Programmatic payment**
```tsx
const { pay, status, explorerUrl } = usePayment();
await pay("0xRecipient", "1.00");
```

**Encode a USDC transfer (raw)**
```ts
import { buildUsdcTransfer } from "@/lib/usdc";
const { to, data } = buildUsdcTransfer("0x...", "1.5"); // → sendTransaction / sendCalls
```

**Agent pays an x402 endpoint (server)**
```ts
import { payingFetch, decodePaymentResponse } from "@/lib/x402";
const res = await payingFetch()("https://api.example.com/paid");
const settlement = decodePaymentResponse(res.headers.get("x-payment-response"));
```

**Gate a route with x402** (add to `src/middleware.ts` routes map)
```ts
"/api/your-endpoint": { price: "$0.05", network, config: { description: "..." } }
```
Then add the path to `export const config.matcher`.

**Add an AI tool** — edit `src/lib/ai/tools.ts`
```ts
myTool: tool({
  description: "…",
  inputSchema: z.object({ x: z.string() }),
  execute: async ({ x }) => ({ result: x }),
}),
```

**Verify a payment server-side**
```ts
await fetch("/api/verify-payment", {
  method: "POST",
  body: JSON.stringify({ hash, expectedTo, minAmount: "1.0" }),
});
```

## Editor snippet prefixes
`rcc` client component · `route` API route · `pay` payment card · `usewallet` wallet hook ·
`aitool` AI tool.
