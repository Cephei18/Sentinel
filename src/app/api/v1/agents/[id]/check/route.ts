import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api/auth";
import { getDb } from "@/lib/db/client";
import { agents, events as eventsTable } from "@/lib/db/schema";
import { toAgent, toAgentEvent } from "@/lib/api/mappers";
import { computeSpend } from "@/lib/agents/reputation";
import { checkAuthorization } from "@/lib/agents/authorization";
import { SPEND_CATEGORIES, type SpendCategory } from "@/lib/agents/types";

export const runtime = "nodejs";

const categoryIds = SPEND_CATEGORIES.map((c) => c.id) as [SpendCategory, ...SpendCategory[]];

const checkSchema = z.object({
  amountUsdc: z.number(),
  category: z.enum(categoryIds),
});

/**
 * The guardrail: is this agent allowed to spend this amount, in this
 * category, right now? Read-only — records nothing. Callers record the
 * outcome afterward via POST .../events, the same two-step shape
 * agent-run-action.tsx already uses internally.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const parsed = checkSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: z.flattenError(parsed.error) },
      { status: 400 },
    );
  }

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
  const spend = computeSpend(agent, eventRows.map(toAgentEvent));
  const verdict = checkAuthorization(agent, spend, parsed.data, Date.now());

  return NextResponse.json(verdict);
}
