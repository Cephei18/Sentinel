# Deployment

> How to ship v1, and the deployment posture rules. Target: Vercel (config in
> `vercel.json`).

## Current setup

- **Vercel**, pnpm install/build, Node runtime for API routes;
  `maxDuration: 30` on `/api/agent` and `/api/x402/buy`.
- No database, no queues, no cron — the app is stateless server-side (all
  demo state is in visitors' browsers).
- Not currently known to be deployed to a production URL.

## Deploy checklist (demo deployment)

1. `pnpm preflight && pnpm test && pnpm build` locally — all green.
2. Set env in Vercel: `NEXT_PUBLIC_PRIVY_APP_ID`,
   `NEXT_PUBLIC_SOLANA_CLUSTER=devnet`, one LLM key, and — only if you want
   live settlement — `AGENT_PRIVATE_KEY` (freshly minted, minimally funded,
   **devnet**) + `X402_PAY_TO_ADDRESS`. Set `NEXT_PUBLIC_APP_URL` to the
   deployed URL (the buyer route fetches itself through it).
3. Dedicated RPCs (`SOLANA_RPC_URL`/`NEXT_PUBLIC_SOLANA_RPC_URL`) — public RPC
   rate limits are the #1 cause of flaky demos.
4. Verify `/api/health` shows the expected provider booleans.
5. Demo-mode check: open in a private window with Privy id *removed* from a
   preview deployment if you need the wallet-free variant.

## Posture rules (until M2 lands)

- **Never deploy a funded mainnet `AGENT_PRIVATE_KEY`.** `/api/x402/buy` is
  unauthenticated (KNOWN_LIMITATIONS #5); anything funded WILL be drained.
- Testnet key: fund with cents, rotate after public demos
  (`pnpm wallet:new`, `pnpm balance`).
- The x402 gate defaults open when `X402_PAY_TO_ADDRESS` is unset — that is
  the intended local/demo behavior, not a bug.

## Environments (target, M2+)

| Env | Cluster | Data | Purpose |
|---|---|---|---|
| preview (per-PR) | devnet | ephemeral DB branch | review |
| staging | devnet | persistent staging DB | integration + demo |
| production | mainnet-beta | production DB, Privy server wallets | customers |

M2 adds: Postgres (Neon/Supabase-class, branchable), migrations in CI,
secrets via platform store only, CSP headers, structured logs. M6 adds:
log-integrity verification job + anchoring cadence (mechanism TBD — see
`docs/OBSERVABILITY.md` open question).
