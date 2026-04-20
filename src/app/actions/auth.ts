"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "org"
  );
}

export type AuthState = { error?: string } | undefined;

export async function signupAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const orgName = String(formData.get("orgName") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!orgName || !email || !password || password.length < 6) {
    return { error: "All fields required, password 6+ chars." };
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const slug = `${slugify(orgName)}-${Math.random().toString(36).slice(2, 6)}`;
  const passwordHash = await bcrypt.hash(password, 10);

  const org = await db.org.create({
    data: {
      name: orgName,
      slug,
      users: {
        create: {
          email,
          name: name || null,
          password: passwordHash,
          role: "admin",
        },
      },
    },
    include: { users: true },
  });

  const user = org.users[0];
  await createSession({
    userId: user.id,
    orgId: org.id,
    email: user.email,
    name: user.name ?? undefined,
  });
  redirect("/dashboard");
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const user = await db.user.findUnique({ where: { email } });
  if (!user) return { error: "Invalid credentials." };
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return { error: "Invalid credentials." };

  await createSession({
    userId: user.id,
    orgId: user.orgId,
    email: user.email,
    name: user.name ?? undefined,
  });
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
