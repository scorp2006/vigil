import path from "node:path";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function resolveDatabaseUrl() {
  const raw = process.env.DATABASE_URL || "file:./dev.db";
  if (!raw.startsWith("file:")) return raw;
  const p = raw.slice("file:".length);
  if (path.isAbsolute(p) || /^[A-Za-z]:[/\\]/.test(p)) return raw;
  // Match Prisma CLI: SQLite relative paths are resolved from the schema's
  // directory (prisma/), not the process cwd. Without this alignment, `prisma
  // db push` writes to prisma/dev.db while the runtime client reads/writes
  // dev.db at the project root.
  const abs = path.resolve(process.cwd(), "prisma", p);
  return `file:${abs.replace(/\\/g, "/")}`;
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: resolveDatabaseUrl() } },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
