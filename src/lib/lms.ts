import { db } from "@/lib/db";

const COURSE_CATALOG: Record<string, { scorm_id: string; title: string; est_minutes: number }[]> = {
  invoice_fraud: [
    { scorm_id: "vf_001", title: "Spotting vendor invoice fraud", est_minutes: 5 },
    { scorm_id: "vf_002", title: "Dual approval for bank detail changes", est_minutes: 3 },
  ],
  it_support: [
    { scorm_id: "it_001", title: "Never read your MFA code out loud", est_minutes: 4 },
    { scorm_id: "it_002", title: "Verifying helpdesk callers", est_minutes: 3 },
  ],
  credential_reset: [
    { scorm_id: "cr_001", title: "Recognizing credential harvesting", est_minutes: 5 },
  ],
  courier: [
    { scorm_id: "co_001", title: "Delivery scams at a glance", est_minutes: 3 },
  ],
  vendor_onboarding: [
    { scorm_id: "vo_001", title: "Onboarding-fraud counter-patterns", est_minutes: 4 },
  ],
  ceo_fraud: [
    { scorm_id: "ce_001", title: "CEO wire-request red flags", est_minutes: 4 },
  ],
  hr_form: [
    { scorm_id: "hr_001", title: "HR-themed pretexts", est_minutes: 3 },
  ],
  kyc: [
    { scorm_id: "kc_001", title: "Banking KYC pretexts", est_minutes: 4 },
  ],
  urgency_pressure: [
    { scorm_id: "ui_003", title: "Urgency as a red flag", est_minutes: 3 },
  ],
  voice_impersonation: [
    { scorm_id: "vi_001", title: "Spotting AI voice impersonation", est_minutes: 5 },
  ],
};

export async function prescriptionFor(employeeId: string) {
  const employee = await db.employee.findUnique({
    where: { id: employeeId },
    include: { riskScore: true },
  });
  if (!employee) return null;

  const score = Math.round(employee.riskScore?.score ?? 0);
  const band = employee.riskScore?.band ?? "low";
  let weak: string[] = [];
  try {
    weak = JSON.parse(employee.riskScore?.weakAreas ?? "[]");
  } catch {}

  const recommended: { scorm_id: string; title: string; est_minutes: number }[] = [];
  const seen = new Set<string>();
  for (const area of weak) {
    for (const c of COURSE_CATALOG[area] ?? []) {
      if (!seen.has(c.scorm_id)) {
        recommended.push(c);
        seen.add(c.scorm_id);
      }
    }
  }
  if (recommended.length === 0 && band !== "low") {
    recommended.push({ scorm_id: "ui_003", title: "Urgency as a red flag", est_minutes: 3 });
  }

  const lastEvent = await db.event.findFirst({
    where: {
      employeeId,
      type: { in: ["clicked", "submitted", "call_complied"] },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    employee_id: employee.id,
    risk_score: score,
    risk_band: band,
    weak_areas: weak,
    recommended_courses: recommended,
    last_incident: lastEvent?.createdAt?.toISOString() ?? null,
  };
}

export function buildScormPackage(opts: {
  title: string;
  summary: string;
  lesson: string;
  quiz: Array<{ q: string; options: string[]; correctIndex: number; explain: string }>;
}): string {
  const manifestId = "vigil." + Math.random().toString(36).slice(2, 10);
  const quizHtml = opts.quiz
    .map(
      (q, i) => `
    <div class="question" data-correct="${q.correctIndex}">
      <p><strong>Q${i + 1}.</strong> ${esc(q.q)}</p>
      ${q.options
        .map(
          (o, j) => `
      <label><input type="radio" name="q${i}" value="${j}"/> ${esc(o)}</label>`,
        )
        .join("")}
      <p class="explain" style="display:none;color:#555">${esc(q.explain)}</p>
    </div>`,
    )
    .join("\n");

  const html = `<!doctype html>
<html>
<head><meta charset="utf-8"/><title>${esc(opts.title)}</title>
<style>body{font:15px/1.5 system-ui,sans-serif;max-width:640px;margin:2rem auto;padding:1rem;color:#111}h1{margin-top:0}.question{margin:1rem 0;padding:1rem;border:1px solid #eee;border-radius:8px}label{display:block;margin:.25rem 0}</style>
</head>
<body>
<h1>${esc(opts.title)}</h1>
<p><em>${esc(opts.summary)}</em></p>
<div>${esc(opts.lesson).replace(/\n+/g, "</p><p>").replace(/^/, "<p>").concat("</p>")}</div>
<h2>Check your understanding</h2>
${quizHtml}
<button onclick="finish()">Finish</button>
<script>
var API=window.API_1484_11||window.API||null;function finish(){
  var qs=document.querySelectorAll('.question');var ok=0;
  qs.forEach(function(d){var c=+d.dataset.correct;var p=d.querySelector('input[type=radio]:checked');d.querySelector('.explain').style.display='block';if(p&&+p.value===c){ok++;}});
  if(API&&API.Initialize){API.Initialize('');API.SetValue('cmi.completion_status','completed');API.SetValue('cmi.score.raw',String(Math.round(ok/qs.length*100)));API.Commit('');API.Terminate('');}
  alert('You scored '+ok+' / '+qs.length+'. Progress sent to your LMS.');
}
</script>
</body></html>`;

  const imsmanifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${manifestId}" version="1.0"
  xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <metadata><schema>ADL SCORM</schema><schemaversion>2004 4th Edition</schemaversion></metadata>
  <organizations default="ORG-1">
    <organization identifier="ORG-1">
      <title>${esc(opts.title)}</title>
      <item identifier="ITEM-1" identifierref="RES-1"><title>${esc(opts.title)}</title></item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="RES-1" type="webcontent" adlcp:scormType="sco" href="index.html">
      <file href="index.html"/>
    </resource>
  </resources>
</manifest>`;

  return JSON.stringify({ "imsmanifest.xml": imsmanifest, "index.html": html });
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sendXapiStatement(opts: {
  orgId: string;
  actorEmail: string;
  verb: string;
  objectId: string;
  objectName: string;
  result?: { score?: number; success?: boolean; completion?: boolean };
}) {
  const config = await db.lmsConfig.findUnique({ where: { orgId: opts.orgId } });
  if (!config?.lrsEndpoint) return { mode: "no-lrs" as const };

  const statement = {
    actor: { mbox: `mailto:${opts.actorEmail}`, objectType: "Agent" },
    verb: { id: opts.verb, display: { "en-US": opts.verb.split("/").pop() } },
    object: {
      id: opts.objectId,
      definition: { name: { "en-US": opts.objectName } },
      objectType: "Activity",
    },
    result: opts.result,
    timestamp: new Date().toISOString(),
  };

  try {
    const res = await fetch(config.lrsEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Experience-API-Version": "1.0.3",
        ...(config.lrsAuth ? { Authorization: config.lrsAuth } : {}),
      },
      body: JSON.stringify(statement),
    });
    return { mode: res.ok ? ("sent" as const) : ("error" as const), status: res.status };
  } catch (e) {
    return { mode: "error" as const, error: String(e) };
  }
}
