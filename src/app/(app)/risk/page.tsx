import { requireOrg } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, PageBody } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { bandFor, type RiskBand } from "@/lib/risk";

export default async function RiskPage() {
  const { org } = await requireOrg();

  const employees = await db.employee.findMany({
    where: { orgId: org.id },
    include: { riskScore: true, group: true },
    orderBy: { name: "asc" },
  });

  const byDept = new Map<string, { total: number; sum: number; count: number; critical: number; high: number; medium: number; low: number }>();
  for (const e of employees) {
    const dept = e.department || "Unassigned";
    const entry = byDept.get(dept) || { total: 0, sum: 0, count: 0, critical: 0, high: 0, medium: 0, low: 0 };
    const score = e.riskScore?.score ?? 0;
    entry.total += 1;
    entry.sum += score;
    entry.count += 1;
    const band = e.riskScore?.band as RiskBand | undefined ?? bandFor(score);
    entry[band] += 1;
    byDept.set(dept, entry);
  }
  const depts = Array.from(byDept.entries()).map(([name, e]) => ({
    name,
    avg: e.count ? e.sum / e.count : 0,
    ...e,
  })).sort((a, b) => b.avg - a.avg);

  return (
    <div className="bg-slate-50/50">
      <PageHeader
        title="Risk heatmap"
        description="Behavior-weighted risk scores by person and department. Lower is better. Scores decay over 45-day half-life."
      />
      <PageBody className="space-y-6">
        {/* DEPARTMENT CARDS */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">By department</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {depts.length === 0 ? (
              <p className="text-sm text-slate-400">No data yet.</p>
            ) : (
              depts.map((d) => {
                const avgRound = Math.round(d.avg);
                const isCritical = d.avg >= 45;
                const isHigh = d.avg >= 20 && !isCritical;
                return (
                  <div
                    key={d.name}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{d.name}</p>
                        <p className="text-xs text-slate-400">{d.total} employee{d.total !== 1 ? "s" : ""}</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${
                          isCritical
                            ? "bg-rose-100 text-rose-700"
                            : isHigh
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {avgRound}
                      </span>
                    </div>

                    {/* Risk bar */}
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, d.avg)}%`,
                          background: isCritical
                            ? "#f43f5e"
                            : isHigh
                              ? "#f59e0b"
                              : "#10b981",
                        }}
                      />
                    </div>

                    {/* Band chips */}
                    <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                      <SegChip count={d.critical} label="critical" color="rose" />
                      <SegChip count={d.high} label="high" color="amber" />
                      <SegChip count={d.medium} label="medium" color="yellow" />
                      <SegChip count={d.low} label="low" color="emerald" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* EMPLOYEE TABLE */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="font-semibold text-slate-900">All employees</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Employee</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Department</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Score</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Band</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Weak areas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {employees.map((e) => {
                  const score = Math.round(e.riskScore?.score ?? 0);
                  const band = e.riskScore?.band ?? "low";
                  const weak = ((): string[] => {
                    try {
                      return JSON.parse(e.riskScore?.weakAreas || "[]") as string[];
                    } catch {
                      return [];
                    }
                  })();
                  return (
                    <tr key={e.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-900">{e.name}</p>
                        <p className="text-xs text-slate-400">{e.email}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{e.department || "—"}</td>
                      <td className="px-5 py-3.5 font-mono tabular-nums text-slate-900">{score}</td>
                      <td className="px-5 py-3.5">
                        <BandBadge band={band} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {weak.length === 0 ? (
                            <span className="text-xs text-slate-300">—</span>
                          ) : (
                            weak.slice(0, 3).map((w) => (
                              <span
                                key={w}
                                className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600"
                              >
                                {w.replaceAll("_", " ")}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </PageBody>
    </div>
  );
}

function BandBadge({ band }: { band: string }) {
  const styles: Record<string, string> = {
    critical: "bg-rose-50 text-rose-700 border-rose-200",
    high: "bg-amber-50 text-amber-700 border-amber-200",
    medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
    low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[band] ?? styles.low}`}>
      {band}
    </span>
  );
}

function SegChip({ count, label, color }: { count: number; label: string; color: string }) {
  if (!count) return null;
  const colors: Record<string, string> = {
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
    yellow: "bg-yellow-50 text-yellow-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 ${colors[color] ?? "bg-slate-100 text-slate-600"}`}>
      {count} {label}
    </span>
  );
}
