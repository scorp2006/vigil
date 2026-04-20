import { cookies } from "next/headers";
import { signToken, verifyToken } from "@/lib/crypto";
import { db } from "@/lib/db";
import { ensureSeeded } from "@/lib/bootstrap";

const COOKIE = "vigil_session";

// Kept in sync with src/app/actions/auth.ts — any valid session with
// this userId/orgId is a POC demo session and should resolve to the
// seeded demo tenant on lookup.
const DEMO_USER_ID = "demo-user";
const DEMO_ORG_ID = "demo-org";

export type SessionData = {
  userId: string;
  orgId: string;
  email: string;
  name?: string;
};

export async function createSession(data: SessionData) {
  const token = await signToken(data);
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getSession(): Promise<SessionData | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  return await verifyToken<SessionData>(token);
}

export async function requireSession(): Promise<SessionData> {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHORIZED");
  return s;
}

// Resolves the session's orgId to a concrete Org row. If the session is
// the demo session (POC mode), seeds the demo tenant if needed, then
// rewrites the session to point to the real seeded IDs so subsequent
// dashboard queries succeed.
export async function requireOrg() {
  const s = await requireSession();

  if (s.orgId === DEMO_ORG_ID || s.userId === DEMO_USER_ID) {
    await ensureSeeded();
    const org = await db.org.findFirst({ where: { slug: "acme-bank-demo" } });
    if (!org) {
      throw new Error(
        "Demo tenant failed to seed. Check DATABASE_URL is set and the DB is reachable.",
      );
    }
    return { session: s, org };
  }

  const org = await db.org.findUnique({ where: { id: s.orgId } });
  if (!org) throw new Error("ORG_NOT_FOUND");
  return { session: s, org };
}
