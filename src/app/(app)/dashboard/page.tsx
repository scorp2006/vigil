import Link from "next/link";
import { requireOrg } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, PageBody } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendChart } from "./trend-chart";
import {
  UsersIcon,
  MailOpenIcon,
  MousePointerClickIcon,
  FlagIcon,
  ArrowRightIcon,
  SparklesIcon,
  PhoneCallIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";

export default async function DashboardPage() {
  const { org } = await requireOrg();

  const [employeeCount, activeCampaigns, events30, recentEvents, risks] = await Promise.all([
    db.employee.count({ where: { orgId: org.id } }),
    db.campaign.count({ where: { orgId: org.id, status: { in: ["running", "scheduled"] } } }),
    db.event.findMany({
      where: {
        orgId: org.id,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600_000) },
      },
      select: { type: true, createdAt: true },
    }),
    db.event.findMany({
      where: { orgId: org.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { employee: { select: { name: true, department: true } } },
    }),
    db.riskScore.findMany({
      where: { employee: { orgId: org.id } },
      include: { employee: { select: { name: true, department: true } } },
      orderBy: { score: "desc" },
      take: 5,
    }),
  ]);

  type E30 = { type: string; createdAt: Date };
  const ev30 = events30 as E30[];
  const sent = ev30.filter((e: E30) => e.type === "sent").length;
  const clicked = ev30.filter((e: E30) => e.type === "clicked").length;
  const reported = ev30.filter((e: E30) => e.type === "reported").length;
  const clickRate = sent ? Math.round((clicked / sent) * 100) : 0;
  const reportRate = sent ? Math.round((reported / sent) * 100) : 0;

  const byDay = new Map<string, { day: string; click: number; report: number }>();
  for (const e of ev30) {
    const day = e.createdAt.toISOString().slice(0, 10);
    const entry = byDay.get(day) ?? { day, click: 0, report: 0 };
    if (e.type === "clicked") entry.click += 1;
    if (e.type === "reported") entry.report += 1;
    byDay.set(day, entry);
  }
  const trend = Array.from(byDay.values()).sort((a, b) => a.day.localeCompare(b.day));

  return (
    <div className="bg-slate-50/50">
      <PageHeader
        title={`Good to see you, ${org.name}`}
        description="Human risk at a glance. Launch an AI-generated campaign in under a minute."
        actions={
          <>
            <Link href="/campaigns/new">
              <Button className="gap-2 bg-blue-600 text-white shadow-sm hover:bg-blue-700">
                <SparklesIcon className="h-4 w-4" /> New campaign
              </Button>
            </Link>
            <Link href="/campaigns/new?mode=vishing">
              <Button variant="outline" className="gap-2 border-slate-200">
                <PhoneCallIcon className="h-4 w-4" /> Live vishing
              </Button>
            </Link>
          </>
        }
      />

      <PageBody className="space-y-6">
        {/* STAT CARDS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={UsersIcon}
            label="Enrolled employees"
            value={employeeCount}
            iconColor="bg-blue-50 text-blue-600"
          />
          <StatCard
            icon={MailOpenIcon}
            label="Active campaigns"
            value={activeCampaigns}
            iconColor="bg-violet-50 text-violet-600"
          />
          <StatCard
            icon={MousePointerClickIcon}
            label="30-day click rate"
            value={`${clickRate}%`}
            tone={clickRate > 15 ? "warning" : "default"}
            iconColor={clickRate > 15 ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-500"}
            trend={clickRate > 15 ? "up" : "down"}
          />
          <StatCard
            icon={FlagIcon}
            label="30-day report rate"
            value={`${reportRate}%`}
            tone="positive"
            iconColor="bg-emerald-50 text-emerald-600"
            trend="up"
          />
        </div>

        {/* TREND CHART */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <p className="font-semibold text-slate-900">Behavior over time</p>
            <p className="mt-0.5 text-sm text-slate-500">
              Clicks vs reports — 30 days. A healthy program shows reports climbing over time.
            </p>
          </div>
          <div className="h-[280px] p-6">
            <TrendChart data={trend} />
          </div>
        </div>

        {/* RISK TABLE + ACTIVITY */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Highest-risk */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <p className="font-semibold text-slate-900">Highest-risk employees</p>
              <Link
                href="/risk"
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Full heatmap <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50 p-4">
              {risks.length === 0 ? (
                <EmptyHint text="No risk data yet. Launch a campaign to populate." />
              ) : (
                (risks as Array<{ employeeId: string; score: number; band: string; employee: { name: string; department: string | null } }>).map((r) => (
                  <div key={r.employeeId} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{r.employee.name}</p>
                      <p className="text-xs text-slate-400">{r.employee.department || "—"}</p>
                    </div>
                    <RiskBadge band={r.band} score={Math.round(r.score)} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent activity */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="font-semibold text-slate-900">Recent activity</p>
            </div>
            <div className="divide-y divide-slate-50 p-4">
              {recentEvents.length === 0 ? (
                <EmptyHint text="Events will appear here as simulations run." />
              ) : (
                (recentEvents as Array<{ id: string; type: string; channel: string; createdAt: Date; employee: { name: string; department: string | null } }>).map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{e.employee.name}</p>
                      <p className="truncate text-xs text-slate-400">
                        {e.type.replaceAll("_", " ")} · {e.channel}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-slate-400">
                      {formatTimeAgo(e.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </PageBody>
    </div>
  );
}

function RiskBadge({ band, score }: { band: string; score: number }) {
  const variants: Record<string, string> = {
    critical: "bg-rose-50 text-rose-700 border-rose-200",
    high: "bg-amber-50 text-amber-700 border-amber-200",
    medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
    low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  const cls = variants[band] ?? variants.low;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {score} · {band}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
  iconColor = "bg-slate-50 text-slate-500",
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  tone?: "default" | "positive" | "warning";
  iconColor?: string;
  trend?: "up" | "down";
}) {
  const valueClass =
    tone === "positive"
      ? "text-emerald-600"
      : tone === "warning"
        ? "text-rose-600"
        : "text-slate-900";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
          <p className={`mt-2.5 text-3xl font-semibold tabular-nums tracking-tight ${valueClass}`}>
            {value}
          </p>
          {trend ? (
            <div className="mt-1.5 flex items-center gap-1">
              {trend === "up" ? (
                <TrendingUpIcon className={`h-3 w-3 ${tone === "positive" ? "text-emerald-500" : "text-rose-500"}`} />
              ) : (
                <TrendingDownIcon className="h-3 w-3 text-emerald-500" />
              )}
              <span className="text-xs text-slate-400">30 days</span>
            </div>
          ) : null}
        </div>
        <div className={`rounded-lg p-2.5 ${iconColor}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <p className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400">
      {text}
    </p>
  );
}

function formatTimeAgo(date: Date) {
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
