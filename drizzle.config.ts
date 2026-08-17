import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit doesn't load .env.local on its own — every script in this repo
// does this explicitly (see scripts/_shared.ts), matching that convention.
config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
