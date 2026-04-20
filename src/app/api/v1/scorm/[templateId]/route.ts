import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashApiKey } from "@/lib/crypto";
import { buildScormPackage } from "@/lib/lms";

export async function GET(req: NextRequest, ctx: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await ctx.params;
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return new Response("missing bearer", { status: 401 });

  const keyHash = hashApiKey(token);
  const key = await db.apiKey.findUnique({ where: { keyHash } });
  if (!key) return new Response("invalid api key", { status: 401 });

  const template = await db.template.findFirst({ where: { id: templateId, orgId: key.orgId } });
  if (!template || !template.trainingModuleJson)
    return new Response("template not found", { status: 404 });

  const mod = JSON.parse(template.trainingModuleJson);
  const pkg = buildScormPackage({
    title: mod.title,
    summary: mod.summary,
    lesson: mod.lesson,
    quiz: mod.quiz,
  });

  return new Response(pkg, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "X-Vigil-Hint":
        "This JSON is a minimal SCORM bundle. In production we emit a zip containing imsmanifest.xml and index.html.",
    },
  });
}
