# Observability

> What we can see today, and the observability architecture we build toward.
> For Sentinel, observability is not ops hygiene — the audit trail is the
> product (`context/sentinel.md` #5).

## Today (v1)

- **In-product observability is the app itself**: activity feeds (per-agent +
  global) over the event log, trust-delta toasts with reasons, the org graph,
  `trustDelta` stamped on every event. This is genuinely good — the *domain*
  is fully observable.
- **System observability is near-zero**: `console.error` for env validation,
  `/api/health` for liveness, Vercel's default function logs. No structured
  logging, no tracing, no metrics, no alerting. Acceptable for a client-state
  demo; first real gap the moment a server holds state.

## Principles (target)

1. **Two planes, one correlation id.** The *domain* plane (agent events,
   decisions, settlements — the append-only log) and the *system* plane
   (traces, metrics, errors). Every domain event carries the trace context
   (`traceparent`) of the request that produced it.
2. **Standards, not inventions:** OpenTelemetry GenAI semantic conventions
   (`invoke_agent`, `execute_tool` spans, `gen_ai.*` attributes) for all agent
   telemetry; W3C Trace Context end-to-end (also formalized in MCP's 2026-07
   spec). Pin the semconv version and record it per event.
3. **Evidence-grade logging:** decision records persist their full input set
   (authorization, ledger projection, policy version) with the verdict —
   replayable by construction. PII redacted before write.
4. **The log's integrity is monitored** like uptime: hash-chain verification
   job, alert on divergence; later Merkle roots anchored via EAS on Base.

## Rollout (matches ROADMAP)

- **M2:** structured JSON logs (pino-class) with request ids; OTel SDK on API
  routes; error tracking (Sentry-class — note the name irony); decision
  records with full inputs.
- **M4:** per-decision metering (doubles as the billing meter); SDK propagates
  trace context from customer agents into our spans.
- **M6:** OTel GenAI conformance for customer-facing traces; audit export
  bundles; hash-chain verification endpoint + scheduled job; anchoring.
- **M10:** anomaly advisories consume the same event stream (no side channel).

## Metrics that matter (define at M2, watch from day one)

Product: decisions/day, block rate + top block reasons, settlement success
rate, trust-score distribution + movement, time-to-Trusted tier.
System: decision-endpoint p99 (the hot path — policy eval must stay
in-memory), event-append lag, RPC/facilitator error rates, wallet balances
(alert threshold), hash-chain verification status.
