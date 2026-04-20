import { redirect } from "next/navigation";
import { resolveTrackToken } from "@/lib/email";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/risk";
import { TrainingModule } from "./training-module";

export default async function TrainPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const resolved = await resolveTrackToken(token);
  if (!resolved) redirect("/");

  const campaign = await db.campaign.findUnique({
    where: { id: resolved.campaignId },
    include: { template: true },
  });
  if (!campaign?.template?.trainingModuleJson) redirect("/");

  await logEvent({
    orgId: resolved.orgId,
    employeeId: resolved.employeeId,
    campaignId: resolved.campaignId,
    type: "training_started",
    channel: "training",
    meta: { category: campaign.template.category },
  });

  const mod = JSON.parse(campaign.template.trainingModuleJson) as {
    title: string;
    summary: string;
    lesson: string;
    quiz: Array<{ q: string; options: string[]; correctIndex: number; explain: string }>;
    redFlags?: string[];
  };

  return <TrainingModule token={token} module={mod} />;
}
