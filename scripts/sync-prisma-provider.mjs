// Aligns prisma/schema.prisma's datasource provider with the protocol of
// DATABASE_URL so one checkout works in both environments:
//   - DATABASE_URL=file:…       → provider = "sqlite"   (local dev)
//   - DATABASE_URL=postgres(ql)://… → provider = "postgresql" (Vercel/Neon)
//
// Keeps the schema self-consistent instead of forcing one provider and
// breaking the other. Wired into npm scripts (dev, build, postinstall).

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const schemaPath = join(repoRoot, "prisma", "schema.prisma");
const envPath = join(repoRoot, ".env");

function readDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (!existsSync(envPath)) return null;
  const env = readFileSync(envPath, "utf8");
  const match = env.match(/^\s*DATABASE_URL\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/m);
  return match ? match[1] ?? match[2] ?? match[3] : null;
}

function inferProvider(url) {
  if (!url) return null;
  if (url.startsWith("file:")) return "sqlite";
  if (url.startsWith("postgresql://") || url.startsWith("postgres://")) return "postgresql";
  if (url.startsWith("mysql://")) return "mysql";
  return null;
}

const url = readDatabaseUrl();
const target = inferProvider(url);
if (!target) {
  console.log(`[sync-prisma-provider] DATABASE_URL missing or unrecognized — leaving schema untouched.`);
  process.exit(0);
}

const schema = readFileSync(schemaPath, "utf8");
const current = schema.match(/provider\s*=\s*"([^"]+)"/)?.[1];

if (current === target) {
  console.log(`[sync-prisma-provider] schema already matches ${target}.`);
  process.exit(0);
}

const updated = schema.replace(
  /(datasource\s+db\s*\{[^}]*?provider\s*=\s*")[^"]+(")/,
  `$1${target}$2`,
);

writeFileSync(schemaPath, updated);
console.log(`[sync-prisma-provider] schema provider: ${current ?? "?"} → ${target}`);
