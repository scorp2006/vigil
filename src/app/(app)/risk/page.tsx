import { requireOrg } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, PageBody } from "@/components/page-header";
import { BandPill } from "@/components/vigil-ui";
import { bandFor, type RiskBand } from "@/lib/risk";

const SEG_COLOR: Record<string, string> = {
  critical: "bg-rose-soft text-rose",
  high: "bg-amber-soft text-amber",
  medium: "bg-green-soft text-green",
  low: "bg-green-pill text-green",
};

export default async function RiskPage() {
  const { org } = await requireOrg();

  const employees = await db.employee.findMany({
    where: { orgId: org.id },
    include: { riskScore: true, group: true },
    orderBy: { name: "asc" },
  });

  type DeptAgg = {
    total: number; sum: number; count: number;
    critical: number; high: number; medium: number; low: number;
  };
  const byDept = new Map<string, DeptAgg>();
  for (const e of employees) {
    const dept = e.department || "Unassigned";
    const entry = byDept.get(dept) || { total: 0, sum: 0, count: 0, critical: 0, high: 0, medium: 0, low: 0 };
    const score = e.riskScore?.score ?? 0;
    entry.total += 1;
    entry.sum += score;
    entry.count += 1;
    const band = (e.riskScore?.band as RiskBand | undefined) ?? bandFor(score);
    entry[band] += 1;
    byDept.set(dept, entry);
  }
  const depts = Array.from(byDept.entries())
    .map(([name, e]) => ({ name, avg: e.count ? e.sum / e.count : 0, ...e }))
    .sort((a, b) => b.avg - a.avg);

  // Overall band counts for the distribution gauge
  const bandTotals = {
    low: employees.filter((e) => (e.riskScore?.band ?? "low") === "low").length,
    medium: employees.filter((e) => (e.riskScore?.band ?? "low") === "medium").length,
    high: employees.filter((e) => (e.riskScore?.band ?? "low") === "high").length,
    critical: employees.filter((e) => (e.riskScore?.band ?? "low") === "critical").length,
  };
  const totalRanked = employees.length || 1;
  const safePct = Math.round(((bandTotals.low + bandTotals.medium) / totalRanked) * 100);

  return (
    <>
      <PageHeader
        title="Risk heatmap"
        description="Behavior-weighted scores by person and department. Lower is better. Scores decay over a 45-day half-life."
      />
      <PageBody>
        {/* Summary gauge + headline counts */}
        <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
          <div className="panel flex flex-col items-center p-6">
            <p className="mb-2 self-start text-[15px] font-bold text-ink">Distribution</p>
            <div className="relative h-[130px] w-[220px]">
              <svg viewBox="0 0 220 130" width="220" height="130">
                <path d="M 20 120 A 90 90 0 0 1 200 120" fill="none" stroke="var(--line)" strokeWidth="22" strokeLinecap="round" />
                {totalRanked > 0 ? (
                  <>
                    <path
                      d={arcPath(0, bandTotals.low / totalRanked)}
                      fill="none" stroke="var(--green-active)" strokeWidth="22" strokeLinecap="round"
                    />
                    <path
                      d={arcPath(bandTotals.low / totalRanked, (bandTotals.low + bandTotals.medium) / totalRanked)}
                      fill="none" stroke="#4ca371" strokeWidth="22" strokeLinecap="round"
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

          <div className="panel p-6">
            <p className="mb-4 text-[15px] font-bold text-ink">Counts</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <CountCell label="Low" count={bandTotals.low} tone="green" />
              <CountCell label="Medium" count={bandTotals.medium} tone="green-soft" />
              <CountCell label="High" count={bandTotals.high} tone="amber" />
              <CountCell label="Critical" count={bandTotals.critical} tone="rose" />
            </div>
          </div>
        </div>

        {/* Department cards */}
        <div>
          <p className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
            By department
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {depts.length === 0 ? (
              <p className="text-sm text-ink-3">No data yet.</p>
            ) : (
              depts.map((d) => {
                const avgRound = Math.round(d.avg);
                const tone = d.avg >= 45 ? "rose" : d.avg >= 20 ? "amber" : "green";
                const barColor = tone === "rose" ? "var(--rose)" : tone === "amber" ? "var(--amber)" : "var(--green-active)";
                const pillCls = tone === "rose" ? "bg-rose-soft text-rose" : tone === "amber" ? "bg-amber-soft text-amber" : "bg-green-pill text-green";
                return (
                  <div key={d.name} className="panel p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[15px] font-bold text-ink">{d.name}</p>
                        <p className="text-xs text-ink-3">
                          {d.total} employee{d.total !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${pillCls}`}>
                        {avgRound}
                      </span>
                    </div>

                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-page">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, d.avg)}%`, background: barColor }}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                      <SegChip count={d.critical} label="critical" tone="critical" />
                      <SegChip count={d.high} label="high" tone="high" />
                      <SegChip count={d.medium} label="medium" tone="medium" />
                      <SegChip count={d.low} label="low" tone="low" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Employee table */}
        <div className="panel overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <p className="text-[17px] font-bold text-ink">All employees</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <Th>Employee</Th>
                  <Th>Department</Th>
                  <Th>Score</Th>
                  <Th>Band</Th>
                  <Th>Weak areas</Th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => {
                  const score = Math.round(e.riskScore?.score ?? 0);
                  const band = e.riskScore?.band ?? "low";
                  const weak: string[] = (() => {
                    try {
                      return JSON.parse(e.riskScore?.weakAreas || "[]") as string[];
                    } catch {
                      return [];
                    }
                  })();
                  return (
                    <tr key={e.id} className="border-b border-line last:border-b-0 transition-colors hover:bg-page">
                      <Td>
                        <p className="font-semibold text-ink">{e.name}</p>
                        <p className="text-xs text-ink-3">{e.email}</p>
                      </Td>
                      <Td className="text-ink-2">{e.department || "—"}</Td>
                      <Td className="font-mono tabular-nums text-ink">{score}</Td>
                      <Td>
                        <BandPill band={band} />
                      </Td>
                      <Td>
                        <div className="flex flex-wrap gap-1">
                          {weak.length === 0 ? (
                            <span className="text-xs text-ink-3">—</span>
                          ) : (
                            weak.slice(0, 3).map((w) => (
                              <span key={w} className="rounded-full bg-page px-2.5 py-0.5 text-xs text-ink-2">
                                {w.replaceAll("_", " ")}
                              </span>
                            ))
                          )}
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </PageBody>
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">
      {children}
    </th>
  );
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-4 ${className}`}>{children}</td>;
}

function SegChip({ count, label, tone }: { count: number; label: string; tone: string }) {
  if (!count) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 ${SEG_COLOR[tone] ?? "bg-page text-ink-2"}`}>
      {count} {label}
    </span>
  );
}

function CountCell({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "green" | "green-soft" | "amber" | "rose";
}) {
  const toneMap: Record<string, { dot: string; fg: string }> = {
    green: { dot: "var(--green-active)", fg: "var(--green)" },
    "green-soft": { dot: "#4ca371", fg: "var(--green)" },
    amber: { dot: "var(--amber)", fg: "var(--amber)" },
    rose: { dot: "var(--rose)", fg: "var(--rose)" },
  };
  const t = toneMap[tone];
  return (
    <div className="rounded-[14px] bg-page p-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-3">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: t.dot }}
          aria-hidden="true"
        />
        {label}
      </div>
      <div className="mt-1.5 text-3xl font-bold tabular-nums" style={{ color: t.fg }}>
        {count}
      </div>
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

function arcPath(startFrac: number, endFrac: number) {
  const cx = 110, cy = 120, r = 90;
  const a0 = Math.PI - startFrac * Math.PI;
  const a1 = Math.PI - endFrac * Math.PI;
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy - r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy - r * Math.sin(a1);
  return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}
