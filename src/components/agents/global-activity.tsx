"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityFeed } from "@/components/agents/activity-feed";
import { useAgents } from "@/hooks/use-agents";

/** Cross-agent live activity log for the control room. */
export function GlobalActivity({ limit = 10 }: { limit?: number }) {
  const { events } = useAgents();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Live activity</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ActivityFeed events={events} limit={limit} showAgent />
      </CardContent>
    </Card>
  );
}
