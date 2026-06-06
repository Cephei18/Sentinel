"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { AgentAvatar } from "@/components/agents/agent-avatar";
import { AgentControls } from "@/components/agents/agent-controls";
import { TrustScoreRing } from "@/components/agents/trust-score-ring";
import { TrustBreakdown } from "@/components/agents/trust-breakdown";
import { AuthorizationCard } from "@/components/agents/authorization-card";
import { GovernanceCard } from "@/components/agents/governance-card";
import { AgentRunAction } from "@/components/agents/agent-run-action";
import { ActivityFeed } from "@/components/agents/activity-feed";
import { useAgents } from "@/hooks/use-agents";
import { gradeBadgeVariant, statusBadgeVariant } from "@/lib/agents/format";

export default function AgentProfilePage() {
  const params = useParams<{ id: string }>();
  const { ready, getAgent, scoreFor, events } = useAgents();
  const agent = getAgent(params.id);

  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8">
        <Link
          href="/dashboard"
          className="text-muted hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" /> Control room
        </Link>

        {!ready ? (
          <div className="grid place-items-center py-24">
            <Spinner className="size-6" />
          </div>
        ) : !agent ? (
          <Card>
            <CardContent className="space-y-2 py-16 text-center">
              <p className="font-medium">Agent not found</p>
              <p className="text-muted text-sm">
                It may have been removed, or this is a fresh browser.{" "}
                <Link href="/dashboard" className="text-brand-muted hover:underline">
                  Back to control room
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : (
          (() => {
            const trust = scoreFor(agent);
            const agentEvents = events.filter((e) => e.agentId === agent.id);
            return (
              <>
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <AgentAvatar name={agent.name} seed={agent.avatarSeed} size={56} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight">{agent.name}</h1>
                        <Badge variant={statusBadgeVariant(agent.status)}>{agent.status}</Badge>
                      </div>
                      <p className="text-muted text-sm">{agent.model}</p>
                    </div>
                  </div>
                  <AgentControls agent={agent} />
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Trust */}
                  <Card className="lg:row-span-2">
                    <CardHeader>
                      <CardTitle>Economic trust</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-0">
                      <div className="flex flex-col items-center gap-3">
                        <TrustScoreRing score={trust.score} grade={trust.grade} size={160} />
                        <div className="flex items-center gap-2">
                          <Badge variant={gradeBadgeVariant(trust.grade)}>
                            {trust.grade} grade
                          </Badge>
                          <Badge variant="neutral">{trust.confidence} confidence</Badge>
                        </div>
                        <p className="text-muted text-center text-xs">
                          Computed from {trust.sampleSize} settled payment
                          {trust.sampleSize === 1 ? "" : "s"} in this agent&apos;s history.
                        </p>
                      </div>
                      <div className="border-border/60 border-t pt-5">
                        <TrustBreakdown trust={trust} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Authorization + governance + run */}
                  <div className="space-y-6 lg:col-span-2">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <AuthorizationCard agent={agent} />
                      <GovernanceCard agent={agent} />
                    </div>

                    <AgentRunAction agent={agent} />

                    <Card>
                      <CardHeader>
                        <CardTitle>Activity</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <ActivityFeed events={agentEvents} limit={20} showAgent={false} />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </>
            );
          })()
        )}
      </main>
    </div>
  );
}
