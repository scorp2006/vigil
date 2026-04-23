"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/session";
import { composeCampaign } from "@/lib/llm";

export async function generateTemplate(opts: {
  prompt: string;
  locale?: string;
  channel?: "email" | "voice" | "multi";
}) {
  const { org } = await requireOrg();
  const result = await composeCampaign(opts);
  if ("blocked" in result) return { blocked: true as const, reason: result.reason };

  const tpl = await db.template.create({
    data: {
      orgId: org.id,
      name: result.name,
      channel: opts.channel || "multi",
      category: result.category,
      locale: result.locale,
      subject: result.subject,
      fromName: result.fromName,
      fromEmail: result.fromEmail,
      bodyHtml: result.bodyHtml,
      landingHtml: JSON.stringify({
        headline: result.landingHeadline,
        subhead: result.landingSubhead,
        ctaLabel: result.ctaLabel,
      }),
      voiceScript: result.voiceScript,
      voicePersona: result.voicePersona,
      trainingModuleJson: JSON.stringify({
        title: result.training.title,
        summary: result.training.summary,
        lesson: result.training.lesson,
        quiz: result.training.quiz,
        redFlags: result.redFlags,
      }),
      generatedBy: process.env.LLM_API_KEY ? "ai" : "mock",
    },
  });

  revalidatePath("/templates");
  return { blocked: false as const, templateId: tpl.id };
}

export async function createTemplateManual(opts: {
  name: string;
  channel: "email" | "voice" | "multi";
  category: string;
  locale?: string;
  subject?: string;
  fromName?: string;
  fromEmail?: string;
  bodyHtml?: string;
  voiceScript?: string;
  voicePersona?: string;
}) {
  const { org } = await requireOrg();
  if (!opts.name.trim()) return { error: "Name is required." };
  if (!opts.category.trim()) return { error: "Category is required." };

  const tpl = await db.template.create({
    data: {
      orgId: org.id,
      name: opts.name.trim(),
      channel: opts.channel,
      category: opts.category.trim(),
      locale: opts.locale || "en",
      subject: opts.subject || null,
      fromName: opts.fromName || null,
      fromEmail: opts.fromEmail || null,
      bodyHtml: opts.bodyHtml || null,
      voiceScript: opts.voiceScript || null,
      voicePersona: opts.voicePersona || null,
      generatedBy: "manual",
    },
  });

  revalidatePath("/templates");
  return { ok: true as const, templateId: tpl.id };
}

export async function deleteTemplate(templateId: string) {
  const { org } = await requireOrg();
  const tpl = await db.template.findFirst({
    where: { id: templateId, orgId: org.id },
    include: { _count: { select: { campaigns: true } } },
  });
  if (!tpl) return { error: "Template not found." };
  if (tpl._count.campaigns > 0) {
    return {
      error: `Template is used by ${tpl._count.campaigns} campaign(s). Detach or delete those first.`,
    };
  }
  await db.template.delete({ where: { id: templateId } });
  revalidatePath("/templates");
  return { ok: true as const };
}
