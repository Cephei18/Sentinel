# Research Notes

> Living research file. Two sections: Technology (stack Sentinel builds on) and
> Market (competitors, timing). Full-length reports summarized here; re-verify
> flagged items before quoting externally. Last updated 2026-07-03.

---

## Technology landscape (researched 2026-07-03)

### x402 — action required in this repo
- **x402 V2 is current** (launched 2025-12-11; independent x402 Foundation with
  Coinbase + Cloudflare under Linux Foundation). Plug-in architecture, payment
  data in headers, wallet-based identity, discovery extension, CAIP multi-chain.
- **Our packages (`x402-next`, `x402-fetch`, `x402-axios` v1.2.0) are the
  deprecated V1 line** (security patches only). Current npm org: `@x402/core`,
  `@x402/fetch` (~2.1.0), `@x402/next`, `@x402/evm`, `@x402/mcp`. → Migration is
  a roadmap item (M1/M2).
- Mainnet is now the norm (Base + Solana dominate). Facilitators beyond CDP:
  PayAI, Cloudflare, thirdweb, x402.rs. CDP free tier 1,000 tx/mo.
- Discovery: x402 Bazaar (CDP) + protocol-level discovery in V2; exposes an MCP
  server.
- **Protocol gaps = Sentinel's surface**: no refunds/disputes/subscriptions; no
  payment↔delivered-work atomicity (A402 critique, arXiv 2603.01179); no spend
  governance. Payments are final — an authorization bug is unrecoverable.

### MCP
- Stable spec 2025-06-18; **major release 2026-07-28 (imminent)**: stateless
  architecture, elicitation via multi-round-trip (first-class human-in-the-loop),
  `Mcp-Method` routing headers, W3C Trace Context documented, OAuth hardening,
  extensions framework (Tasks, Apps).
- Tool authorization is delegated to hosts/gateways — exactly where Sentinel
  attaches. Gateway market is crowded (Docker, Kong, AWS AgentCore, Cloudflare,
  IBM ContextForge; security-focused: MintMCP, Lasso). **Don't build MCP
  plumbing; be the trust/spend policy layer that plugs into it.**

### Agent identity & delegation
- IETF OAuth-for-agents drafts (`requested_actor`/`actor_token`) still moving —
  mirror semantics, don't wait.
- **Privy policy engine** (our wallet layer): policies/rules/conditions enforced
  **at signing time** — spending limits, per-tx caps, allowlists. This is the
  non-bypassable backstop under Sentinel's own checks. Coinbase CDP has an
  equivalent (TEE policies, Spend Permissions, Agentic Wallets) — pick Privy to
  avoid split-brain policy.
- **ERC-8004 "Trustless Agents"** (Draft): identity/reputation/validation
  registries; reputation scoring deliberately off-chain (Sybil-vulnerable
  on-chain). Treat as future identity/anchoring format, not scoring.
- **EAS is predeployed on Base** — cheap attestation anchor for trust snapshots
  and log Merkle roots.
- A2A v1.0 stable (signed Agent Cards) for future cross-org agent identity.

### Policy engines
- Consensus for agents: **PBAC** (policies decoupled from code; RBAC+ABAC
  attributes evaluated per action at runtime).
- **Cedar** best fits Sentinel: deterministic, formally analyzable, 42–60×
  faster than Rego, returns the determining policy (→ explainability);
  `@cedar-policy/cedar-wasm` runs in Node. Caveat: no arbitrary computation —
  spend aggregates computed outside, passed as attributes.
- MVP-defensible alternative: small hand-rolled deterministic evaluator that
  logs its full evaluation trace (we effectively have a proto-version of this).

### Observability & audit
- **OTel GenAI semconv** (`invoke_agent`, `execute_tool`, `gen_ai.*` attrs) is
  the only game in town; agent spans still experimental — pin semconv version
  per event.
- Tamper-evident logging: hash chain now → Merkle batching → external anchoring
  (EAS on Base) later. Sigstore Rekor v2 / Trillian-Tessera exist for
  transparency-log scale.
- **SOC 2 for AI (2026)**: auditors flag "privileged agent action with no
  attributable human request" as a major gap; want tamper-evident
  identity-bound logs, PII redaction before write, versioned policy governance,
  kill switch, human override. Sentinel's event log maps directly to this
  evidence surface.

### Reputation research
- Foundations: EigenTrust (global/transitive), Beta reputation (Bayesian local).
  For Sentinel: **Beta-style per-dimension scoring + exponential time decay**,
  deterministic and replayable — avoid global iterative models (unexplainable,
  costly to replay).
- Sybil resistance: weight evidence by settled economic flow (x402 receipts are
  expensive to forge) — design evidence-weighting now (payment-backed >
  self-reported) even while the network is closed.
