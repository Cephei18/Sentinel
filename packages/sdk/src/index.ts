/**
 * Sentinel SDK — a thin HTTP client for the hosted API. All the guardrail
 * and trust-scoring logic runs server-side; this package only formats
 * requests and parses responses. It has no dependency on the rest of the
 * Sentinel repo (no React, no Next.js) so it can be published standalone.
 *
 * Two-step usage, deliberately mirroring how the product's own demo app
 * uses the engine internally: check first, then record what happened.
 *
 *   const sentinel = new Sentinel({ apiKey: "sk_..." });
 *   const verdict = await sentinel.check(agentId, { amountUsdc, category });
 *   if (verdict.allowed) {
 *     // caller executes the real payment through their own wallet/x402 code
 *     await sentinel.recordEvent(agentId, { kind: "payment_success", amountUsdc, category, txHash });
 *   }
 */

export type SpendCategory = "data" | "compute" | "storage" | "services";

export type AgentStatus = "active" | "paused" | "expired" | "revoked";

export interface CreateAgentInput {
  name: string;
  model: string;
  budgetUsdc: number;
  perTxLimitUsdc: number;
  /** ISO timestamp after which the authorization is no longer valid. */
  expiresAt: string;
  categories: SpendCategory[];
}

export interface Agent {
  id: string;
  name: string;
  model: string;
  avatarSeed: string;
  createdAt: string;
  status: AgentStatus;
  authorization: {
    budgetUsdc: number;
    perTxLimitUsdc: number;
    expiresAt: string;
    categories: SpendCategory[];
  };
}

export interface CheckRequest {
  amountUsdc: number;
  category: SpendCategory;
}

export type CheckResult = { allowed: true } | { allowed: false; reason: string };

/**
 * "authorized" events come from creating/updating an agent's grant, not from
 * recordEvent — this is for reporting what an agent *did*.
 */
export type RecordableEventKind =
  | "payment_success"
  | "payment_failed"
  | "task_completed"
  | "limit_blocked";

export interface RecordEventInput {
  kind: RecordableEventKind;
  label: string;
  amountUsdc?: number;
  category?: SpendCategory;
  txHash?: string;
  counterpartyId?: string;
}

export interface AgentEvent extends RecordEventInput {
  id: string;
  agentId: string;
  trustDelta?: number;
  at: string;
}

export interface TrustFactor {
  key: string;
  label: string;
  weight: number;
  value: number;
  contribution: number;
  detail: string;
}

export interface TrustScore {
  score: number;
  grade: string;
  confidence: "low" | "medium" | "high";
  factors: TrustFactor[];
  sampleSize: number;
}

export interface SpendSummary {
  spentUsdc: number;
  budgetUsdc: number;
  remainingUsdc: number;
  utilization: number;
}

/** Thrown for any non-2xx response. `status` and `body` carry the raw details. */
export class SentinelError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "SentinelError";
    this.status = status;
    this.body = body;
  }
}

export interface SentinelOptions {
  apiKey: string;
  /** Override the API base URL. */
  baseUrl?: string;
  /** Inject a custom fetch (used by tests; defaults to the global fetch). */
  fetch?: typeof fetch;
}

const DEFAULT_BASE_URL = "https://api.sentinel.dev/v1";

export class Sentinel {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: SentinelOptions) {
    if (!options.apiKey) throw new Error("Sentinel: apiKey is required.");
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.fetchImpl = options.fetch ?? fetch;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...init?.headers,
      },
    });
    const body: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const message =
        body && typeof body === "object" && "error" in body && typeof body.error === "string"
          ? body.error
          : `Sentinel API request failed (${res.status})`;
      throw new SentinelError(message, res.status, body);
    }
    return body as T;
  }

  agents = {
    /** Create an agent with a scoped authorization. */
    create: (input: CreateAgentInput): Promise<Agent> =>
      this.request<{ agent: Agent }>("/agents", {
        method: "POST",
        body: JSON.stringify(input),
      }).then((r) => r.agent),

    /** Fetch an agent plus its current derived trust score and spend summary. */
    get: (agentId: string): Promise<{ agent: Agent; trust: TrustScore; spend: SpendSummary }> =>
      this.request(`/agents/${agentId}`),

    /** Convenience: just the trust score. */
    trust: (agentId: string): Promise<TrustScore> =>
      this.request<{ trust: TrustScore }>(`/agents/${agentId}`).then((r) => r.trust),

    /** The audit trail for one agent. */
    events: (agentId: string): Promise<AgentEvent[]> =>
      this.request<{ events: AgentEvent[] }>(`/agents/${agentId}/events`).then((r) => r.events),
  };

  /** The guardrail: is this agent allowed to spend this amount, right now? Records nothing. */
  check(agentId: string, request: CheckRequest): Promise<CheckResult> {
    return this.request<CheckResult>(`/agents/${agentId}/check`, {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /** Record what actually happened after a check: a settlement, a failure, a completed task, or a block. */
  recordEvent(agentId: string, input: RecordEventInput): Promise<AgentEvent> {
    return this.request<{ event: AgentEvent }>(`/agents/${agentId}/events`, {
      method: "POST",
      body: JSON.stringify(input),
    }).then((r) => r.event);
  }
}
