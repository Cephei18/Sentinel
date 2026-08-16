# SDK Quickstart

The hosted API and SDK are a separate surface from the demo app
(`/dashboard`, `/graph`, `/agents/[id]`, still localStorage-backed). This is
what an external developer actually installs to govern their own agents.
See `docs/ARCHITECTURE.md` and `ROADMAP.md` (M2/M4) for how it fits the
rest of the product.

## 1. Get a database

The API needs a Postgres connection (Neon recommended, scales to zero):

- Via Vercel: `vercel integration add neon` (installs the Marketplace
  integration; accepting the terms happens once, in your browser), then
  `vercel env pull` to get `DATABASE_URL` into `.env.local`.
- Or directly at [neon.tech](https://neon.tech): create a project, copy the
  connection string into `.env.local` as `DATABASE_URL`.

## 2. Push the schema

```bash
pnpm db:push
```

This creates `orgs`, `api_keys`, `agents`, and `events` from
`src/lib/db/schema.ts`. Re-run it any time the schema changes.

## 3. Issue an API key

No self-serve signup yet — keys are issued by hand for early design
partners:

```bash
pnpm issue-api-key "Acme Inc"
```

Copy the printed key; it's hashed before storage and never shown again.

## 4. Use the SDK

```bash
npm install @sentinel-hq/sdk
```

```ts
import { Sentinel } from "@sentinel-hq/sdk";

const sentinel = new Sentinel({ apiKey: "sk_..." });

const agent = await sentinel.agents.create({
  name: "Scout",
  model: "gpt-4o-mini",
  budgetUsdc: 50,
  perTxLimitUsdc: 5,
  expiresAt: "2027-01-01T00:00:00.000Z",
  categories: ["data"],
});

const verdict = await sentinel.check(agent.id, { amountUsdc: 0.5, category: "data" });

if (verdict.allowed) {
  // You execute the real payment through your own wallet/x402 code —
  // Sentinel never holds your keys.
  await sentinel.recordEvent(agent.id, {
    kind: "payment_success",
    label: "Paid for a data API call",
    amountUsdc: 0.5,
    category: "data",
  });
} else {
  console.log("Blocked:", verdict.reason);
}
```

Full API reference: `packages/sdk/README.md`.

## 5. Verify the whole thing end to end

```bash
pnpm dev                 # in one terminal
pnpm sdk-smoke-test       # in another
```

Issues a throwaway org and key, creates an agent, checks a blocked and an
allowed spend, records a settlement, and confirms the trust score moved,
using the SDK package itself against the running dev server.