- Taxonomy (arXiv 2511.03434): mechanisms = brief/claim/proof/stake/reputation/
  constraint. Sentinel = constraint + reputation, proof via logs.
- Explainable trust evaluation is now a named research paradigm — validates the
  core product thesis.

### Architecture patterns
- **Event sourcing is the right foundation** (append-only Postgres + hash chain
  is enough; no EventStoreDB needed). ESAA (arXiv 2602.23193): hash-verified
  deterministic projections to detect replay divergence — apply to trust scores.
- Determinism rules: versioned scoring algorithm, canonical serialization, no
  wall-clock/randomness in projections (we already follow the last one).
- **Enforcement topology (target): hybrid** — Sentinel proxy/route makes the
  authoritative decision + audit record; **Privy signing-time policy is the
  hard backstop** (even a bypassed proxy can't sign out-of-policy spends).
  Gateway-side > SDK-side for anything security-critical.

### Recommended target stack (from research)
`@x402/*` v2 + CDP facilitator on Base → Privy server wallets w/ policy backstop
→ Sentinel decision layer (deterministic evaluator now, Cedar when policy count
grows) → hash-chained event log, EAS-anchored Merkle roots → Beta-reputation
w/ decay projections → OTel GenAI traces.

### External risks
MCP spec churn (2026-07-28), `@x402` package velocity, ERC-8004 still Draft,
OTel agent attrs experimental. All absorbable via version pinning + adapters.

### Unverified items (re-check before external use)
x402 volume stats (~69k agents / ~165M tx / ~$50M), CDP Agentic Wallets launch
date, ERC-8004 mainnet date, March-2026 x402 SDK CVE, "93% unscoped keys"
survey, AWS CloudFront x402 date.

---

## Market landscape (researched 2026-07-03)

### Direct competitors (buyer-side agent money movement w/ controls)
- **Catena Labs** — highest overlap. AI-native regulated financial institution;
  guardrails, agent identity, receipts, stablecoins; open-source Agent Commerce
  Kit. $18M seed (a16z crypto, 2025-05) + $30M Series A (2026-05); **filed for
  OCC national trust bank charter 2026-05**. Their moat = regulation; ours must
  be developer-first speed + trust-score/autonomy layer they don't productize.
- **Coinbase Agentic Wallets / CDP Spend Permissions** (launched ~2026-02) —
  **platform-absorption risk**: session caps, per-tx limits, KYT, gasless Base,
  native x402 — our budget/per-tx features exist natively in our own rail.
  They do NOT have: category scoping, explainable trust scoring, trust-gated
  autonomy progression, workforce framing.
- **Skyfire** ($9.5M) — "Agent Trust Stack", KYA identity tokens, KYAPay;
  pivoted seller/merchant-side verification (Visa, Experian, Rye partnerships).
- **Payman AI** (~$13.8M; Visa, Coinbase Ventures) — policy-governed agent
  banking on **fiat** rails for regulated institutions.
- **Halliday** ($26M, a16z crypto) — immutable execution-layer guardrails for
  onchain agents; no trust scores or workforce abstraction.
- **Crossmint** ($23.6M, Ribbit) — enterprise agent wallets w/ basic limits;
  partner as much as competitor. **Nevermined** (~$7M) — seller-side metering
  (mirror image; Privy partner).

### Enterprise IAM lens
- **Microsoft Entra Agent ID (GA 2026-04) + Agent 365 (GA 2026-05, $15/user/mo)**
  — owns enterprise agent identity/registry; no financial authority or payment
  blocking, but anchors buyer expectations for "agent governance."
- **Okta/Auth0 Cross App Access** (rolling out Jul–Aug 2026) — token
  governance, complementary. NHI/agent-security startups (Noma $100M, WitnessAI
  $58M, Astrix, Token, Zenity…) crowd the *message*, not the spend-control niche.
- **Natoma → acquired by Snowflake (2026-05-27, ~1yr after $7M seed)** — best
  exit comp: pre-action policy enforcement for agents gets bought fast.

### Category validation & signals
- Deloitte: 74% of orgs plan agentic AI in 2 yrs; only 21% have mature agent
  governance; **35% couldn't immediately pull the plug on a rogue agent**.
  Kiteworks: most orgs can monitor agents but **cannot stop them** — exactly
  our enforcement pitch. Gartner: >40% agentic projects canceled by end-2027,
  citing inadequate risk controls; warns of "agent washing" (~130 truly agentic
  vendors of thousands).
- Agent-workforce category is monetizing: Salesforce Agentforce >$500M ARR;
  Cognition $1B @ $25B pre (2026-05); **none ship per-agent financial authority**.
- Incident tailwinds: Replit prod-DB deletion (2025-07); Ramp: customer AI
  token spend up 13× since 2025-01, budgets blown in months.
- Funding flows to every adjacent layer, **no large round yet for buyer-side
  spend-control + trust scoring** — window open, closing (see Natoma).

### Payment-rail landscape
- **x402**: moves value; Linux Foundation neutral (2026-04); AWS Bedrock
  AgentCore, Cloudflare; but daily tx fell ~92% from Dec-2025 speculative peak
  (~731k/day → ~57k/day Feb-2026); real cumulative volume ~$50M. 
- **Google AP2** (→ FIDO Alliance): signed per-intent mandates, rail-agnostic;
  v0.2.0 added "Human Not Present". **Stripe/OpenAI ACP**: consumer checkout in
  chat. **Visa Trusted Agent Protocol / Mastercard Agent Pay**: tokenized
  consent on card rails. **ERC-8004**: empirical study — reputation registry
  currently unusable (59–91% Sybil reviewers).
- **The gap none of them fill = Sentinel's layer**: persistent budgets across
  many transactions, category scoping, expiry, behavioral trust accrual,
  autonomy graduation — the employer-side control plane. AP2 mandates are
  per-intent, not per-workforce.
- Hedge required: multi-rail abstraction (x402 + AP2 mandates + virtual cards)
  so we're not stranded on one rail.

### Differentiation (honest)
Strong: buyer-side workforce-framed governance; deterministic explainable
trust from an immutable log (defensible vs Sybil-broken open registries;
doubles as insurance-underwriting data — AIUC partnership angle); trust-gated
autonomy tiers (no one productizes); enforcement-not-observability.
Thin: budget caps alone are table stakes (Coinbase ships them); explainable
scoring is mechanically replicable — moat forms only from accumulated
cross-employer behavioral history.

### Threats
1. **Name collision (verified, serious)** — Microsoft Sentinel ("security
   platform for the agentic era", 2025-09), SentinelOne, Sentinel SCA, multiple
   OSS/hackathon "Sentinel" agent-governance projects. Rename before launch.
2. Platform absorption (Coinbase/Circle/Stripe ship controls natively).
3. Out-funded credentialed rivals (Catena $48M + charter; Microsoft/Okta own
   enterprise identity).
4. x402 single-rail dependence (volume down 92% from peak).
5. Trust-score cold start; liability when a score is wrong; metric-gaming.
6. Procurement mismatch: onchain USDC control plane reads exotic to
   Entra/Okta-standardized enterprises → initial buyer is crypto-native/agent-
   native startups.
7. Standards commoditization (AP2/FIDO could standardize scoped authority).

### Unverified items (re-check before external use)
x402 Foundation LF member list, Stripe-routing-on-x402 (2026-02), Langfuse→
ClickHouse acquisition, $3.6B agentic-security funding total, $201.9B agentic
spend figure, Payman round split, x402 volume figures (sources conflict).

### Key sources (market)
- Catena: pymnts.com/news/investment-tracker/2025/catena-labs-raises-18-million… · fortune.com/2026/05/20/catena-labs-series-a-sean-neville-ai-native-bank/
- Coinbase Agentic Wallets: coinbase.com/developer-platform/discover/launches/agentic-wallets · docs.cdp.coinbase.com/wallets/using-wallets/spend-permissions
- Skyfire: theblock.co/post/322742 · businesswire.com/news/home/20250626772489/en/
- Natoma→Snowflake: forbes.com/sites/janakirammsv/2026/05/31/snowflake-buys-natoma…
- Entra Agent ID / Agent 365: learn.microsoft.com/en-us/entra/agent-id/ · microsoft.com/en-us/security/blog/2026/05/01/…agent-365-ga…
- Okta XAA: okta.com/newsroom/press-releases/okta-introduces-cross-app-access…
- Gartner 40% cancellations: gartner.com/en/newsroom/press-releases/2025-06-25-…
- x402 Foundation: blog.cloudflare.com/x402/ · x402.org/writing/x402-v2-launch
- AP2: cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol · blog.google/…/agent-payments-protocol-fido-alliance/
- ACP: stripe.com/newsroom/news/stripe-openai-instant-checkout
- ERC-8004 Sybil study: arxiv.org/pdf/2606.26028
- AIUC insurance: fortune.com/2025/07/23/ai-agent-insurance-startup-aiuc…
- Replit incident: fortune.com/2025/07/23/ai-coding-tool-replit-wiped-database…
- Name collision: microsoft.com/en-us/security/blog/2025/09/30/…microsoft-sentinel/ · sentinelsca.com

(Technology-section sources are embedded inline above.)
