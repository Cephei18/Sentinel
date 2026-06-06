"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useAgents } from "@/hooks/use-agents";
import { computeTrustScore } from "@/lib/agents/reputation";
import { formatUsd } from "@/lib/utils";

/** Portfolio-level metrics derived live from the agent roster + event log. */
export function ControlStats() {
  const { agents, events } = useAgents();

  const authorized = agents.reduce((s, a) => s + a.authorization.budgetUsdc, 0);
  const spent = events
    .filter((e) => e.kind === "payment_success")
    .reduce((s, e) => s + (e.amountUsdc ?? 0), 0);
  const avgTrust =
    agents.length === 0
      ? 0
      : Math.round(
          agents.reduce((s, a) => s + computeTrustScore(a, events).score, 0) / agents.length,
        );

  const stats = [
    { label: "AI workers", value: String(agents.length) },
    { label: "Capital allocated", value: formatUsd(authorized, { compact: true }) },
    { label: "Deployed", value: formatUsd(spent) },
    { label: "Avg reliability", value: agents.length ? String(avgTrust) : "—" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="p-5">
            <p className="text-muted text-xs">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
