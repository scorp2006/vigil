import Link from "next/link";
import { requireOrg } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, PageBody } from "@/components/page-header";
import { BandPill, TrackerCard } from "@/components/vigil-ui";
import {
  ArrowUpRightIcon,
  PlayIcon,
  PlusIcon,
  CalendarIcon,
  MailIcon,
  PhoneIcon,
  StarIcon,
  PackageIcon,
} from "lucide-react";

export default async function DashboardPage() {
  const { org } = await requireOrg();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600_000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600_000);

  const [
    employeeCount,
    activeCampaigns,
    nextCampaign,
    events7,
    reportsToday,
    risks,
    riskBands,
    topTemplates,
  ] = await Promise.all([
    db.employee.count({ where: { orgId: org.id } }),
    db.campaign.count({ where: { orgId: org.id, status: { in: ["running", "scheduled"] } } }),
    db.campaign.findFirst({
      where: { orgId: org.id, status: "scheduled", scheduledAt: { gte: now } },
      orderBy: { scheduledAt: "asc" },
      include: { template: { select: { name: true, channel: true } } },
    }),
    db.event.findMany({
      where: { orgId: org.id, createdAt: { gte: sevenDaysAgo } },
      select: { type: true, createdAt: true },
    }),
    db.event.count({
      where: { orgId: org.id, type: "reported", createdAt: { gte: startOfToday } },
    }),
    db.riskScore.findMany({
      where: { employee: { orgId: org.id } },
      include: { employee: { select: { name: true, department: true } } },
      orderBy: { score: "desc" },
      take: 4,
    }),
    db.riskScore.findMany({
      where: { employee: { orgId: org.id } },
      select: { band: true },
    }),
    db.template.findMany({
      where: { orgId: org.id },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { _count: { select: { campaigns: true } } },
    }),
  ]);

  // Stat: high-risk count
  const highRiskCount = riskBands.filter((r) => r.band === "critical" || r.band === "high").length;
  const totalRanked = riskBands.length || 1;
  const highRiskPct = ((highRiskCount / totalRanked) * 100).toFixed(1);

  // Bar chart: event volume per weekday for the last 7 days
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
    pct: Math.round((b.count / Math.max(1, max)) * 100),
  }));

  // Risk distribution gauge — proportions
  const lowCount = riskBands.filter((r) => r.band === "low").length;
  const medCount = riskBands.filter((r) => r.band === "medium").length;
  const safePct = totalRanked ? Math.round(((lowCount + medCount) / totalRanked) * 100) : 0;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Monitor workforce risk, run simulations, and train employees with ease."
        actions={
          <>
            <Link href="/campaigns/new" className="pill-btn primary">
              <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.5} /> New Campaign
            </Link>
            <Link href="/employees" className="pill-btn">Import CSV</Link>
          </>
        }
      />

      <PageBody>
        {/* STAT ROW */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureStat
            label="Total Employees"
            value={employeeCount}
            tag={`▲ ${Math.min(12, employeeCount)}`}
            note="Onboarded this month"
          />
          <Stat
            label="Active Campaigns"
            value={activeCampaigns}
            tag={nextCampaign?.scheduledAt ? "+1" : "—"}
            note={nextCampaign?.scheduledAt
              ? `Scheduled for ${formatDate(nextCampaign.scheduledAt)}`
              : "Nothing on the calendar"}
          />
          <Stat
            label="High-risk Employees"
            value={highRiskCount}
            tag={highRiskCount > 0 ? `▲ ${highRiskCount}` : "0"}
            tagTone="rose"
            note={`${highRiskPct}% of workforce`}
          />
          <Stat
            label="Reports Today"
            value={reportsToday}
            tag={reportsToday > 0 ? `▲ ${reportsToday}` : "—"}
            note={reportsToday > 0 ? "vs yesterday" : "No reports yet today"}
          />
        </div>

        {/* MID ROW: chart + upcoming + templates */}
        <div className="grid gap-4 lg:grid-cols-[2fr_1.2fr_1.4fr]">
          <Card>
            <CardHead title="Event Analytics" trailing={<MoreButton>This week ▾</MoreButton>} />
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
            <CardHead title="Upcoming" />
            <div className="text-xl font-semibold text-ink">
              {nextCampaign?.name ?? "Nothing scheduled"}
            </div>
            <div className="mt-1 mb-5 flex items-center gap-1.5 text-[13px] text-ink-3">
              <CalendarIcon className="h-3.5 w-3.5" />
              {nextCampaign?.scheduledAt
                ? `${formatDateLong(nextCampaign.scheduledAt)} · ${parseTargets(nextCampaign.targetJson)} targets`
                : "Schedule a campaign to see it here"}
            </div>
            <Link
              href={nextCampaign ? `/campaigns/${nextCampaign.id}` : "/campaigns/new"}
              className="pill-btn primary justify-center !px-3 !py-3.5"
              style={{ width: "100%" }}
            >
              <PlayIcon className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
              {nextCampaign ? "Launch now" : "Plan one"}
            </Link>
          </Card>

          <Card>
            <CardHead title="Templates" trailing={<Link href="/templates" className="more-btn">+ New</Link>} />
            <div className="flex flex-col gap-4">
              {topTemplates.length === 0 ? (
                <EmptyHint text="No templates yet. Generate one." />
              ) : (
                topTemplates.map((t) => (
                  <div key={t.id} className="flex items-center gap-3">
                    <TemplateDot channel={t.channel} category={t.category} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink">{t.name}</div>
                      <div className="text-xs text-ink-3">
                        {t._count.campaigns} campaign{t._count.campaigns === 1 ? "" : "s"} · {t.generatedBy} ·{" "}
                        {formatShort(t.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* BOT ROW: high-risk + gauge + integration */}
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr_1fr]">
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
                      <div className="text-xs text-ink-3">
                        {r.employee.department || "—"} · score {Math.round(r.score)}
                      </div>
                    </div>
                    <BandPill band={r.band} score={Math.round(r.score)} />
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <CardHead title="Risk distribution" />
            <div className="flex flex-col items-center pt-2">
              <div className="relative h-[130px] w-[220px]">
                <svg viewBox="0 0 220 130" width="220" height="130">
                  <path d="M 20 120 A 90 90 0 0 1 200 120" fill="none" stroke="var(--line)" strokeWidth="22" strokeLinecap="round" />
                  {totalRanked > 0 ? (
                    <>
                      <path
                        d={arcPath(0, lowCount / totalRanked)}
                        fill="none"
                        stroke="var(--green-active)"
                        strokeWidth="22"
                        strokeLinecap="round"
                      />
                      <path
                        d={arcPath(lowCount / totalRanked, (lowCount + medCount) / totalRanked)}
                        fill="none"
                        stroke="#4ca371"
                        strokeWidth="22"
                        strokeLinecap="round"
                      />
                    </>
                  ) : null}
                </svg>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-center">
                  <div className="text-3xl font-bold tracking-tight text-ink">{safePct}%</div>
                  <div className="mt-0.5 text-[11px] font-medium tracking-wide text-ink-3">LOW/MEDIUM</div>
                </div>
              </div>
              <div className="mt-4 flex gap-4 text-xs text-ink-2">
                <LegendKey color="var(--green-active)" label="Low" />
                <LegendKey color="#4ca371" label="Medium" />
                <LegendKey hatched label="High/Critical" />
              </div>
            </div>
          </Card>

          <TrackerCard>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[17px] font-bold text-white">Integration status</h3>
            </div>
            <div className="mt-3 mb-2 text-2xl font-bold tracking-tight">All systems nominal</div>
            <div className="mb-5 text-[13px] text-[#cfe4d7]">LLM ✓ · Email ✓ · Voice ✓ · LMS ✓</div>
            <div className="flex gap-2.5">
              <Link
                href="/settings"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-green"
                aria-label="Settings"
              >
                <SettingsGearIcon />
              </Link>
              <Link
                href="/lms"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-rose text-white"
                aria-label="LMS"
              >
                <PackageIcon className="h-4 w-4" strokeWidth={2.2} />
              </Link>
            </div>
          </TrackerCard>
        </div>
      </PageBody>
    </>
  );
}

/* ── Sub-components ───────────────────────────────────────────────── */

function Card({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`panel flex flex-col p-6 ${className}`} style={style}>
      {children}
    </div>
  );
}

function CardHead({
  title,
  trailing,
  titleClass = "",
}: {
  title: string;
  trailing?: React.ReactNode;
  titleClass?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h3 className={`text-[17px] font-bold ${titleClass || "text-ink"}`}>{title}</h3>
      {trailing}
    </div>
  );
}

function MoreButton({ children }: { children: React.ReactNode }) {
  return <button className="more-btn">{children}</button>;
}

function FeatureStat({
  label,
  value,
  tag,
  note,
}: {
  label: string;
  value: number | string;
  tag: string;
  note: string;
}) {
  return (
    <div className="panel p-6 text-white" style={{ background: "var(--green-active)" }}>
      <div className="mb-8 flex items-center justify-between">
        <div className="text-[15px] font-semibold">{label}</div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.18)" }}>
          <ArrowUpRightIcon className="h-3.5 w-3.5 text-white" strokeWidth={2.2} />
        </div>
      </div>
      <div className="mb-3.5 text-[54px] font-bold leading-none tracking-tight tabular-nums">{value}</div>
      <div className="flex items-center gap-1.5 text-xs text-[#cfe4d7]">
        <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: "rgba(255,255,255,0.22)", color: "#fff" }}>
          {tag}
        </span>
        {note}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tag,
  note,
  tagTone = "green",
}: {
  label: string;
  value: number | string;
  tag: string;
  note: string;
  tagTone?: "green" | "rose";
}) {
  const tagStyle =
    tagTone === "rose"
      ? { background: "var(--rose-soft)", color: "var(--rose)" }
      : { background: "var(--green-pill)", color: "var(--green)" };
  return (
    <div className="panel p-6">
      <div className="mb-8 flex items-center justify-between">
        <div className="text-[15px] font-semibold text-ink">{label}</div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-page">
          <ArrowUpRightIcon className="h-3.5 w-3.5 text-ink" strokeWidth={2.2} />
        </div>
      </div>
      <div className="mb-3.5 text-[54px] font-bold leading-none tracking-tight tabular-nums text-ink">{value}</div>
      <div className="flex items-center gap-1.5 text-xs text-ink-2">
        <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={tagStyle}>
          {tag}
        </span>
        {note}
      </div>
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

function TemplateDot({ channel, category }: { channel: string; category: string }) {
  let cls = "bg-green-soft text-green";
  let Icon: React.ComponentType<{ className?: string }> = MailIcon;
  if (channel === "voice") { cls = "bg-amber-soft text-amber"; Icon = PhoneIcon; }
  else if (category === "blocked" || category === "policy") { cls = "bg-rose-soft text-rose"; Icon = StarIcon; }
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${cls}`}>
      <Icon className="h-[18px] w-[18px]" />
    </div>
  );
}

function LegendKey({ color, label, hatched }: { color?: string; label: string; hatched?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{
          background: hatched
            ? "repeating-linear-gradient(45deg,var(--line-2) 0 3px,#fff 3px 5px)"
            : color,
        }}
      />
      {label}
    </span>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-[12px] border border-dashed border-line p-4 text-center text-sm text-ink-3">
      {text}
    </div>
  );
}

function SettingsGearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}

/* ── helpers ──────────────────────────────────────────────────────── */

function arcPath(startFrac: number, endFrac: number) {
  // Half-circle gauge: angle 180° → 0° as frac 0→1 (left to right along the arc).
  const cx = 110;
  const cy = 120;
  const r = 90;
  const a0 = Math.PI - startFrac * Math.PI;
  const a1 = Math.PI - endFrac * Math.PI;
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy - r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy - r * Math.sin(a1);
  return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}

function parseTargets(json: string) {
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed.length;
    if (parsed?.employeeIds && Array.isArray(parsed.employeeIds)) return parsed.employeeIds.length;
  } catch {}
  return "?";
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(d);
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

function formatShort(d: Date) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(d);
}
