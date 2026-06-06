"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAgents } from "@/hooks/use-agents";
import { eventBadgeVariant, EVENT_LABEL, timeAgo } from "@/lib/agents/format";
import { explorerTx } from "@/lib/tx";
import { cn, formatUsd } from "@/lib/utils";
import type { AgentEvent } from "@/lib/agents/types";

/** Live activity log of agent events — shared by the control room and profiles. */
export function ActivityFeed({
  events,
  limit = 12,
  showAgent = true,
}: {
  events: AgentEvent[];
  limit?: number;
  showAgent?: boolean;
}) {
  const { getAgent } = useAgents();
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Keep relative timestamps fresh without causing SSR mismatch.
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  const rows = events.slice(0, limit);

  if (rows.length === 0) {
    return <p className="text-muted py-6 text-center text-sm">No activity yet.</p>;
  }

  return (
    <ul className="space-y-1">
      <AnimatePresence initial={false}>
        {rows.map((e) => {
          const agent = showAgent ? getAgent(e.agentId) : undefined;
          return (
            <motion.li
              key={e.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="hover:bg-surface-2/60 flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <Badge variant={eventBadgeVariant(e.kind)}>{EVENT_LABEL[e.kind]}</Badge>
                <div className="min-w-0">
                  <p className="text-foreground truncate">{e.label}</p>
                  <p className="text-muted text-xs">
                    {agent ? `${agent.name} · ` : ""}
                    {timeAgo(e.at, nowMs)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {typeof e.trustDelta === "number" && e.trustDelta !== 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
                      e.trustDelta > 0 ? "bg-success/15 text-success" : "bg-danger/15 text-danger",
                    )}
                    title="Trust impact of this event"
                  >
                    {e.trustDelta > 0 ? `+${e.trustDelta}` : e.trustDelta}
                  </span>
                )}
                {typeof e.amountUsdc === "number" && e.amountUsdc > 0 && (
                  <span className="text-muted tabular-nums">{formatUsd(e.amountUsdc)}</span>
                )}
                {e.txHash && (
                  <a
                    href={explorerTx(e.txHash as `0x${string}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-muted hover:text-foreground"
                    aria-label="View settlement on explorer"
                    onClick={(ev) => ev.stopPropagation()}
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
