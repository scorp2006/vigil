import { cookies } from "next/headers";
import { signToken, verifyToken } from "@/lib/crypto";
import { db } from "@/lib/db";

const COOKIE = "vigil_session";

export type SessionData = {
  userId: string;
  orgId: string;
  email: string;
  name?: string;
};

export async function createSession(data: SessionData) {
  const token = signToken(data);
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
  return verifyToken<SessionData>(token);
}

export async function requireSession(): Promise<SessionData> {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHORIZED");
  return s;
}

export async function requireOrg() {
  const s = await requireSession();
  const org = await db.org.findUnique({ where: { id: s.orgId } });
  if (!org) throw new Error("ORG_NOT_FOUND");
  return { session: s, org };
}
