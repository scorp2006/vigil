import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { buildTwiml, logCallEvent } from "@/lib/voice";

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}

async function handle(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tplId = searchParams.get("tpl") || "";
  const empId = searchParams.get("emp") || "";
  const cmpId = searchParams.get("cmp") || "";

  const template = await db.template.findUnique({ where: { id: tplId } });
  if (!template) {
    return new Response("<Response><Say>Invalid call.</Say></Response>", {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }

  await logCallEvent({
    campaignId: cmpId,
    employeeId: empId,
    type: "call_answered",
    meta: { category: template.category },
  });

  const gatherUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/voice/gather?tpl=${encodeURIComponent(tplId)}&emp=${encodeURIComponent(empId)}&cmp=${encodeURIComponent(cmpId)}`;
  const twiml = buildTwiml({
    voiceScript: template.voiceScript || "Hello, this is a simulated security training call.",
    gatherActionUrl: gatherUrl,
  });

  return new Response(twiml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
