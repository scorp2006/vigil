import { db } from "@/lib/db";

const WEIGHTS: Record<string, number> = {
  opened: 6,
  clicked: 18,
  submitted: 35,
  call_answered: 4,
  call_complied: 30,
  reported_fast: -22,
  reported: -12,
  training_completed: -6,
  quiz_passed: -4,
};

export type RiskBand = "low" | "medium" | "high" | "critical";

export function bandFor(score: number): RiskBand {
  if (score >= 70) return "critical";
  if (score >= 45) return "high";
  if (score >= 20) return "medium";
  return "low";
}

const DECAY_HALF_LIFE_DAYS = 45;

function weightDecayed(weight: number, eventAt: Date, now: Date) {
  const ageDays = (now.getTime() - eventAt.getTime()) / (1000 * 60 * 60 * 24);
  const factor = Math.pow(0.5, ageDays / DECAY_HALF_LIFE_DAYS);
  return weight * factor;
}

function mapEventType(type: string, meta?: string | null): string {
  if (type === "reported") {
    try {
      if (meta) {
        const m = JSON.parse(meta) as { fastSeconds?: number };
        if (typeof m.fastSeconds === "number" && m.fastSeconds < 5 * 60) return "reported_fast";
      }
    } catch {
      // fall through
    }
  }
  return type;
}

export async function recomputeEmployeeRisk(employeeId: string) {
  const events = await db.event.findMany({
    where: { employeeId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const now = new Date();
  let score = 0;
  const categoryHits: Record<string, number> = {};

  for (const e of events) {
    const key = mapEventType(e.type, e.meta);
    const w = WEIGHTS[key];
    if (typeof w === "number") {
      score += weightDecayed(w, e.createdAt, now);
    }
    if (e.meta) {
      try {
        const meta = JSON.parse(e.meta) as { category?: string };
        if (meta.category && (e.type === "clicked" || e.type === "submitted" || e.type === "call_complied")) {
          categoryHits[meta.category] = (categoryHits[meta.category] ?? 0) + 1;
        }
      } catch {
        // ignore
      }
    }
  }

  score = Math.max(0, Math.min(100, score));
  const band = bandFor(score);
  const weakAreas = Object.entries(categoryHits)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k);

  await db.riskScore.upsert({
    where: { employeeId },
    create: {
      employeeId,
      score,
      band,
      weakAreas: JSON.stringify(weakAreas),
      lastEventAt: events[0]?.createdAt ?? null,
    },
    update: {
      score,
      band,
      weakAreas: JSON.stringify(weakAreas),
      lastEventAt: events[0]?.createdAt ?? null,
    },
  });
  return { score, band, weakAreas };
}

export async function logEvent(opts: {
  orgId: string;
  employeeId: string;
  campaignId?: string;
  type: string;
  channel: string;
  meta?: Record<string, unknown>;
}) {
  await db.event.create({
    data: {
      orgId: opts.orgId,
      employeeId: opts.employeeId,
      campaignId: opts.campaignId,
      type: opts.type,
      channel: opts.channel,
      meta: opts.meta ? JSON.stringify(opts.meta) : null,
    },
  });
  await recomputeEmployeeRisk(opts.employeeId);
}
