"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/session";
import { composeCampaign } from "@/lib/llm";
import { sendEmailCampaign } from "@/lib/email";
import { placeVishingCall } from "@/lib/voice";
import { logEvent } from "@/lib/risk";

export async function composeCampaignAction(opts: {
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

  return { blocked: false as const, template: tpl, spec: result };
}

export async function launchCampaign(opts: {
  templateId: string;
  name: string;
  targets: string[];
  channel: "email" | "voice" | "multi";
}) {
  const { org } = await requireOrg();
  const template = await db.template.findFirst({
    where: { id: opts.templateId, orgId: org.id },
  });
  if (!template) return { error: "Template not found." };

  const targets = await db.employee.findMany({
    where: { orgId: org.id, id: { in: opts.targets } },
  });
  if (targets.length === 0) return { error: "No targets selected." };

  const campaign = await db.campaign.create({
    data: {
      orgId: org.id,
      name: opts.name || template.name,
      channel: opts.channel,
      templateId: template.id,
      targetJson: JSON.stringify(targets.map((t) => t.id)),
      status: "running",
      launchedAt: new Date(),
    },
  });

  const results = { sent: 0, called: 0, failed: 0 };
  for (const emp of targets) {
    try {
      if (opts.channel === "email" || opts.channel === "multi") {
        await sendEmailCampaign({ campaign, template, employee: emp });
        await logEvent({
          orgId: org.id,
          employeeId: emp.id,
          campaignId: campaign.id,
          type: "sent",
          channel: "email",
          meta: { category: template.category },
        });
        results.sent += 1;
      }
      if (opts.channel === "voice" || opts.channel === "multi") {
        if (emp.phone) {
          await placeVishingCall({ campaign, template, employee: emp });
          await logEvent({
            orgId: org.id,
            employeeId: emp.id,
            campaignId: campaign.id,
            type: "call_placed",
            channel: "voice",
            meta: { category: template.category },
          });
          results.called += 1;
        }
      }
    } catch (e) {
      console.error("send failed", e);
      results.failed += 1;
    }
  }

  await db.campaign.update({
    where: { id: campaign.id },
    data: { status: "completed", completedAt: new Date() },
  });

  revalidatePath("/campaigns");
  revalidatePath("/dashboard");
  revalidatePath("/risk");
  return { ok: true, campaignId: campaign.id, ...results };
}
