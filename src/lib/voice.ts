import type { Campaign, Employee, Template } from "@/generated/prisma/client";
import { db } from "@/lib/db";

type CallArgs = { campaign: Campaign; template: Template; employee: Employee };

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function placeVishingCall({ campaign, template, employee }: CallArgs) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const to = employee.phone;
  if (!to) return { mode: "no-phone" as const };

  const twimlUrl = `${getBaseUrl()}/api/voice/twiml?tpl=${encodeURIComponent(template.id)}&emp=${encodeURIComponent(employee.id)}&cmp=${encodeURIComponent(campaign.id)}`;
  const statusUrl = `${getBaseUrl()}/api/voice/status?cmp=${encodeURIComponent(campaign.id)}&emp=${encodeURIComponent(employee.id)}`;

  if (!sid || !token || !from) {
    console.log(`[vigil preview] vishing call would be placed to ${to} playing ${twimlUrl}`);
    return { mode: "preview" as const };
  }

  const body = new URLSearchParams({
    To: to,
    From: from,
    Url: twimlUrl,
    StatusCallback: statusUrl,
    StatusCallbackEvent: "initiated ringing answered completed",
    StatusCallbackMethod: "POST",
  });

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("Twilio error", res.status, text);
    return { mode: "twilio-error" as const, status: res.status };
  }
  return { mode: "twilio" as const };
}

export function buildTwiml(opts: {
  voiceScript: string;
  gatherActionUrl: string;
  locale?: string;
}): string {
  const voice = "Polly.Aditi";
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const script = esc(opts.voiceScript || "Hello, this is a test call.");
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">This call may be recorded for quality and training. You are receiving a simulated security training call from Vigil.</Say>
  <Pause length="1"/>
  <Gather input="dtmf speech" action="${opts.gatherActionUrl}" method="POST" timeout="6" numDigits="1" speechTimeout="auto">
    <Say voice="${voice}">${script}</Say>
  </Gather>
  <Say voice="${voice}">No response received. Goodbye.</Say>
  <Hangup/>
</Response>`;
}

export async function logCallEvent(opts: {
  campaignId: string;
  employeeId: string;
  type: string;
  meta?: Record<string, unknown>;
}) {
  const emp = await db.employee.findUnique({ where: { id: opts.employeeId }, select: { orgId: true } });
  if (!emp) return;
  await db.event.create({
    data: {
      orgId: emp.orgId,
      campaignId: opts.campaignId,
      employeeId: opts.employeeId,
      type: opts.type,
      channel: "voice",
      meta: opts.meta ? JSON.stringify(opts.meta) : null,
    },
  });
}
