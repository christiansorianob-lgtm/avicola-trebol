import { defineConfig } from "prisma/config";

// Load .env file only if it exists (local dev).
// On Vercel, env vars are injected into process.env automatically.
try {
  require("dotenv/config");
} catch {
  // dotenv/config not available or .env missing — that's OK on Vercel
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    // Use process.env directly with a placeholder fallback so that
    // `prisma generate` can succeed even without a real DATABASE_URL
    // (generate only reads the schema, it does not connect to the DB).
    url: process.env.DATABASE_URL || "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
