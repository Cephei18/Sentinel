# @sentinel-hq/sdk

Give an AI agent a scoped budget, check every payment against it before the
money moves, and let an explainable trust score decide how much autonomy it
earns next. This package is a thin HTTP client for the hosted Sentinel API:
the actual guardrail and scoring logic runs on the server, not in your
process, which is what makes it a real check instead of a client-side
suggestion.

## Install

```bash
npm install @sentinel-hq/sdk
```

## Usage

```ts
import { Sentinel } from "@sentinel-hq/sdk";

const sentinel = new Sentinel({ apiKey: process.env.SENTINEL_API_KEY! });

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
  // You execute the real payment through your own wallet/x402 code.
  // Sentinel never holds your keys.
  const txHash = await payViaYourOwnRail(/* ... */);

  await sentinel.recordEvent(agent.id, {
    kind: "payment_success",
    label: "Paid for a data API call",
    amountUsdc: 0.5,
    category: "data",
    txHash,
  });
} else {
  console.log("Blocked:", verdict.reason);
}

const { score, grade } = await sentinel.agents.trust(agent.id);
```

## Why check, then record (not one call)

Sentinel never executes payments for you: your agent's key stays yours. The
two-step shape (`check` before you pay, `recordEvent` after) mirrors exactly
how the check-and-settle flow already works internally in the product, and
means Sentinel's guardrail never needs signing authority over anything.

## API

- `sentinel.agents.create(input)` — create an agent with a scoped budget.
- `sentinel.agents.get(agentId)` — agent + current trust score + spend summary.
- `sentinel.agents.trust(agentId)` — just the trust score.
- `sentinel.agents.events(agentId)` — the agent's audit trail.
- `sentinel.check(agentId, { amountUsdc, category })` — the guardrail. Read-only.
- `sentinel.recordEvent(agentId, input)` — append a settlement/failure/task/block event.

Errors are thrown as `SentinelError` (`.status`, `.body` carry the raw
response) for any non-2xx response.
