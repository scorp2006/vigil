import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { logCallEvent } from "@/lib/voice";

export async function POST(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const empId = searchParams.get("emp") || "";
  const cmpId = searchParams.get("cmp") || "";
  const tplId = searchParams.get("tpl") || "";

  const form = await req.formData();
  const digits = String(form.get("Digits") || "");
  const speech = String(form.get("SpeechResult") || "");

  const template = await db.template.findUnique({ where: { id: tplId } });

  const complied = digits === "1" || /yes|ok|sure|go ahead|proceed/i.test(speech);

  await logCallEvent({
    campaignId: cmpId,
    employeeId: empId,
    type: complied ? "call_complied" : "call_dtmf",
    meta: { digits, speech, category: template?.category },
  });

  const closing = complied
    ? "Thank you. This was a simulated security training call from Vigil. You&apos;ll receive a short training email to help you spot this class of attack. Take care."
    : "Thank you for staying alert. This was a simulated security training call from Vigil. Well done for being cautious. Goodbye.";

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi">${closing}</Say>
  <Hangup/>
</Response>`,
    { status: 200, headers: { "Content-Type": "text/xml" } },
  );
}
