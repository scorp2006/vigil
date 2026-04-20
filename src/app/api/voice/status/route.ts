import type { NextRequest } from "next/server";
import { logCallEvent } from "@/lib/voice";

export async function POST(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const empId = searchParams.get("emp") || "";
  const cmpId = searchParams.get("cmp") || "";
  const form = await req.formData();
  const status = String(form.get("CallStatus") || "");
  await logCallEvent({
    campaignId: cmpId,
    employeeId: empId,
    type: "call_status",
    meta: { status },
  });
  return new Response("ok", { status: 200 });
}
