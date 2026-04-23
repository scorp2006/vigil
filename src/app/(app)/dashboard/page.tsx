import Link from "next/link";
import { requireOrg } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, PageBody } from "@/components/page-header";
import { BandPill } from "@/components/vigil-ui";
import {
  ArrowUpRightIcon,
  PlayIcon,
  PlusIcon,
  CalendarIcon,
  MailOpenIcon,
  MousePointerClickIcon,
  FlagIcon,
  GraduationCapIcon,
  PhoneCallIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from "lucide-react";

export default async function DashboardPage() {
  const { org } = await requireOrg();

  const now = new Date();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600_000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600_000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 3600_000);

  const [
    employeeCount,
    nextCampaign,
    events7,
    events30,
    eventsPrev30,
    recentActivity,
    risks,
    riskBands,
  ] = await Promise.all([
    db.employee.count({ where: { orgId: org.id } }),
    db.campaign.findFirst({
      where: { orgId: org.id, status: "scheduled", scheduledAt: { gte: now } },
      orderBy: { scheduledAt: "asc" },
      include: { template: { select: { name: true, channel: true } } },
    }),
    db.event.findMany({
      where: { orgId: org.id, createdAt: { gte: sevenDaysAgo } },
      select: { type: true, createdAt: true },
    }),
    db.event.findMany({
      where: { orgId: org.id, createdAt: { gte: thirtyDaysAgo } },
      select: { type: true },
    }),
    db.event.findMany({
      where: {
        orgId: org.id,
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
      select: { type: true },
    }),
    db.event.findMany({
      where: { orgId: org.id },
      orderBy: { createdAt: "desc" },
      take: 7,
      include: { employee: { select: { name: true } } },
    }),
    db.riskScore.findMany({
      where: { employee: { orgId: org.id } },
      include: { employee: { select: { name: true, department: true } } },
      orderBy: { score: "desc" },
      take: 5,
    }),
    db.riskScore.findMany({
      where: { employee: { orgId: org.id } },
      select: { band: true },
    }),
  ]);

  // 30-day report rate (feature KPI)
  const sent30 = events30.filter((e) => e.type === "sent").length;
  const reported30 = events30.filter((e) => e.type === "reported").length;
  const reportRate = sent30 > 0 ? Math.round((reported30 / sent30) * 100) : 0;

  const sentPrev = eventsPrev30.filter((e) => e.type === "sent").length;
  const reportedPrev = eventsPrev30.filter((e) => e.type === "reported").length;
  const reportRatePrev = sentPrev > 0 ? Math.round((reportedPrev / sentPrev) * 100) : 0;
  const reportRateDelta = reportRate - reportRatePrev;

  // High-risk
  const highRiskCount = riskBands.filter((r) => r.band === "critical" || r.band === "high").length;
  const totalRanked = riskBands.length || 1;
  const highRiskPct = ((highRiskCount / totalRanked) * 100).toFixed(1);

  // 7-day activity chart
  const weekday = ["S", "M", "T", "W", "T", "F", "S"];
  const buckets = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    return { day: weekday[d.getDay()], date: d.toISOString().slice(0, 10), count: 0 };
  });
  for (const e of events7) {
    const k = e.createdAt.toISOString().slice(0, 10);
    const slot = buckets.find((b) => b.date === k);
    if (slot) slot.count += 1;
  }
  const max = Math.max(...buckets.map((b) => b.count), 1);
  const peakIdx = buckets.reduce((bestIdx, b, i, arr) => (b.count > arr[bestIdx].count ? i : bestIdx), 0);
  const bars = buckets.map((b, i) => ({
    ...b,
    height: Math.max(8, Math.round((b.count / max) * 100)),
    variant: i === peakIdx ? "peak" : b.count >= max * 0.55 ? "solid" : b.count >= max * 0.35 ? "mid" : "hatch",
  }));

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="How your program is doing, at a glance."
        actions={
          <Link href="/campaigns/new" className="pill-btn primary">
            <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.5} /> New Campaign
          </Link>
        }
      />

      <PageBody>
        {/* ── ROW 1: Program health stats (3 cards, feature = report rate) ── */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Employees" value={employeeCount} sub={`${totalRanked} ranked`} />
          <FeatureStat
            label="30-day report rate"
            value={`${reportRate}%`}
            delta={reportRateDelta}
            sub={reportRateDelta === 0 ? "Unchanged vs prior 30 days" : `${reportRateDelta > 0 ? "+" : ""}${reportRateDelta}pp vs prior 30 days`}
          />
          <Stat
            label="High-risk"
            value={highRiskCount}
            tone={highRiskCount > 0 ? "rose" : "green"}
            sub={`${highRiskPct}% of ranked workforce`}
          />
        </div>

        {/* ── ROW 2: What's happening + what's next ── */}
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Card>
            <CardHead
              title="Last 7 days"
              trailing={<span className="text-xs text-ink-3">Events per day</span>}
            />
            <div className="flex h-[180px] items-end gap-3.5 py-2">
              {bars.map((b, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div className="relative w-full" style={{ height: "100%" }}>
                    <div
                      className={`absolute bottom-0 w-full rounded-full ${
                        b.variant === "peak"
                          ? "bg-green"
                          : b.variant === "solid"
                            ? "bg-green-active"
                            : b.variant === "mid"
                              ? ""
                              : "border border-green-soft"
                      }`}
                      style={{
                        height: `${b.height}%`,
                        background:
                          b.variant === "mid"
                            ? "#4ca371"
                            : b.variant === "hatch"
                              ? "repeating-linear-gradient(45deg,var(--green-soft) 0 6px,transparent 6px 10px)"
                              : undefined,
                      }}
                    >
                      {b.variant === "peak" && b.count > 0 ? (
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-white">
                          {b.count}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-ink-3">{b.day}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHead title="Next up" />
            {nextCampaign ? (
              <>
                <div className="text-xl font-semibold text-ink">{nextCampaign.name}</div>
                <div className="mt-1 mb-5 flex items-center gap-1.5 text-[13px] text-ink-3">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {nextCampaign.scheduledAt
                    ? `${formatDateLong(nextCampaign.scheduledAt)} · ${parseTargets(nextCampaign.targetJson)} targets`
                    : "—"}
                </div>
                <Link
                  href={`/campaigns/${nextCampaign.id}`}
                  className="pill-btn primary justify-center !px-3 !py-3.5"
                  style={{ width: "100%" }}
                >
                  <PlayIcon className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
                  Launch now
                </Link>
              </>
            ) : (
              <>
                <div className="text-xl font-semibold text-ink">Nothing scheduled</div>
                <div className="mt-1 mb-5 text-[13px] text-ink-3">
                  Plan a campaign to keep the muscle warm.
                </div>
                <Link
                  href="/campaigns/new"
                  className="pill-btn primary justify-center !px-3 !py-3.5"
                  style={{ width: "100%" }}
                >
                  <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.5} /> Plan one
                </Link>
              </>
            )}
          </Card>
        </div>

        {/* ── ROW 3: Who needs attention + what just happened ── */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHead
              title="High-risk employees"
              trailing={<Link href="/risk" className="more-btn">View all →</Link>}
            />
            <div className="flex flex-col">
              {risks.length === 0 ? (
                <EmptyHint text="No risk data yet. Launch a campaign to populate." />
              ) : (
                risks.map((r) => (
                  <div
                    key={r.employeeId}
                    className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0"
                  >
                    <Avatar name={r.employee.name} band={r.band} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink">{r.employee.name}</div>
                      <div className="text-xs text-ink-3">{r.employee.department || "—"}</div>
                    </div>
                    <BandPill band={r.band} score={Math.round(r.score)} />
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <CardHead
              title="Recent activity"
              trailing={<Link href="/campaigns" className="more-btn">All events →</Link>}
            />
            {recentActivity.length === 0 ? (
              <EmptyHint text="Events will appear here as simulations run." />
            ) : (
              <ul className="flex flex-col">
                {recentActivity.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center gap-3 border-b border-line py-3 text-sm last:border-b-0"
                  >
                    <EventGlyph type={e.type} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-ink">
                        <span className="font-semibold">{e.employee.name}</span>{" "}
                        <span className="text-ink-2">{formatEventVerb(e.type)}</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-ink-3">
                      {formatTimeAgo(e.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </PageBody>
    </>
  );
}

/* ── Sub-components ───────────────────────────────────────────────── */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`panel flex flex-col p-6 ${className}`}>{children}</div>;
}

function CardHead({ title, trailing }: { title: string; trailing?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-[17px] font-bold text-ink">{title}</h3>
      {trailing}
    </div>
  );
}

function FeatureStat({
  label,
  value,
  delta,
  sub,
}: {
  label: string;
  value: string | number;
  delta: number;
  sub: string;
}) {
  const TrendIcon = delta >= 0 ? TrendingUpIcon : TrendingDownIcon;
  return (
    <div className="panel p-6 text-white" style={{ background: "var(--green-active)" }}>
      <div className="mb-8 flex items-center justify-between">
        <div className="text-[15px] font-semibold">{label}</div>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: "rgba(255,255,255,0.18)" }}
        >
          <TrendIcon className="h-3.5 w-3.5 text-white" strokeWidth={2.2} />
        </div>
      </div>
      <div className="mb-3.5 text-[54px] font-bold leading-none tracking-tight tabular-nums">{value}</div>
      <div className="text-xs text-[#cfe4d7]">{sub}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  sub: string;
  tone?: "neutral" | "rose" | "green";
}) {
  const valueClass =
    tone === "rose" ? "text-rose" : tone === "green" ? "text-green" : "text-ink";
  return (
    <div className="panel p-6">
      <div className="mb-8 flex items-center justify-between">
        <div className="text-[15px] font-semibold text-ink">{label}</div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-page">
          <ArrowUpRightIcon className="h-3.5 w-3.5 text-ink" strokeWidth={2.2} />
        </div>
      </div>
      <div className={`mb-3.5 text-[54px] font-bold leading-none tracking-tight tabular-nums ${valueClass}`}>
        {value}
      </div>
      <div className="text-xs text-ink-3">{sub}</div>
    </div>
  );
}

function Avatar({ name, band }: { name: string; band: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
  const palette: Record<string, { bg: string; fg: string }> = {
    critical: { bg: "var(--rose-soft)", fg: "var(--rose)" },
    high: { bg: "var(--amber-soft)", fg: "var(--amber)" },
    medium: { bg: "#e5e7f5", fg: "#3b51a8" },
    low: { bg: "var(--green-soft)", fg: "var(--green)" },
  };
  const p = palette[band] ?? palette.low;
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
      style={{ background: p.bg, color: p.fg }}
    >
      {initials || "?"}
    </div>
  );
}

function EventGlyph({ type }: { type: string }) {
  const map: Record<string, { Icon: React.ComponentType<{ className?: string }>; bg: string; fg: string }> = {
    reported: { Icon: FlagIcon, bg: "var(--green-pill)", fg: "var(--green)" },
    training_completed: { Icon: GraduationCapIcon, bg: "var(--green-pill)", fg: "var(--green)" },
    clicked: { Icon: MousePointerClickIcon, bg: "var(--rose-soft)", fg: "var(--rose)" },
    submitted: { Icon: ShieldCheckIcon, bg: "var(--rose-soft)", fg: "var(--rose)" },
    opened: { Icon: MailOpenIcon, bg: "var(--amber-soft)", fg: "var(--amber)" },
    sent: { Icon: MailOpenIcon, bg: "var(--page)", fg: "var(--ink-2)" },
    call_answered: { Icon: PhoneCallIcon, bg: "var(--amber-soft)", fg: "var(--amber)" },
    call_complied: { Icon: PhoneCallIcon, bg: "var(--rose-soft)", fg: "var(--rose)" },
  };
  const m = map[type] ?? map.sent;
  const { Icon } = m;
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
      style={{ background: m.bg, color: m.fg }}
    >
      <Icon className="h-4 w-4" />
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-[12px] border border-dashed border-line p-4 text-center text-sm text-ink-3">
      {text}
    </div>
  );
}

/* ── helpers ──────────────────────────────────────────────────────── */

function formatEventVerb(type: string) {
  const map: Record<string, string> = {
    sent: "was sent a lure",
    opened: "opened a lure",
    clicked: "clicked a lure",
    submitted: "submitted credentials",
    reported: "reported a lure",
    training_completed: "completed training",
    call_answered: "answered a vishing call",
    call_complied: "complied in a vishing call",
  };
  return map[type] ?? type.replaceAll("_", " ");
}

function parseTargets(json: string) {
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed.length;
    if (parsed?.employeeIds && Array.isArray(parsed.employeeIds)) return parsed.employeeIds.length;
  } catch {}
  return "?";
}

function formatDateLong(d: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function formatTimeAgo(d: Date) {
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}
