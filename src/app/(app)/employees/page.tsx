import { requireOrg } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, PageBody } from "@/components/page-header";
import { ImportDialog } from "./import-dialog";

export default async function EmployeesPage() {
  const { org } = await requireOrg();
  const employees = await db.employee.findMany({
    where: { orgId: org.id },
    orderBy: { createdAt: "desc" },
    include: { riskScore: true },
  });

  return (
    <div className="bg-slate-50/50">
      <PageHeader
        title="Employees"
        description="Everyone enrolled in your workspace. Consent is captured once per employee; records are audit-logged."
        actions={<ImportDialog />}
      />
      <PageBody>
        {employees.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-left">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Name</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Email</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Department</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Phone</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Consent</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {employees.map((e) => {
                    const score = e.riskScore?.score ?? 0;
                    const band = e.riskScore?.band ?? "low";
                    const bandStyles: Record<string, string> = {
                      critical: "bg-rose-50 text-rose-700 border-rose-200",
                      high: "bg-amber-50 text-amber-700 border-amber-200",
                      medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
                      low: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    };
                    return (
                      <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-slate-900">{e.name}</td>
                        <td className="px-5 py-3.5 text-slate-500">{e.email}</td>
                        <td className="px-5 py-3.5 text-slate-600">{e.department || "—"}</td>
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{e.phone || "—"}</td>
                        <td className="px-5 py-3.5">
                          {e.consent ? (
                            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                              Given
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tabular-nums ${bandStyles[band] ?? bandStyles.low}`}>
                            {Math.round(score)} · {band}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </PageBody>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-14 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-slate-900">No employees yet</h3>
      <p className="mt-1.5 text-sm text-slate-500">
        Paste a CSV of{" "}
        <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
          name,email,phone,department
        </code>{" "}
        to enroll your team.
      </p>
      <div className="mt-6 flex justify-center">
        <ImportDialog />
      </div>
    </div>
  );
}
