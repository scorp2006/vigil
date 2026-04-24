"use server";

import { db } from "@/lib/db";
import { requireOrg } from "@/lib/session";

type Answer = { answer: string } | { error: string };

/**
 * Ask Vigil AI a question grounded in the current tenant's data.
 *
 * Strategy: pull a compact data brief (counts, top risks, recent funnel) so
 * answers reference real numbers — never made-up. With LLM_API_KEY set, hand
 * the brief + question to an OpenAI-compatible endpoint. Without a key, fall
 * back to a deterministic responder that handles common questions; the
 * preview behavior matches Vigil's "works without API keys" philosophy.
 */
export async function askVigilAi(question: string): Promise<Answer> {
  const q = question.trim();
  if (!q) return { error: "Ask me something specific." };
  if (q.length > 500) return { error: "Keep it under 500 characters." };

  try {
    const { org } = await requireOrg();
    const brief = await buildBrief(org.id);

    if (process.env.LLM_API_KEY) {
      const llmAnswer = await callLlm(brief, q);
      if (llmAnswer) return { answer: llmAnswer };
    }
    return { answer: deterministicAnswer(q, brief) };
  } catch (err) {
    console.error("[ask-vigil] failed:", err);
    return { error: "Could not reach the AI right now. Try again in a moment." };
  }
}

/* ── Data brief ───────────────────────────────────────────────────── */

type Brief = {
  orgName: string;
  employeeCount: number;
  highRiskCount: number;
  highRiskPct: number;
  reportRate30: number;
  reportRatePrev30: number;
  reportRateDelta: number;
  topRisks: Array<{ name: string; department: string | null; score: number; band: string }>;
  byDept: Array<{ name: string; avg: number; count: number; critical: number; high: number }>;
  activeCampaigns: number;
  nextCampaign: { name: string; scheduledAt: Date | null } | null;
  events7Total: number;
};

async function buildBrief(orgId: string): Promise<Brief> {
  const now = new Date();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600_000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 3600_000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600_000);

  const [
    org, employees, events30, eventsPrev30, events7Total,
    activeCampaigns, nextCampaign,
  ] = await Promise.all([
    db.org.findUnique({ where: { id: orgId } }),
    db.employee.findMany({
      where: { orgId },
      include: { riskScore: true },
    }),
    db.event.findMany({
      where: { orgId, createdAt: { gte: thirtyDaysAgo } },
      select: { type: true },
    }),
    db.event.findMany({
      where: { orgId, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      select: { type: true },
    }),
    db.event.count({ where: { orgId, createdAt: { gte: sevenDaysAgo } } }),
    db.campaign.count({ where: { orgId, status: { in: ["running", "scheduled"] } } }),
    db.campaign.findFirst({
      where: { orgId, status: "scheduled", scheduledAt: { gte: now } },
      orderBy: { scheduledAt: "asc" },
      select: { name: true, scheduledAt: true },
    }),
  ]);

  const sent30 = events30.filter((e) => e.type === "sent").length;
  const reported30 = events30.filter((e) => e.type === "reported").length;
  const reportRate30 = sent30 > 0 ? Math.round((reported30 / sent30) * 100) : 0;
  const sentPrev = eventsPrev30.filter((e) => e.type === "sent").length;
  const reportedPrev = eventsPrev30.filter((e) => e.type === "reported").length;
  const reportRatePrev30 = sentPrev > 0 ? Math.round((reportedPrev / sentPrev) * 100) : 0;

  const ranked = employees.filter((e) => e.riskScore);
  const highRiskCount = ranked.filter((e) => {
    const b = e.riskScore?.band;
    return b === "critical" || b === "high";
  }).length;
  const highRiskPct = ranked.length ? Math.round((highRiskCount / ranked.length) * 100) : 0;

  const topRisks = [...ranked]
    .sort((a, b) => (b.riskScore?.score ?? 0) - (a.riskScore?.score ?? 0))
    .slice(0, 5)
    .map((e) => ({
      name: e.name,
      department: e.department,
      score: Math.round(e.riskScore?.score ?? 0),
      band: e.riskScore?.band ?? "low",
    }));

  type DeptAgg = { sum: number; count: number; critical: number; high: number };
  const byDeptMap = new Map<string, DeptAgg>();
  for (const e of ranked) {
    const dept = e.department || "Unassigned";
    const cur = byDeptMap.get(dept) || { sum: 0, count: 0, critical: 0, high: 0 };
    cur.sum += e.riskScore?.score ?? 0;
    cur.count += 1;
    if (e.riskScore?.band === "critical") cur.critical += 1;
    if (e.riskScore?.band === "high") cur.high += 1;
    byDeptMap.set(dept, cur);
  }
  const byDept = Array.from(byDeptMap.entries())
    .map(([name, a]) => ({ name, avg: a.count ? a.sum / a.count : 0, count: a.count, critical: a.critical, high: a.high }))
    .sort((a, b) => b.avg - a.avg);

  return {
    orgName: org?.name ?? "the workspace",
    employeeCount: employees.length,
    highRiskCount,
    highRiskPct,
    reportRate30,
    reportRatePrev30,
    reportRateDelta: reportRate30 - reportRatePrev30,
    topRisks,
    byDept,
    activeCampaigns,
    nextCampaign: nextCampaign
      ? { name: nextCampaign.name, scheduledAt: nextCampaign.scheduledAt }
      : null,
    events7Total,
  };
}

/* ── LLM call ─────────────────────────────────────────────────────── */

