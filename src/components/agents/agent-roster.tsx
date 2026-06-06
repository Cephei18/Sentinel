"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AgentCard } from "@/components/agents/agent-card";
import { CreateAgentDialog } from "@/components/agents/create-agent-dialog";
import { useAgents } from "@/hooks/use-agents";

/** The agent roster — grid of trust cards plus the authorize-agent entry point. */
export function AgentRoster() {
  const { agents, ready } = useAgents();
  const [creating, setCreating] = useState(false);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Your AI workforce</h2>
          <p className="text-muted text-sm">
            {agents.length} workers · reliability scored from on-chain behaviour
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" /> Hire AI worker
        </Button>
      </div>

      {!ready ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <Card key={i}>
              <CardContent className="h-32 animate-pulse p-5" />
            </Card>
          ))}
        </div>
      ) : agents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-muted text-sm">
              No workers yet. Hire your first AI worker to start building the org.
            </p>
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" /> Hire AI worker
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {agents.map((a, i) => (
            <AgentCard key={a.id} agent={a} index={i} />
          ))}
        </div>
      )}

      <CreateAgentDialog open={creating} onClose={() => setCreating(false)} />
    </section>
  );
}
