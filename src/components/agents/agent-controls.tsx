"use client";

import { Pause, Play, Ban } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAgents } from "@/hooks/use-agents";
import type { Agent } from "@/lib/agents/types";

/** Lifecycle controls — pause/resume and revoke an agent's authorization. */
export function AgentControls({ agent }: { agent: Agent }) {
  const { setStatus, recordEvent } = useAgents();
  const revoked = agent.status === "revoked";

  const pauseResume = () => {
    const next = agent.status === "active" ? "paused" : "active";
    setStatus(agent.id, next);
    toast.success(next === "paused" ? "Agent paused" : "Agent resumed");
  };

  const revoke = () => {
    setStatus(agent.id, "revoked");
    recordEvent({
      agentId: agent.id,
      kind: "limit_blocked",
      label: "Authorization revoked by owner",
    });
    toast.success("Authorization revoked", {
      description: `${agent.name} can no longer transact.`,
    });
  };

  return (
    <div className="flex gap-2">
      {!revoked && (
        <Button variant="secondary" size="sm" onClick={pauseResume}>
          {agent.status === "active" ? (
            <>
              <Pause className="size-4" /> Pause
            </>
          ) : (
            <>
              <Play className="size-4" /> Resume
            </>
          )}
        </Button>
      )}
      {!revoked && (
        <Button variant="danger" size="sm" onClick={revoke}>
          <Ban className="size-4" /> Revoke
        </Button>
      )}
    </div>
  );
}
