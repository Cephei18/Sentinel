# Trust Model

> How Sentinel turns agent behaviour into an explainable trust score, and the
> principles that must survive every future redesign. Implementation:
> [`src/lib/agents/reputation.ts`](../src/lib/agents/reputation.ts).

## Invariants (do not break these)

1. **Derived, never stored.** Trust is recomputed from the immutable event log on
   every read. There is no mutable `score` column anywhere. This makes the score
   reproducible, auditable, and immune to drift or tampering short of tampering
   with the log itself.
2. **Deterministic.** Same events ⇒ same score. No randomness, no wall-clock
   dependence inside the scorer, no hidden state.
3. **Explainable.** Every factor carries a plain-language `detail`, and every
   event can be stamped with the exact `trustDelta` it caused (computed by
   diffing score-before vs score-after, `projectScoreDelta`).
4. **Confidence-aware.** A perfect record over 2 events ≠ over 50. The score
   reports `low / medium / high` confidence from sample size (settled payments:
   <4 low, 4–11 medium, ≥12 high).
5. **Cautious baseline.** New agents start from a neutral-cautious baseline
   (0.72 per factor ⇒ score 72 = grade BBB / Trusted tier, low confidence) and
   must *earn* movement in either direction.

## The score (v1, as implemented)

`score = round(100 × Σ factor.value × factor.weight)` over four factors:

| Factor | Weight | Computation (v1) |
|---|---:|---|
| **Payment reliability** | 0.40 | `successes / (successes + failures)`; baseline if no attempts |
| **Spending discipline** | 0.25 | starts at 1.0; −0.25 if budget utilization > 90%; −0.20 per over-per-tx-limit settle; −0.06 per guardrail block; clamped 0..1 |
| **Task completion** | 0.20 | `tasks / max(successes, tasks)`; baseline if no payments |
| **Consistency** | 0.15 | `baseline + min(0.28, successes × 0.025) − failures × 0.08`, clamped |

Grades: AAA ≥92, AA ≥84, A ≥75, BBB ≥66, BB ≥55, B ≥42, else C.

### Event kinds that feed the score

`payment_success`, `payment_failed`, `limit_blocked`, `task_completed`
(`authorized` is recorded for audit but does not move the score).

## Design rationale

- **Why a weighted linear blend?** Explainability. Each factor's contribution is
  literally `value × weight × 100` points and can be shown to a human next to a
  reason string. Any replacement model must preserve a per-factor attribution.
- **Why is a guardrail block only a mild penalty (−0.06 discipline)?** A block
  means the system *worked* — the agent attempted something out of scope, but no
  value moved. It is a signal about the agent's intent calibration, not a loss
  event. Failures that waste value (reverted payments) cost more.
- **Why do successes cap consistency gains (+0.28)?** Longevity should asymptote;
  otherwise volume alone buys unbounded trust (a classic reputation-gaming vector).

## Known weaknesses of v1 (candidates for Trust Engine v2)

These are documented, deliberate hackathon simplifications — see
`docs/KNOWN_LIMITATIONS.md` for the full list:

- **No time decay.** A failure from 6 months ago weighs the same as yesterday's.
  v2 should exponentially decay event influence.
- **No amount weighting in reliability.** A failed $0.01 payment counts the same
  as a failed $500 one.
- **Self-reported task completion.** `task_completed` events are recorded by the
  same flow that made the payment; nothing verifies the work. v2 needs
  counterparty attestation or verifiable outputs.
- **Sybil/gaming exposure.** An agent can farm trust with many tiny successful
  self-payments. v2 needs amount-weighted sample sizes, counterparty diversity,
  and rate limits at minimum.
- **Discipline can go negative-then-clamp.** Multiple compounding penalties
  saturate at 0 and lose resolution between "bad" and "catastrophic."
- **Penalty curves are under-calibrated.** Found via the seed canary test
  (2026-07-03): an agent with 50% payment reliability and two guardrail blocks
  still scored ~72 — Trusted, cleared to delegate. v2 needs a calibration pass
  against intended personas (see `memory/decision-log.md` D-016).
- **Client-computed deltas.** Because the log lives client-side today, trust is
  only as trustworthy as the log's custody. The real fix is server custody of the
  event log (see `docs/ARCHITECTURE.md` target state).

## Where v2 plugs in

The scorer's shape — `(agent, events) → { score, factors[], confidence }` — is the
stable contract. On-chain attestations, counterparty ratings, anomaly-model
*advisory* signals, and time decay all enter as additional factors or factor
inputs, keeping per-factor explainability intact. The deterministic core remains
the score of record; ML may flag, but never silently score.
