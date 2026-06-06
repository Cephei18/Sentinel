"use client";

import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AgentAvatar } from "@/components/agents/agent-avatar";
import { useAgents } from "@/hooks/use-agents";
import { notifyTrust } from "@/components/agents/trust-toast";
import { gradeBadgeVariant } from "@/lib/agents/format";
import { autonomyFor } from "@/lib/agents/governance";
import type { DraftEvent } from "@/lib/agents/types";

const selectClass =
  "h-11 w-full rounded-[var(--radius)] border border-border bg-surface-2 px-3 text-sm text-foreground focus-visible:border-brand focus-visible:outline-none";

/**
 * One agent autonomously hires another for a service. The payer's authorization
 * is enforced before settlement; the highest-trust provider is suggested by
 * default (trust-aware selection). Settlement is simulated coordination — the
 * payoff is that both agents' trust + the graph edge update live.
 */
export function AgentCommerce() {
  const { agents, payAgent, recordEvent, scoreFor, spendFor, projectDelta } = useAgents();

  const [payerId, setPayerId] = useState("");
  const [payeeId, setPayeeId] = useState("");
  const [service, setService] = useState("data enrichment");
  const [amount, setAmount] = useState("1.00");
  // Snapshot "now" once — keeps render pure; day-scale expiry doesn't need live time.
  const [nowMs] = useState(() => Date.now());

  const activeAgents = agents.filter((a) => a.status === "active");
  const payer = activeAgents.find((a) => a.id === payerId) ?? activeAgents[0];
  // Trust-aware: rank candidate providers by score, highest first.
  const candidates = agents
    .filter((a) => a.id !== payer?.id)
    .sort((a, b) => scoreFor(b).score - scoreFor(a).score);
  const payee = candidates.find((a) => a.id === payeeId) ?? candidates[0];
  const amountNum = Number(amount);

  if (!payer || !payee) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Delegate work</CardTitle>
          <CardDescription>
            Hire at least two workers (one active) to enable delegation between them.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  function guardrail(): string | null {
    if (!payer) return "No active payer.";
    if (new Date(payer.authorization.expiresAt).getTime() < nowMs)
      return "Payer authorization expired.";
    if (!autonomyFor(scoreFor(payer).score).canDelegate)
      return `${payer.name} is Supervised — it must earn higher reliability before it can delegate.`;
    if (!payer.authorization.categories.includes("services"))
      return `${payer.name} isn't authorized to spend on agent services.`;
    if (!(amountNum > 0)) return "Enter an amount greater than 0.";
    if (amountNum > payer.authorization.perTxLimitUsdc)
      return `$${amountNum} exceeds ${payer.name}'s $${payer.authorization.perTxLimitUsdc} per-tx limit.`;
    if (spendFor(payer).remainingUsdc < amountNum) return `${payer.name}'s budget is exhausted.`;
    return null;
  }

  const hire = () => {
    const blocked = guardrail();
    if (blocked) {
      const blockEvent: DraftEvent = {
        agentId: payer.id,
        kind: "limit_blocked",
        label: `Blocked hiring ${payee.name}: ${blocked}`,
        amountUsdc: amountNum || undefined,
        category: "services",
        counterpartyId: payee.id,
      };
      const delta = projectDelta(payer.id, [blockEvent]);
      recordEvent(blockEvent);
      notifyTrust(delta, `${payer.name} · guardrail enforced`);
      return;
    }
    // Provider earns reputation for delivering — the on-thesis beat.
    const deliverLike: DraftEvent = {
      agentId: payee.id,
      kind: "task_completed",
      label: `Delivered ${service}`,
      category: "services",
    };
    const payeeDelta = projectDelta(payee.id, [deliverLike]);
    payAgent({ payerId: payer.id, payeeId: payee.id, amountUsdc: amountNum, service });
    toast.success(`${payer.name} → ${payee.name}`, {
      description: `Paid $${amountNum} for ${service}`,
    });
    notifyTrust(payeeDelta, `${payee.name} earned trust delivering ${service}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delegate work</CardTitle>
        <CardDescription>
          One worker hires another autonomously — within its delegated authority.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payer → Payee visual */}
        <div className="border-border bg-surface-2 flex items-center justify-between gap-2 rounded-[var(--radius)] border p-3">
          <div className="flex items-center gap-2">
            <AgentAvatar name={payer.name} seed={payer.avatarSeed} size={32} />
            <div className="text-sm">
              <p className="leading-tight font-medium">{payer.name}</p>
              <p className="text-muted text-xs">pays</p>
            </div>
          </div>
          <ArrowRight className="text-brand-muted size-4" />
          <div className="flex items-center gap-2">
            <div className="text-right text-sm">
              <p className="flex items-center justify-end gap-1.5 leading-tight font-medium">
                {payee.name}
                <Badge variant={gradeBadgeVariant(scoreFor(payee).grade)}>
                  {scoreFor(payee).grade}
                </Badge>
              </p>
              <p className="text-muted text-xs">provider</p>
            </div>
            <AgentAvatar name={payee.name} seed={payee.avatarSeed} size={32} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5">
            <span className="text-muted text-xs font-medium">Payer</span>
            <select
              value={payer.id}
              onChange={(e) => setPayerId(e.target.value)}
              className={selectClass}
            >
              {activeAgents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-muted flex items-center gap-1 text-xs font-medium">
              Provider <Sparkles className="text-brand-muted size-3" />
            </span>
            <select
              value={payee.id}
              onChange={(e) => setPayeeId(e.target.value)}
              className={selectClass}
            >
              {candidates.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {scoreFor(a).score}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5">
            <span className="text-muted text-xs font-medium">Service</span>
            <Input value={service} onChange={(e) => setService(e.target.value)} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-muted text-xs font-medium">Amount (USDC)</span>
            <Input
              type="number"
              min="0"
              step="0.5"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
        </div>

        <Button onClick={hire} className="w-full">
          {payer.name} hires {payee.name}
        </Button>
        <p className="text-muted text-center text-xs">
          Trust-aware: defaults to your highest-reliability provider.
        </p>
      </CardContent>
    </Card>
  );
}
