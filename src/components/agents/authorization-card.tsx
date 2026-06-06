"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAgents } from "@/hooks/use-agents";
import { SPEND_CATEGORIES } from "@/lib/agents/types";
import type { Agent } from "@/lib/agents/types";
import { formatUsd } from "@/lib/utils";

const CATEGORY_LABEL = Object.fromEntries(SPEND_CATEGORIES.map((c) => [c.id, c.label]));

/** The granted scope + live spend against it. */
export function AuthorizationCard({ agent }: { agent: Agent }) {
  const { spendFor } = useAgents();
  const spend = spendFor(agent);
  const auth = agent.authorization;
  // Snapshot "now" once on mount — keeps render pure (no Date.now() during render).
  const [nowMs] = useState(() => Date.now());
  const expiresMs = new Date(auth.expiresAt).getTime();
  const expired = expiresMs < nowMs;
  const daysLeft = Math.max(0, Math.round((expiresMs - nowMs) / (24 * 60 * 60 * 1000)));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authorization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Budget usage */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Budget used</span>
            <span className="tabular-nums">
              {formatUsd(spend.spentUsdc)} / {formatUsd(spend.budgetUsdc)}
            </span>
          </div>
          <div className="bg-surface-2 h-2 overflow-hidden rounded-full">
            <div
              className="bg-brand-muted h-full rounded-full"
              style={{ width: `${Math.round(spend.utilization * 100)}%` }}
            />
          </div>
          <p className="text-muted text-xs">{formatUsd(spend.remainingUsdc)} remaining</p>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted text-xs">Per-transaction limit</dt>
            <dd className="mt-0.5 tabular-nums">{formatUsd(auth.perTxLimitUsdc)}</dd>
          </div>
          <div>
            <dt className="text-muted text-xs">Expires</dt>
            <dd className="mt-0.5">
              {expired ? (
                <span className="text-danger">expired</span>
              ) : (
                <span className="tabular-nums">in {daysLeft}d</span>
              )}
            </dd>
          </div>
        </dl>

        <div>
          <p className="text-muted mb-1.5 text-xs">Allowed categories</p>
          <div className="flex flex-wrap gap-1.5">
            {auth.categories.map((c) => (
              <Badge key={c} variant="brand">
                {CATEGORY_LABEL[c] ?? c}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
