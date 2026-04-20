import type { NextRequest } from "next/server";
import { resolveTrackToken } from "@/lib/email";
import { logEvent } from "@/lib/risk";
import { db } from "@/lib/db";

const GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const resolved = await resolveTrackToken(token);
  if (resolved) {
    const tpl = await db.campaign.findUnique({
      where: { id: resolved.campaignId },
      include: { template: true },
    });
    await logEvent({
      orgId: resolved.orgId,
      employeeId: resolved.employeeId,
      campaignId: resolved.campaignId,
      type: "opened",
      channel: "email",
      meta: { category: tpl?.template?.category },
    });
  }
  return new Response(GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store",
    },
  });
}
