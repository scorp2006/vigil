"use server";

import { resolveTrackToken } from "@/lib/email";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/risk";

export async function markSubmitted(token: string) {
  const resolved = await resolveTrackToken(token);
  if (!resolved) return;
  const campaign = await db.campaign.findUnique({
    where: { id: resolved.campaignId },
    include: { template: true },
  });
  await logEvent({
    orgId: resolved.orgId,
    employeeId: resolved.employeeId,
    campaignId: resolved.campaignId,
    type: "submitted",
    channel: "email",
    meta: { category: campaign?.template?.category },
  });
}

export async function markReported(token: string) {
  const resolved = await resolveTrackToken(token);
  if (!resolved) return;
  const campaign = await db.campaign.findUnique({
    where: { id: resolved.campaignId },
    include: { template: true },
  });
  const age = Date.now() - resolved.createdAt.getTime();
  await logEvent({
    orgId: resolved.orgId,
    employeeId: resolved.employeeId,
    campaignId: resolved.campaignId,
    type: "reported",
    channel: "email",
    meta: { category: campaign?.template?.category, fastSeconds: Math.floor(age / 1000) },
  });
}