async function callLlm(brief: Brief, question: string): Promise<string | null> {
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1";
  const model = process.env.LLM_MODEL || "llama-3.3-70b-versatile";
  if (!apiKey) return null;

  const briefText = `
ORG: ${brief.orgName}
Employees: ${brief.employeeCount} total, ${brief.highRiskCount} high/critical-risk (${brief.highRiskPct}% of ranked).
30-day report rate: ${brief.reportRate30}% (was ${brief.reportRatePrev30}%, delta ${brief.reportRateDelta >= 0 ? "+" : ""}${brief.reportRateDelta}pp).
Active+scheduled campaigns: ${brief.activeCampaigns}.
${brief.nextCampaign ? `Next scheduled: "${brief.nextCampaign.name}" at ${brief.nextCampaign.scheduledAt?.toISOString() ?? "TBD"}.` : "Nothing scheduled."}
Last 7 days events: ${brief.events7Total}.

Top 5 high-risk people:
${brief.topRisks.map((r) => `- ${r.name} (${r.department ?? "—"}): score ${r.score}, ${r.band}`).join("\n")}

Departments by avg risk (high to low):
${brief.byDept.slice(0, 8).map((d) => `- ${d.name}: avg ${d.avg.toFixed(1)} across ${d.count} (critical=${d.critical}, high=${d.high})`).join("\n")}
`.trim();

  const system = `You are Vigil, a security-program copilot. Answer the user's question using only the data brief below.
Be concise (2-4 sentences max). Cite specific numbers and names from the brief when relevant. If the answer requires data not in the brief, say "I don't have that data yet" instead of guessing.
Never invent employees, campaigns, or numbers. Stay grounded.`;

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          { role: "system", content: system },
          { role: "user", content: `DATA BRIEF:\n${briefText}\n\nQUESTION:\n${question}` },
        ],
      }),
    });
    if (!res.ok) {
      console.error("LLM error", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    return typeof raw === "string" ? raw.trim() : null;
  } catch (err) {
    console.error("[ask-vigil] LLM call failed:", err);
    return null;
  }
}

/* ── Deterministic fallback ──────────────────────────────────────── */

function deterministicAnswer(question: string, b: Brief): string {
  const q = question.toLowerCase();

  // Report rate / trend
  if (/(report rate|reporting|trend|report)/.test(q)) {
    const dir = b.reportRateDelta > 0 ? "climbing" : b.reportRateDelta < 0 ? "slipping" : "flat";
    const verdict =
      b.reportRate30 >= 25
        ? "That's a healthy signal — your team is treating phishing simulations as a fire drill, not a trap."
        : b.reportRate30 >= 10
          ? "There's room to grow. Focus the next campaign on the departments with the lowest engagement."
          : "Low report rates mean your people aren't sure what to do when something feels off. A coaching campaign would help.";
    return `Your 30-day report rate is ${b.reportRate30}% (${b.reportRateDelta >= 0 ? "+" : ""}${b.reportRateDelta}pp vs prior 30 days — ${dir}). ${verdict}`;
  }

  // Department / training
  if (/(department|dept|train|risky group|focus)/.test(q)) {
    if (b.byDept.length === 0) return "No risk data yet — launch a campaign and I'll be able to point at specific departments.";
    const worst = b.byDept[0];
    return `${worst.name} has the highest average risk (${worst.avg.toFixed(0)}, across ${worst.count} people, ${worst.critical} critical + ${worst.high} high). Targeting them with a campaign in their weakest category would lift the whole org.`;
  }

  // High-risk people
  if (/(high.?risk|risky people|who.*risk|critical|worst)/.test(q)) {
    if (b.topRisks.length === 0) return "No risk scores yet. Run a campaign to populate.";
    const list = b.topRisks.slice(0, 3).map((r) => `${r.name} (${r.score}, ${r.band})`).join(", ");
    return `${b.highRiskCount} of ${b.employeeCount} (${b.highRiskPct}%) are high or critical. The top three: ${list}. Consider a 1:1 coaching nudge through the LMS Bridge.`;
  }

  // Campaign / next steps
  if (/(campaign|next|schedul|launch|simulat)/.test(q)) {
    if (b.nextCampaign) {
      return `"${b.nextCampaign.name}" is queued${b.nextCampaign.scheduledAt ? ` for ${b.nextCampaign.scheduledAt.toISOString().slice(0, 10)}` : ""}. ${b.activeCampaigns} active+scheduled in total. After that, alternate channels (email vs. voice) to keep the muscle warm.`;
    }
    return "Nothing scheduled. Compose a new campaign — Finance is usually the right starting place because invoice fraud is high-impact and high-frequency.";
  }

  // Generate scenario
  if (/(suggest|generate|create|propose|idea)/.test(q)) {
    return `For a fresh scenario: try a vendor-onboarding pretext aimed at Finance — a "new payment portal" email with a tracked link. It's relevant to ${b.orgName} as a banking org, plays on real workflow, and the training module pairs naturally with the existing Vendor invoice urgency template.`;
  }

  // Default
  return `I'm in preview mode (no LLM key configured) — but I can still tell you the basics: ${b.employeeCount} employees, ${b.highRiskCount} at high/critical risk (${b.highRiskPct}%), 30-day report rate ${b.reportRate30}% (${b.reportRateDelta >= 0 ? "+" : ""}${b.reportRateDelta}pp vs prior month). Set LLM_API_KEY in env to unlock open-ended answers.`;
}
