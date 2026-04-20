import { db } from "@/lib/db";
import { randomId } from "@/lib/crypto";
import type { Campaign, Employee, Template } from "@/generated/prisma/client";

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function buildTrackedBody(bodyHtml: string, trackId: string) {
  const trackUrl = `${getBaseUrl()}/lure/${trackId}`;
  const pixel = `<img src="${getBaseUrl()}/api/track/open/${trackId}" width="1" height="1" style="display:block" alt="" />`;
  return (bodyHtml || "").replaceAll("{{TRACK_URL}}", trackUrl) + pixel;
}

type SendArgs = { campaign: Campaign; template: Template; employee: Employee };

export async function createTrackToken(opts: { orgId: string; campaignId: string; employeeId: string }) {
  const id = randomId(10);
  await db.trackToken.create({
    data: {
      id,
      orgId: opts.orgId,
      campaignId: opts.campaignId,
      employeeId: opts.employeeId,
    },
  });
  return id;
}

export async function resolveTrackToken(trackId: string) {
  const t = await db.trackToken.findUnique({ where: { id: trackId } });
  if (!t) return null;
  return { orgId: t.orgId, campaignId: t.campaignId, employeeId: t.employeeId, createdAt: t.createdAt };
}

export async function sendEmailCampaign({ campaign, template, employee }: SendArgs) {
  const trackId = await createTrackToken({
    orgId: employee.orgId,
    campaignId: campaign.id,
    employeeId: employee.id,
  });
  const body = buildTrackedBody(template.bodyHtml || "", trackId);
  const subject = template.subject || "Notice";
  const fromName = template.fromName || "Notifications";
  const fromEmail = template.fromEmail || process.env.EMAIL_FROM || "alerts@vigil-demo.local";
  const provider = process.env.EMAIL_PROVIDER;

  if (provider === "resend" && process.env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromName} <${process.env.EMAIL_FROM || fromEmail}>`,
        to: [employee.email],
        subject,
        html: body,
      }),
    });
    if (!res.ok) {
      console.error("Resend error", res.status, await res.text());
    }
    return { mode: "resend" as const, trackId };
  }

  if (provider === "smtp" && process.env.SMTP_HOST) {
    // SMTP path available by installing nodemailer. Not bundled in MVP to keep deps light.
    // Uncomment and install `nodemailer` when needed, or prefer Resend.
    console.log(`[vigil preview] SMTP not enabled in MVP build — email to ${employee.email}: ${subject}`);
    return { mode: "preview" as const, trackId };
  }

  console.log(`[vigil preview] email to ${employee.email}: ${subject} (track=${trackId})`);
  return { mode: "preview" as const, trackId };
}
