import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashApiKey } from "@/lib/crypto";
import { prescriptionFor } from "@/lib/lms";

export async function GET(req: NextRequest, ctx: { params: Promise<{ employeeId: string }> }) {
  const { employeeId } = await ctx.params;
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "missing bearer token" }, 401);

  const keyHash = await hashApiKey(token);
  const key = await db.apiKey.findUnique({ where: { keyHash } });
  if (!key) return json({ error: "invalid api key" }, 401);

  const employee = await db.employee.findFirst({
    where: { id: employeeId, orgId: key.orgId },
  });
  if (!employee) return json({ error: "employee not found" }, 404);

  const pres = await prescriptionFor(employeeId);
  await db.apiKey.update({ where: { id: key.id }, data: { lastUsed: new Date() } });
  return json(pres, 200);
}

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
