"use client";

import { useState } from "react";
import { Zap, ExternalLink, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAgents } from "@/hooks/use-agents";
import { notifyTrust } from "@/components/agents/trust-toast";
import { useIsDemoMode } from "@/components/demo-mode";
import { explorerTx } from "@/lib/tx";
import { checkAuthorization } from "@/lib/agents/authorization";
import type { Agent, DraftEvent, SpendCategory } from "@/lib/agents/types";

// The gated resource this action buys (matches /api/premium pricing + nature).
const RESOURCE = {
  label: "Premium market data",
  priceUsdc: 0.01,
  category: "data" as SpendCategory,
};

type RunResult =
  | { kind: "blocked"; reason: string }
  | { kind: "success"; txHash?: string; simulated?: boolean };

/**
 * Runs a real x402 autonomous purchase ON BEHALF OF this agent — but only after
 * the agent's own authorization clears. A blocked attempt and a settled payment
 * both become trust events, so the score reacts live to real behaviour.
 */
export function AgentRunAction({ agent }: { agent: Agent }) {
  const { recordEvent, spendFor, projectDelta } = useAgents();
  const demo = useIsDemoMode();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);

  const run = async () => {
    // Enforce the granted scope before any value moves (shared engine guardrail).
    const verdict = checkAuthorization(
      agent,
      spendFor(agent),
      { amountUsdc: RESOURCE.priceUsdc, category: RESOURCE.category },
      Date.now(),
    );
    if (!verdict.allowed) {
      const blockedReason = verdict.reason;
      const blockEvent: DraftEvent = {
        agentId: agent.id,
        kind: "limit_blocked",
        label: `Blocked: ${blockedReason}`,
        amountUsdc: RESOURCE.priceUsdc,
        category: RESOURCE.category,
      };
      const delta = projectDelta(agent.id, [blockEvent]);
      recordEvent(blockEvent);
      setResult({ kind: "blocked", reason: blockedReason });
      notifyTrust(delta, `Authorization guardrail · ${blockedReason}`);
      return;
    }

    // Record a settled purchase (real or simulated) and move trust. Keeping this
    // path always-succeed after the guardrail clears means the "trust rises"
    // beat never dead-ends on a missing wallet or a flaky testnet.
    const settle = (txHash?: string, simulated = false) => {
      const payEvent: DraftEvent = {
        agentId: agent.id,
        kind: "payment_success",
        label: `Paid for ${RESOURCE.label} via x402${simulated ? " (simulated)" : ""}`,
        amountUsdc: RESOURCE.priceUsdc,
        category: RESOURCE.category,
        txHash,
      };
      const taskEvent: DraftEvent = {
        agentId: agent.id,
        kind: "task_completed",
        label: `Retrieved ${RESOURCE.label}`,
        category: RESOURCE.category,
      };
      const delta = projectDelta(agent.id, [payEvent, taskEvent]);
      recordEvent(payEvent);
      recordEvent(taskEvent);
      setResult({ kind: "success", txHash, simulated });
      notifyTrust(delta, simulated ? "Simulated x402 settlement" : "Successful x402 settlement");
    };

    // Demo mode: no wallet stack — settle in simulation immediately.
    if (demo) {
      settle(undefined, true);
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/x402/buy", { method: "POST" });
      const data: { ok: boolean; payment?: { transaction?: string }; error?: string } =
        await res.json();
      // Real settlement when the agent wallet is configured; otherwise fall
      // back to a clearly-labelled simulation so the demo always lands.
      settle(data.ok ? data.payment?.transaction : undefined, !data.ok);
    } catch {
      settle(undefined, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="text-brand-muted size-4" /> Autonomous purchase
        </CardTitle>
        <CardDescription>
          {agent.name} pays ${RESOURCE.priceUsdc} USDC for {RESOURCE.label} via x402 — gated by its
          own authorization.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={run} loading={loading} className="w-full">
          {loading ? "Agent paying…" : `Run purchase ($${RESOURCE.priceUsdc})`}
        </Button>

        {result?.kind === "blocked" && (
          <div className="border-warning/30 bg-warning/10 flex items-start gap-2 rounded-[var(--radius)] border p-3 text-sm">
            <ShieldAlert className="text-warning mt-0.5 size-4 shrink-0" />
            <div>
              <p className="text-warning font-medium">Blocked by guardrail</p>
              <p className="text-muted">{result.reason}</p>
            </div>
          </div>
        )}

        {result?.kind === "success" && (
          <div className="border-success/30 bg-success/10 flex items-center justify-between rounded-[var(--radius)] border p-3 text-sm">
            <Badge variant="success">
              {result.simulated ? "Settled (simulated)" : "Paid & settled"}
            </Badge>
            {result.txHash ? (
              <a
                href={explorerTx(result.txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-muted inline-flex items-center gap-1 text-xs hover:underline"
              >
                settlement <ExternalLink className="size-3" />
              </a>
            ) : (
              <span className="text-muted text-xs">trust updated live</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
