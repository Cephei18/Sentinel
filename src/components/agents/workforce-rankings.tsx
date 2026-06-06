"use client";

import Link from "next/link";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AgentAvatar } from "@/components/agents/agent-avatar";
import { useAgents } from "@/hooks/use-agents";
import { autonomyFor, type AutonomyTier } from "@/lib/agents/governance";
import type { Agent } from "@/lib/agents/types";

function tierVariant(tier: AutonomyTier): "success" | "brand" | "warning" {
  return tier === "Autonomous" ? "success" : tier === "Trusted" ? "brand" : "warning";
}

function Row({ agent, score, note }: { agent: Agent; score: number; note?: string }) {
  const tier = autonomyFor(score).tier;
  return (
    <Link
      href={`/agents/${agent.id}`}
      className="hover:bg-surface-2/60 flex items-center justify-between gap-2 rounded-lg px-2 py-1.5"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <AgentAvatar name={agent.name} seed={agent.avatarSeed} size={28} />
        <div className="min-w-0">
          <p className="truncate text-sm leading-tight font-medium">{agent.name}</p>
          <p className="text-muted truncate text-xs">{note ?? tier}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant={tierVariant(tier)}>{tier}</Badge>
        <span className="w-6 text-right text-sm font-semibold tabular-nums">{score}</span>
      </div>
    </Link>
  );
}

/** Founder-level read on the workforce: who to back, who to watch. */
export function WorkforceRankings() {
  const { agents, scoreFor } = useAgents();

  const ranked = agents
    .map((a) => ({ agent: a, score: scoreFor(a).score }))
    .sort((x, y) => y.score - x.score);

  const top = ranked.slice(0, 3);
  const watch = ranked.filter(({ agent, score }) => score < 66 || agent.status !== "active");

  const noteFor = (agent: Agent, score: number) =>
    agent.status === "revoked"
      ? "Revoked"
      : agent.status === "paused"
        ? "Paused"
        : score < 55
          ? "Low reliability — reduce budget"
          : "Needs monitoring";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workforce intelligence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div>
          <p className="text-muted mb-1 flex items-center gap-1.5 text-xs font-medium">
            <TrendingUp className="text-success size-3.5" /> Top performers
          </p>
          {top.length === 0 ? (
            <p className="text-muted px-2 py-1.5 text-sm">No workers yet.</p>
          ) : (
            top.map(({ agent, score }) => <Row key={agent.id} agent={agent} score={score} />)
          )}
        </div>

        <div className="border-border/60 border-t pt-3">
          <p className="text-muted mb-1 flex items-center gap-1.5 text-xs font-medium">
            <AlertTriangle className="text-warning size-3.5" /> Watchlist
          </p>
          {watch.length === 0 ? (
            <p className="text-muted px-2 py-1.5 text-sm">All workers healthy.</p>
          ) : (
            watch.map(({ agent, score }) => (
              <Row key={agent.id} agent={agent} score={score} note={noteFor(agent, score)} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
