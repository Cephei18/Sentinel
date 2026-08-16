import { NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api/auth";
import { getDb } from "@/lib/db/client";
import { agents, events as eventsTable } from "@/lib/db/schema";
import { toAgent, toAgentEvent } from "@/lib/api/mappers";
import { projectScoreDelta } from "@/lib/agents/reputation";
import { computeEventHash } from "@/lib/agents/hash-chain";
import { SPEND_CATEGORIES, type SpendCategory } from "@/lib/agents/types";

export const runtime = "nodejs";

const categoryIds = SPEND_CATEGORIES.map((c) => c.id) as [SpendCategory, ...SpendCategory[]];

// "authorized" events come from creating/updating an agent's grant, not from
// this endpoint — this is for reporting what an agent *did*, not re-scoping it.
const recordableKinds = [
  "payment_success",
  "payment_failed",
  "task_completed",
  "limit_blocked",
] as const;

const recordEventSchema = z.object({
  kind: z.enum(recordableKinds),
  label: z.string().min(1),
  amountUsdc: z.number().optional(),
  category: z.enum(categoryIds).optional(),
  txHash: z.string().optional(),
  counterpartyId: z.string().optional(),
});

/**
 * Append an event to an agent's log. Hash-chained per org (one verifiable
 * timeline across all of an org's agents), trust-delta stamped via the same
 * projectScoreDelta the demo app uses. Nothing here is ever updated or
 * deleted — append-only in practice, not just by convention.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const parsed = recordEventSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: z.flattenError(parsed.error) },
      { status: 400 },
    );
  }

  const db = getDb();
  const [agentRow] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, id), eq(agents.orgId, auth.orgId)))
    .limit(1);
  if (!agentRow) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const existingRows = await db
    .select()
    .from(eventsTable)
    .where(and(eq(eventsTable.agentId, id), eq(eventsTable.orgId, auth.orgId)));

  const agent = toAgent(agentRow);
  const draft = { agentId: id, ...parsed.data };
  const trustDelta = projectScoreDelta(agent, existingRows.map(toAgentEvent), [draft]);
  const at = new Date();

  // Chain scope: one hash chain per org, spanning all its agents — a single
  // verifiable timeline for everything that happened, not per-agent silos.
  // Ordered by insertion time; a documented v1 simplification (not airtight
  // under sub-millisecond concurrent writes), same spirit as the trust
  // engine's own noted v1 limitations.
  const [lastOrgEvent] = await db
    .select({ hash: eventsTable.hash })
    .from(eventsTable)
    .where(eq(eventsTable.orgId, auth.orgId))
    .orderBy(desc(eventsTable.at))
    .limit(1);
  const prevHash = lastOrgEvent?.hash ?? null;
  const hash = await computeEventHash(prevHash, { ...draft, trustDelta, at: at.toISOString() });

  const [inserted] = await db
    .insert(eventsTable)
    .values({ orgId: auth.orgId, ...draft, trustDelta, at, hash, prevHash })
    .returning();

  return NextResponse.json({ event: toAgentEvent(inserted) }, { status: 201 });
}

/** The audit trail for one agent. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const db = getDb();
  const rows = await db
    .select()
    .from(eventsTable)
    .where(and(eq(eventsTable.agentId, id), eq(eventsTable.orgId, auth.orgId)))
    .orderBy(desc(eventsTable.at));

  return NextResponse.json({ events: rows.map(toAgentEvent) });
}
