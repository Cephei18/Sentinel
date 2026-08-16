/**
 * Drizzle schema for the hosted API — the M2/M4 seam `agents-provider.tsx`
 * was always built for. This is a SEPARATE surface from the existing demo:
 * nothing here touches localStorage or the seeded workforce, and the demo
 * app doesn't import anything from this file.
 *
 * Table shapes mirror src/lib/agents/types.ts directly (Agent, Authorization,
 * AgentEvent) so the pure engine functions can be called with rows read
 * straight from these tables, no translation layer.
 */
import { pgTable, text, timestamp, doublePrecision, jsonb, uuid } from "drizzle-orm/pg-core";
import type { AgentStatus, SpendCategory, AgentEventKind } from "@/lib/agents/types";

export const orgs = pgTable("orgs", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => orgs.id),
  // sha256 hex digest of the raw key — the raw key itself is never stored.
  keyHash: text("key_hash").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

export const agents = pgTable("agents", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => orgs.id),
  name: text("name").notNull(),
  model: text("model").notNull(),
  avatarSeed: text("avatar_seed").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  status: text("status").$type<AgentStatus>().notNull().default("active"),
  // Authorization fields, embedded directly (mirrors Agent.authorization) —
  // this is the current mutable grant, not history; changes to it are what
  // "authorized" events in the log describe.
  budgetUsdc: doublePrecision("budget_usdc").notNull(),
  perTxLimitUsdc: doublePrecision("per_tx_limit_usdc").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  categories: jsonb("categories").$type<SpendCategory[]>().notNull(),
});

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => orgs.id),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id),
  kind: text("kind").$type<AgentEventKind>().notNull(),
  label: text("label").notNull(),
  amountUsdc: doublePrecision("amount_usdc"),
  category: text("category").$type<SpendCategory>(),
  txHash: text("tx_hash"),
  counterpartyId: uuid("counterparty_id"),
  trustDelta: doublePrecision("trust_delta"),
  at: timestamp("at", { withTimezone: true }).defaultNow().notNull(),
  // Hash chain — see src/lib/agents/hash-chain.ts. Append-only in practice:
  // the API never exposes an update or delete on this table.
  hash: text("hash").notNull(),
  prevHash: text("prev_hash"),
});
