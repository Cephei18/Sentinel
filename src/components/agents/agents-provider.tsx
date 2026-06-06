"use client";

/**
 * Client-side agent store — the Phase 1 system of record.
 *
 * Holds the agent roster + the immutable event log in React state, persisted to
 * localStorage so a demo survives refreshes. Trust scores and spend are *derived*
 * from the event log via the pure reputation engine, never stored.
 *
 * This is the deliberate seam: in a later phase the same surface (agents, events,
 * createAgent, recordEvent) is backed by an API + Postgres instead of localStorage.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Agent,
  AgentEvent,
  AgentStatus,
  Authorization,
  DraftEvent,
  SpendSummary,
} from "@/lib/agents/types";
import { buildSeed } from "@/lib/agents/seed";
import {
  computeSpend,
  computeTrustScore,
  projectScoreDelta,
  type TrustScore,
} from "@/lib/agents/reputation";

const STORAGE_KEY = "sentinel.store.v1";

export interface CreateAgentInput {
  name: string;
  model: string;
  authorization: Authorization;
}

interface StoreShape {
  agents: Agent[];
  events: AgentEvent[];
}

interface AgentsContextValue {
  /** True once the store has hydrated from storage (avoids SSR/hydration flicker). */
  ready: boolean;
  agents: Agent[];
  events: AgentEvent[];
  getAgent: (id: string) => Agent | undefined;
  createAgent: (input: CreateAgentInput) => Agent;
  recordEvent: (input: Omit<AgentEvent, "id" | "at"> & { at?: string }) => AgentEvent;
  /** Record an agent-to-agent payment as a linked payer/payee event pair. */
  payAgent: (args: {
    payerId: string;
    payeeId: string;
    amountUsdc: number;
    service: string;
  }) => void;
  setStatus: (agentId: string, status: AgentStatus) => void;
  /** Re-allocate an agent's total budget (records an authorization event). */
  setBudget: (agentId: string, budgetUsdc: number) => void;
  scoreFor: (agent: Agent) => TrustScore;
  spendFor: (agent: Agent) => SpendSummary;
  /** Preview the trust-score delta a set of (unsaved) draft events would cause. */
  projectDelta: (agentId: string, added: DraftEvent[]) => number;
  reset: () => void;
}

