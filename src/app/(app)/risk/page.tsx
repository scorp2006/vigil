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

  return (
    <>
      <PageHeader
        title="Risk heatmap"
        description="Behavior-weighted scores by person and department. Lower is better. Scores decay over a 45-day half-life."
      />
      <PageBody>
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
