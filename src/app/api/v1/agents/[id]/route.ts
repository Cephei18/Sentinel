import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api/auth";
import { getDb } from "@/lib/db/client";
import { agents, events as eventsTable } from "@/lib/db/schema";
import { toAgent, toAgentEvent } from "@/lib/api/mappers";
import { computeTrustScore, computeSpend } from "@/lib/agents/reputation";

export const runtime = "nodejs";

/** Fetch an agent plus its derived trust score and spend summary. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const db = getDb();
  const [row] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, id), eq(agents.orgId, auth.orgId)))
    .limit(1);
  if (!row) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const eventRows = await db
    .select()
    .from(eventsTable)
    .where(and(eq(eventsTable.agentId, id), eq(eventsTable.orgId, auth.orgId)));

  const agent = toAgent(row);
  const allEvents = eventRows.map(toAgentEvent);

  return NextResponse.json({
    agent,
    trust: computeTrustScore(agent, allEvents),
    spend: computeSpend(agent, allEvents),
  });
}
