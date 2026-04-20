"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/session";
import { hashApiKey, randomId } from "@/lib/crypto";

export async function createApiKey(name: string) {
  const { org } = await requireOrg();
  const key = "vgl_" + randomId(18);
  await db.apiKey.create({
    data: { orgId: org.id, name: name || "LMS key", keyHash: await hashApiKey(key) },
  });
  revalidatePath("/lms");
  return { key };
}

export async function deleteApiKey(id: string) {
  const { org } = await requireOrg();
  await db.apiKey.deleteMany({ where: { id, orgId: org.id } });
  revalidatePath("/lms");
}

export async function saveLrsConfig(formData: FormData) {
  const { org } = await requireOrg();
  const lrsEndpoint = String(formData.get("lrsEndpoint") || "").trim() || null;
  const lrsAuth = String(formData.get("lrsAuth") || "").trim() || null;
  await db.lmsConfig.upsert({
    where: { orgId: org.id },
    update: { lrsEndpoint, lrsAuth },
    create: { orgId: org.id, lrsEndpoint, lrsAuth },
  });
  revalidatePath("/lms");
}
