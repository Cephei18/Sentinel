/**
 * Database client for the hosted API. Neon's HTTP driver (not a persistent
 * connection) is deliberate: Vercel's serverless functions are short-lived,
 * and a pooled TCP connection per invocation exhausts Postgres connection
 * limits fast. HTTP-over-fetch has no connection to hold open.
 *
 * Only imported by /api/v1/* routes and the one-off scripts — the existing
 * demo app (agents-provider.tsx and everything under src/components/agents/)
 * never imports this file.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let _db: NeonHttpDatabase<typeof schema> | null = null;

/** Lazily construct + cache the DB client. Throws only when actually called. */
export function getDb(): NeonHttpDatabase<typeof schema> {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set — the hosted API (/api/v1/*) needs a Neon connection string. " +
        "The rest of the app (the demo) does not need this variable.",
    );
  }
  _db = drizzle(neon(url), { schema });
  return _db;
}
