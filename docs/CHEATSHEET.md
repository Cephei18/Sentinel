# Cheat Sheet

## Commands
```bash
pnpm dev                     # dev server
pnpm build && pnpm start     # prod build + serve
pnpm preflight               # typecheck + lint + check-env (run before demo)
pnpm check-env               # validate .env.local
pnpm wallet:new              # mint agent keypair
pnpm balance [address]       # SOL + USDC balance
pnpm send-usdc <to> <amt>    # CLI USDC transfer
pnpm format                  # prettier write
vercel / vercel --prod       # deploy
```

## Addresses & clusters
| | Devnet | Mainnet-beta |
| --- | --- | --- |
| USDC mint | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |
| Explorer | explorer.solana.com?cluster=devnet | explorer.solana.com |
| RPC | https://api.devnet.solana.com | https://api.mainnet-beta.solana.com |

USDC decimals: **6** (held in Associated Token Accounts, not the wallet
address itself). x402 facilitator (devnet + mainnet): `https://facilitator.payai.network`.

## Faucets
- Solana devnet SOL — https://faucet.solana.com
- Solana devnet USDC — https://faucet.circle.com (select "Solana Devnet")

## Copy-paste snippets

**USDC checkout card**
```tsx
import { UsdcPayment } from "@/components/payment/usdc-payment";
<UsdcPayment recipient="Base58Address..." amount="2.50" label="Buy Report" />
```

**Wallet state**
```tsx
const { address, isConnected, login, logout } = useWallet();
const { formatted } = useUsdcBalance(address);
```

**Programmatic payment**
```tsx
const { pay, status, explorerUrl } = usePayment();
await pay("Base58RecipientAddress", "1.00");
```

**Build a USDC transfer instruction (raw)**
```ts
import { buildUsdcTransferInstruction } from "@/lib/usdc";
const ix = await buildUsdcTransferInstruction(fromPubkey, toPubkey, "1.5");
// → add to a Transaction, then signAndSendTransaction via the connected wallet
```

**Agent pays an x402 endpoint (server)**
```ts
import { payingFetch, decodePaymentResponse } from "@/lib/x402";
const res = await payingFetch()("https://api.example.com/paid");
const settlement = decodePaymentResponse(res.headers.get("payment-response"));
```

**Gate a route with x402** — x402-solana ships no Next.js middleware helper;
implement extract/verify/settle directly in the route handler (see
`src/app/api/premium/route.ts`)
```ts
import { X402PaymentHandler } from "x402-solana/server";
const x402 = new X402PaymentHandler({ network, treasuryAddress: payTo, facilitatorUrl });
const requirements = await x402.createPaymentRequirements(
  { amount: "50000", asset: { address: usdcMint().toBase58(), decimals: 6 }, description: "..." },
  resourceUrl,
);
```

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
  body: JSON.stringify({ signature, expectedTo, minAmount: "1.0" }),
});
```

## Editor snippet prefixes
`rcc` client component · `route` API route · `pay` payment card · `usewallet` wallet hook ·
`aitool` AI tool.
