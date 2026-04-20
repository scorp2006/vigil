"use server";

import { resolveTrackToken } from "@/lib/email";
import { logEvent } from "@/lib/risk";
import { db } from "@/lib/db";

export async function completeTraining(
  token: string,
  result: { score: number; total: number; passed: boolean },
) {
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
    type: "training_completed",
    channel: "training",
    meta: { category: campaign?.template?.category, score: result.score, total: result.total },
  });
  if (result.passed) {
    await logEvent({
      orgId: resolved.orgId,
      employeeId: resolved.employeeId,
      campaignId: resolved.campaignId,
      type: "quiz_passed",
      channel: "training",
      meta: { category: campaign?.template?.category },
    });
  }
}
