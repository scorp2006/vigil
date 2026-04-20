// POC mode: no real sessions. Every call returns the seeded demo org.
// ensureSeeded() runs on first request so the tables are populated.

import { db } from "@/lib/db";
import { ensureSeeded } from "@/lib/bootstrap";

export type SessionData = {
  userId: string;
  orgId: string;
  email: string;
  name?: string;
};

const DEMO_SESSION: SessionData = {
  userId: "demo-user",
  orgId: "demo-org",
  email: "admin@acme.demo",
  name: "Demo Admin",
};

// Kept for any stale imports; no-ops.
export async function createSession(_data: SessionData) {}
export async function destroySession() {}

export async function getSession(): Promise<SessionData | null> {
  return DEMO_SESSION;
}

export async function requireSession(): Promise<SessionData> {
  return DEMO_SESSION;
}

export async function requireOrg() {
  await ensureSeeded();
  const org = await db.org.findFirst({ where: { slug: "acme-bank-demo" } });
  if (!org) {
    throw new Error("Demo tenant failed to seed. Check DATABASE_URL is reachable.");
  }
  return { session: DEMO_SESSION, org };
}
