"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AgentAvatar } from "@/components/agents/agent-avatar";
import { TrustScoreRing } from "@/components/agents/trust-score-ring";
import { useAgents } from "@/hooks/use-agents";
import { gradeBadgeVariant, statusBadgeVariant } from "@/lib/agents/format";
import { formatUsd } from "@/lib/utils";
import type { Agent } from "@/lib/agents/types";

/** Roster card — agent identity, status, live trust score, and budget usage. */
export function AgentCard({ agent, index = 0 }: { agent: Agent; index?: number }) {
  const { scoreFor, spendFor } = useAgents();
  const trust = scoreFor(agent);
  const spend = spendFor(agent);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/agents/${agent.id}`} className="group block">
        <Card className="hover:border-brand/40 h-full transition-colors">
          <CardContent className="flex gap-4 p-5">
            <div className="flex flex-1 flex-col gap-3">
              <div className="flex items-center gap-3">
                <AgentAvatar name={agent.name} seed={agent.avatarSeed} size={40} />
                <div className="min-w-0">
                  <p className="truncate leading-tight font-semibold">{agent.name}</p>
                  <p className="text-muted truncate text-xs">{agent.model}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant={statusBadgeVariant(agent.status)}>{agent.status}</Badge>
                <Badge variant={gradeBadgeVariant(trust.grade)}>{trust.grade}</Badge>
                <span className="text-muted text-xs">{trust.confidence} confidence</span>
              </div>

              {/* Budget usage */}
              <div className="mt-auto space-y-1">
                <div className="text-muted flex justify-between text-xs">
                  <span>Budget</span>
                  <span className="tabular-nums">
                    {formatUsd(spend.spentUsdc)} / {formatUsd(spend.budgetUsdc)}
                  </span>
                </div>
                <div className="bg-surface-2 h-1.5 overflow-hidden rounded-full">
                  <div
                    className="bg-brand-muted h-full rounded-full"
                    style={{ width: `${Math.round(spend.utilization * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <TrustScoreRing score={trust.score} grade={trust.grade} size={96} showGrade={false} />
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
