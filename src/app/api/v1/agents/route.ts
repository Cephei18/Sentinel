import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api/auth";
import { getDb } from "@/lib/db/client";
import { agents } from "@/lib/db/schema";
import { toAgent } from "@/lib/api/mappers";
import { SPEND_CATEGORIES, type SpendCategory } from "@/lib/agents/types";

export const runtime = "nodejs";

const categoryIds = SPEND_CATEGORIES.map((c) => c.id) as [SpendCategory, ...SpendCategory[]];

const createAgentSchema = z.object({
  name: z.string().min(1),
  model: z.string().min(1),
  budgetUsdc: z.number().positive(),
  perTxLimitUsdc: z.number().positive(),
  expiresAt: z.string().datetime(),
  categories: z.array(z.enum(categoryIds)).min(1),
});

/** Create an agent (with its scoped authorization) for the authenticated org. */
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const parsed = createAgentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: z.flattenError(parsed.error) },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const db = getDb();
  const [row] = await db
    .insert(agents)
    .values({
      orgId: auth.orgId,
      name: input.name,
      model: input.model,
      avatarSeed: `${input.name.toLowerCase()}-${Math.random().toString(36).slice(2, 8)}`,
      status: "active",
      budgetUsdc: input.budgetUsdc,
      perTxLimitUsdc: input.perTxLimitUsdc,
      expiresAt: new Date(input.expiresAt),
      categories: input.categories,
    })
    .returning();

  return NextResponse.json({ agent: toAgent(row) }, { status: 201 });
}
