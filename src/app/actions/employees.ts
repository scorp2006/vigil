"use server";

import Papa from "papaparse";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/session";

type CsvRow = Record<string, string | undefined>;

function norm(s: unknown) {
  return (s ?? "").toString().trim();
}

function pick(row: CsvRow, keys: string[]) {
  for (const k of keys) {
    const v = row[k] ?? row[k.toLowerCase()] ?? row[k.toUpperCase()];
    if (v && norm(v)) return norm(v);
  }
  return "";
}

export async function importEmployeesCsv(formData: FormData) {
  const { org } = await requireOrg();
  const raw = String(formData.get("csv") || "").trim();
  if (!raw) return { error: "No CSV provided." };

  const parsed = Papa.parse<CsvRow>(raw, { header: true, skipEmptyLines: true });
  if (parsed.errors.length > 0) {
    return { error: `CSV parse error: ${parsed.errors[0].message}` };
  }

  let created = 0;
  let updated = 0;
  const groupCache = new Map<string, string>();

  for (const row of parsed.data) {
    const email = pick(row, ["email", "Email", "work_email"]).toLowerCase();
    const name = pick(row, ["name", "Name", "full_name", "fullName"]);
    const phone = pick(row, ["phone", "Phone", "mobile", "phone_number"]);
    const department = pick(row, ["department", "Department", "team", "dept"]);
    const locale = pick(row, ["locale", "language"]) || "en";
    if (!email || !name) continue;

    let groupId: string | null = null;
    if (department) {
      let cached = groupCache.get(department);
      if (!cached) {
        const groupKey = `${org.id}_${department}`;
        const g = await db.group.upsert({
          where: { id: groupKey },
          update: {},
          create: { id: groupKey, name: department, orgId: org.id },
        });
        cached = g.id;
        groupCache.set(department, cached);
      }
      groupId = cached;
    }

    const existing = await db.employee.findUnique({
      where: { orgId_email: { orgId: org.id, email } },
    });

    if (existing) {
      await db.employee.update({
        where: { id: existing.id },
        data: { name, phone: phone || null, department: department || null, groupId, locale },
      });
      updated += 1;
    } else {
      await db.employee.create({
        data: {
          orgId: org.id,
          email,
          name,
          phone: phone || null,
          department: department || null,
          groupId,
          locale,
        },
      });
      created += 1;
    }
  }

  revalidatePath("/employees");
  revalidatePath("/dashboard");
  return { ok: true, created, updated };
}

export async function deleteEmployee(id: string) {
  const { org } = await requireOrg();
  await db.employee.deleteMany({ where: { id, orgId: org.id } });
  revalidatePath("/employees");
}

export async function markConsent(id: string) {
  const { org } = await requireOrg();
  await db.employee.updateMany({
    where: { id, orgId: org.id },
    data: { consent: true, consentAt: new Date() },
  });
  revalidatePath("/employees");
}
