"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useAgents } from "@/hooks/use-agents";
import { computeSpend, computeTrustScore } from "@/lib/agents/reputation";
import { scoreColorClass } from "@/lib/agents/format";
import { BRAND } from "@/lib/brand";
import { cn, formatUsd } from "@/lib/utils";

const W = 680;
const H = 480;
const CX = W / 2;
const CY = H / 2;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Trust graph — agents orbit the Sentinel control hub. Distance to the hub is
 * inverse to trust (more trusted → closer), node size scales with score. Bright
 * edges are agent-to-agent payments with USDC "packets" flowing along them;
 * faint spokes are authorizations. The network reads as observable economic
 * coordination at a glance.
 */
export function TrustGraph() {
  const { agents, events } = useAgents();
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);

  const { nodes, edges } = useMemo(() => {
    const n = agents.length;
    const nodes = agents.map((a, i) => {
      const trust = computeTrustScore(a, events);
      const spend = computeSpend(a, events);
      const ang = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(1, n);
      const dist = lerp(190, 92, trust.score / 100); // far when low, near when high
      return {
        id: a.id,
        name: a.name,
        score: trust.score,
        grade: trust.grade,
        confidence: trust.confidence,
        spentUsdc: spend.spentUsdc,
        budgetUsdc: spend.budgetUsdc,
        x: CX + dist * Math.cos(ang),
        y: CY + dist * Math.sin(ang),
        r: lerp(16, 30, trust.score / 100),
      };
    });

    const byId = new Map(nodes.map((nd) => [nd.id, nd]));
    const seen = new Map<string, { from: string; to: string; count: number }>();
    for (const e of events) {
      if (e.kind !== "payment_success" || !e.counterpartyId) continue;
      if (!byId.has(e.agentId) || !byId.has(e.counterpartyId)) continue;
      const key = `${e.agentId}->${e.counterpartyId}`;
      const hit = seen.get(key);
      if (hit) hit.count += 1;
      else seen.set(key, { from: e.agentId, to: e.counterpartyId, count: 1 });
    }
    return { nodes, edges: [...seen.values()] };
  }, [agents, events]);

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  if (agents.length === 0) {
    return (
      <div className="text-muted grid h-80 place-items-center text-sm">
        Authorize an agent to populate the trust graph.
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full select-none"
      role="img"
      aria-label="Trust graph of authorized agents"
    >
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0 0L10 5L0 10z" className="fill-brand-muted" />
        </marker>
      </defs>

      {/* Authorization spokes — faint hub→agent links */}
      {nodes.map((nd) => (
        <line
          key={`spoke-${nd.id}`}
          x1={CX}
          y1={CY}
          x2={nd.x}
          y2={nd.y}
          className="stroke-border"
          strokeWidth={1}
          strokeDasharray="3 5"
          opacity={0.5}
        />
      ))}

      {/* Agent-to-agent payment edges + flowing USDC packets */}
      {edges.map((e, i) => {
        const a = byId.get(e.from)!;
        const b = byId.get(e.to)!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const x1 = a.x + ux * (a.r + 2);
        const y1 = a.y + uy * (a.r + 2);
        const x2 = b.x - ux * (b.r + 8);
        const y2 = b.y - uy * (b.r + 8);
        const segLen = Math.hypot(x2 - x1, y2 - y1);
        return (
          <g key={`edge-${e.from}-${e.to}`}>
            <motion.line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              className="stroke-brand-muted"
              strokeWidth={1.5}
              markerEnd="url(#arrow)"
              strokeDasharray={segLen}
              initial={{ strokeDashoffset: segLen, opacity: 0 }}
              animate={{ strokeDashoffset: 0, opacity: 0.75 }}
              transition={{ delay: 0.4 + i * 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            />
            {/* Value flowing from payer → provider */}
            <motion.circle
              r={3}
              className="fill-brand"
              initial={{ cx: x1, cy: y1, opacity: 0 }}
              animate={{ cx: [x1, x2], cy: [y1, y2], opacity: [0, 1, 1, 0] }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: "linear",
                delay: 1 + i * 0.4,
                repeatDelay: 0.8,
              }}
            />
          </g>
        );
      })}

      {/* Hub */}
      <g>
        <circle cx={CX} cy={CY} r={26} className="fill-brand/20 stroke-brand" strokeWidth={1.5} />
        <text
          x={CX}
          y={CY + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground text-[11px] font-semibold"
        >
          {BRAND.glyph}
        </text>
        <text
          x={CX}
          y={CY + 42}
          textAnchor="middle"
          className="fill-muted text-[10px] tracking-wider uppercase"
        >
          founder
        </text>
      </g>

      {/* Agent nodes */}
      {nodes.map((nd, i) => {
        const isHover = hovered === nd.id;
        return (
          <motion.g
            key={nd.id}
            className={cn("cursor-pointer", scoreColorClass(nd.score))}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: `${nd.x}px ${nd.y}px` }}
            onMouseEnter={() => setHovered(nd.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => router.push(`/agents/${nd.id}`)}
          >
            {/* Breathing halo — keeps the node feeling alive */}
            <motion.circle
              cx={nd.x}
              cy={nd.y}
              r={nd.r}
              fill="currentColor"
              animate={{ opacity: [0.16, 0.05, 0.16], scale: [1, 1.22, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
              style={{ transformOrigin: `${nd.x}px ${nd.y}px` }}
            />
            <circle cx={nd.x} cy={nd.y} r={nd.r} fill="currentColor" fillOpacity={0.16} />
            <circle
              cx={nd.x}
              cy={nd.y}
              r={nd.r}
              fill="none"
              stroke="currentColor"
              strokeWidth={isHover ? 3 : 2}
            />
            <text
              x={nd.x}
              y={nd.y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="currentColor"
              className="text-[13px] font-semibold tabular-nums"
            >
              {nd.score}
            </text>
            <text
              x={nd.x}
              y={nd.y + nd.r + 15}
              textAnchor="middle"
              className="fill-foreground text-[12px] font-medium"
            >
              {nd.name}
            </text>
          </motion.g>
        );
      })}

      {/* Hover inspection card */}
      {nodes
        .filter((nd) => nd.id === hovered)
        .map((nd) => {
          const cardW = 150;
          const cardH = 54;
          const x = Math.min(Math.max(nd.x - cardW / 2, 6), W - cardW - 6);
          const y = nd.y - nd.r - cardH - 10;
          const top = y < 6 ? nd.y + nd.r + 10 : y;
          return (
            <g key={`tip-${nd.id}`} className="pointer-events-none">
              <rect
                x={x}
                y={top}
                width={cardW}
                height={cardH}
                rx={10}
                className="fill-surface-2 stroke-border"
              />
              <text x={x + 12} y={top + 20} className="fill-foreground text-[12px] font-semibold">
                {nd.name}
              </text>
              <text x={x + 12} y={top + 36} className="fill-muted text-[11px]">
                Trust {nd.score} · {nd.grade} · {nd.confidence}
              </text>
              <text x={x + 12} y={top + 49} className="fill-muted text-[10px]">
                {formatUsd(nd.spentUsdc)} / {formatUsd(nd.budgetUsdc)} spent
              </text>
            </g>
          );
        })}
    </svg>
  );
}
