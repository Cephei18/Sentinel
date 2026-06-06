"use client";

import { useState } from "react";
import { ShieldCheck, TrendingUp, Minus, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAgents } from "@/hooks/use-agents";
import { autonomyFor, budgetRecommendation } from "@/lib/agents/governance";
import { formatUsd } from "@/lib/utils";
import type { Agent } from "@/lib/agents/types";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Governance & performance — where trust becomes economic consequence:
 * an autonomy tier that gates delegation, an actionable budget recommendation,
 * and the operational metrics a founder uses to allocate capital.
 */
export function GovernanceCard({ agent }: { agent: Agent }) {
  const { events, scoreFor, spendFor, setBudget } = useAgents();
  const [nowMs] = useState(() => Date.now());

  const trust = scoreFor(agent);
  const spend = spendFor(agent);
  const autonomy = autonomyFor(trust.score);
  const rec = budgetRecommendation(agent, trust, spend);

  const tierVariant =
    autonomy.tier === "Autonomous" ? "success" : autonomy.tier === "Trusted" ? "brand" : "warning";

  // Performance metrics derived from this agent's event log.
  const mine = events.filter((e) => e.agentId === agent.id);
  const success = mine.filter((e) => e.kind === "payment_success").length;
  const failed = mine.filter((e) => e.kind === "payment_failed").length;
  const tasks = mine.filter((e) => e.kind === "task_completed").length;
  const collabs = mine.filter((e) => e.counterpartyId).length;
  const successRate =
    success + failed === 0 ? null : Math.round((success / (success + failed)) * 100);
  const ageDays = Math.max(1, (nowMs - new Date(agent.createdAt).getTime()) / DAY);
  const velocity = spend.spentUsdc / ageDays;

  const recIcon =
    rec.direction === "increase" ? TrendingUp : rec.direction === "reduce" ? TrendingDown : Minus;
  const recColor =
    rec.direction === "increase"
      ? "text-success"
      : rec.direction === "reduce"
        ? "text-danger"
        : "text-muted";

  const metrics = [
    { label: "Success rate", value: successRate === null ? "—" : `${successRate}%` },
    { label: "Tasks done", value: String(tasks) },
    { label: "Collaborations", value: String(collabs) },
    { label: "Spend velocity", value: `${formatUsd(velocity)}/d` },
  ];

  const applyBudget = () => {
    setBudget(agent.id, rec.suggestedUsdc);
    toast.success("Budget re-allocated", {
      description: `${agent.name} → ${formatUsd(rec.suggestedUsdc)} total budget`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Governance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Autonomy tier */}
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="text-brand-muted mt-0.5 size-4 shrink-0" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={tierVariant}>{autonomy.tier}</Badge>
              <span className="text-muted text-xs">
                {autonomy.canDelegate ? "can delegate" : "delegation gated"}
              </span>
            </div>
            <p className="text-muted text-xs">{autonomy.rationale}</p>
          </div>
        </div>

        {/* Budget recommendation */}
        <div className="border-border bg-surface-2 rounded-[var(--radius)] border p-3">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-medium capitalize">
              {(() => {
                const Icon = recIcon;
                return <Icon className={`size-4 ${recColor}`} />;
              })()}
              {rec.direction === "hold" ? "Hold allocation" : `${rec.direction} budget`}
            </p>
            {rec.direction !== "hold" && (
              <Button size="sm" variant="secondary" onClick={applyBudget}>
                Set {formatUsd(rec.suggestedUsdc)}
              </Button>
            )}
          </div>
          <p className="text-muted mt-1 text-xs">{rec.rationale}</p>
        </div>

        {/* Performance */}
        <div className="border-border/60 grid grid-cols-2 gap-3 border-t pt-3">
          {metrics.map((m) => (
            <div key={m.label}>
              <p className="text-muted text-xs">{m.label}</p>
              <p className="text-sm font-semibold tabular-nums">{m.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