const AgentsContext = createContext<AgentsContextValue | null>(null);

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Math.floor(performance.now() * 1000).toString(36)}`;
}

/** Load from storage or fall back to the demo seed. Runs only in the browser. */
function loadInitial(): StoreShape {
  if (typeof window === "undefined") return { agents: [], events: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StoreShape;
  } catch {
    /* corrupt / unavailable — fall through to seed */
  }
  return buildSeed(Date.now());
}

export function AgentsProvider({ children }: { children: ReactNode }) {
  // This subtree only ever renders client-side (gated behind the mount check in
  // Providers), so hydrating the store in the initializer is safe and avoids an
  // effect-driven setState on mount.
  const [store, setStore] = useState<StoreShape>(loadInitial);
  const ready = typeof window !== "undefined";

  // Persist on every change.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      /* quota / private mode — non-fatal for a demo */
    }
  }, [store]);

  const recordEvent = useCallback<AgentsContextValue["recordEvent"]>((input) => {
    const event: AgentEvent = {
      ...input,
      id: newId("ev"),
      at: input.at ?? new Date().toISOString(),
    };
    setStore((s) => {
      const agent = s.agents.find((a) => a.id === event.agentId);
      // Stamp the trust impact so the activity log can explain "+3 / -5 Trust".
      const stamped =
        agent && event.trustDelta === undefined
          ? { ...event, trustDelta: projectScoreDelta(agent, s.events, [event]) }
          : event;
      return { ...s, events: [stamped, ...s.events] };
    });
    return event;
  }, []);

  const createAgent = useCallback<AgentsContextValue["createAgent"]>((input) => {
    const agent: Agent = {
      id: newId("agt"),
      name: input.name,
      model: input.model,
      avatarSeed: input.name.toLowerCase() + newId("s"),
      createdAt: new Date().toISOString(),
      status: "active",
      authorization: input.authorization,
    };
    const authEvent: AgentEvent = {
      id: newId("ev"),
      agentId: agent.id,
      kind: "authorized",
      label: `Authorized with a $${input.authorization.budgetUsdc} budget`,
      at: new Date().toISOString(),
    };
    setStore((s) => ({
      agents: [agent, ...s.agents],
      events: [authEvent, ...s.events],
    }));
    return agent;
  }, []);

  const payAgent = useCallback<AgentsContextValue["payAgent"]>(
    ({ payerId, payeeId, amountUsdc, service }) => {
      const at = new Date().toISOString();
      // Payer spends; payee renders the service. Settlement here is simulated
      // coordination (no on-chain hash) — the single-agent x402 purchase is the
      // real-money path. Both events feed each agent's trust + the graph edge.
      setStore((s) => {
        const payee = s.agents.find((a) => a.id === payeeId);
        const payer = s.agents.find((a) => a.id === payerId);
        const payEvent: AgentEvent = {
          id: newId("ev"),
          agentId: payerId,
          kind: "payment_success",
          label: `Paid ${payee?.name ?? "agent"} for ${service}`,
          amountUsdc,
          category: "services",
          counterpartyId: payeeId,
          at,
        };
        const deliverEvent: AgentEvent = {
          id: newId("ev"),
          agentId: payeeId,
          kind: "task_completed",
          label: `Delivered ${service} to ${payer?.name ?? "agent"}`,
          category: "services",
          counterpartyId: payerId,
          at,
        };
        if (payer) payEvent.trustDelta = projectScoreDelta(payer, s.events, [payEvent]);
        if (payee) deliverEvent.trustDelta = projectScoreDelta(payee, s.events, [deliverEvent]);
        return { ...s, events: [payEvent, deliverEvent, ...s.events] };
      });
    },
    [],
  );

  const setStatus = useCallback<AgentsContextValue["setStatus"]>((agentId, status) => {
    setStore((s) => ({
      ...s,
      agents: s.agents.map((a) => (a.id === agentId ? { ...a, status } : a)),
    }));
  }, []);

  const setBudget = useCallback<AgentsContextValue["setBudget"]>((agentId, budgetUsdc) => {
    setStore((s) => {
      const agent = s.agents.find((a) => a.id === agentId);
      if (!agent) return s;
      const event: AgentEvent = {
        id: newId("ev"),
        agentId,
        kind: "authorized",
        label: `Budget re-allocated to $${budgetUsdc}`,
        at: new Date().toISOString(),
      };
      return {
        agents: s.agents.map((a) =>
          a.id === agentId ? { ...a, authorization: { ...a.authorization, budgetUsdc } } : a,
        ),
        events: [event, ...s.events],
      };
    });
  }, []);

  const reset = useCallback(() => setStore(buildSeed(Date.now())), []);

  const value = useMemo<AgentsContextValue>(
    () => ({
      ready,
      agents: store.agents,
      events: store.events,
      getAgent: (id) => store.agents.find((a) => a.id === id),
      createAgent,
      recordEvent,
      payAgent,
      setStatus,
      setBudget,
      scoreFor: (agent) => computeTrustScore(agent, store.events),
      spendFor: (agent) => computeSpend(agent, store.events),
      projectDelta: (agentId, added) => {
        const agent = store.agents.find((a) => a.id === agentId);
        return agent ? projectScoreDelta(agent, store.events, added) : 0;
      },
      reset,
    }),
    [ready, store, createAgent, recordEvent, payAgent, setStatus, setBudget, reset],
  );

  return <AgentsContext.Provider value={value}>{children}</AgentsContext.Provider>;
}

export function useAgents(): AgentsContextValue {
  const ctx = useContext(AgentsContext);
  if (!ctx) throw new Error("useAgents must be used within <AgentsProvider>");
  return ctx;
}
