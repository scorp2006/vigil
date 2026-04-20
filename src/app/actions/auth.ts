"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession } from "@/lib/session";

export type AuthState = { error?: string } | undefined;

// ── DEMO MODE ────────────────────────────────────────────────────────
// For the POC we skip real auth. Any of these credentials work, and
// signup just drops the visitor into the seeded demo tenant as admin.
// ─────────────────────────────────────────────────────────────────────
const DEMO_CREDENTIALS = [
  { email: "admin@acme.demo", password: "demo1234" },
  { email: "demo@vigil.app", password: "demo" },
  { email: "admin", password: "admin" },
];

// Stable demo identifiers. The dashboard will resolve the matching Org
// row on first authenticated request (see session.ts requireOrg).
const DEMO_USER_ID = "demo-user";
const DEMO_ORG_ID = "demo-org";
const DEMO_EMAIL = "admin@acme.demo";
const DEMO_NAME = "Demo Admin";

async function logInAsDemo() {
  await createSession({
    userId: DEMO_USER_ID,
    orgId: DEMO_ORG_ID,
    email: DEMO_EMAIL,
    name: DEMO_NAME,
  });
}

export async function signupAction(_prev: AuthState, _formData: FormData): Promise<AuthState> {
  await logInAsDemo();
  redirect("/dashboard");
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const matches = DEMO_CREDENTIALS.some(
    (c) => c.email.toLowerCase() === email && c.password === password,
  );
  if (!matches) {
    return { error: "Try admin@acme.demo / demo1234" };
  }
  await logInAsDemo();
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
