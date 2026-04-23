import { requireOrg } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, PageBody } from "@/components/page-header";
import { BandPill } from "@/components/vigil-ui";
import { ImportDialog } from "./import-dialog";
import { UsersIcon } from "lucide-react";

export default async function EmployeesPage() {
  const { org } = await requireOrg();
  const employees = await db.employee.findMany({
    where: { orgId: org.id },
    orderBy: { createdAt: "desc" },
    include: { riskScore: true },
  });

  return (
    <>
      <PageHeader
        title="Employees"
        description="Everyone enrolled in your workspace. Consent is captured once per employee; records are audit-logged."
        actions={<ImportDialog />}
      />
      <PageBody>
        {employees.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="panel overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Department</Th>
                  <Th>Phone</Th>
                  <Th>Consent</Th>
                  <Th>Risk</Th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => {
                  const score = e.riskScore?.score ?? 0;
                  const band = e.riskScore?.band ?? "low";
                  return (
                    <tr key={e.id} className="border-b border-line last:border-b-0 transition-colors hover:bg-page">
                      <Td className="font-semibold text-ink">{e.name}</Td>
                      <Td className="text-ink-2">{e.email}</Td>
                      <Td className="text-ink-2">{e.department || "—"}</Td>
                      <Td className="font-mono text-xs text-ink-3">{e.phone || "—"}</Td>
                      <Td>
                        {e.consent ? (
                          <span className="inline-flex items-center rounded-full bg-green-pill px-2.5 py-1 text-xs font-semibold text-green">
                            Given
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-page px-2.5 py-1 text-xs font-semibold text-ink-3">
                            Pending
                          </span>
                        )}
                      </Td>
                      <Td>
                        <BandPill band={band} score={Math.round(score)} />
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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

function EmptyState() {
  return (
    <div className="panel flex flex-col items-center p-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-soft">
        <UsersIcon className="h-6 w-6 text-green" />
      </div>
      <h3 className="text-base font-semibold text-ink">No employees yet</h3>
      <p className="mt-1.5 text-sm text-ink-2">
        Paste a CSV of{" "}
        <code className="rounded-md bg-page px-1.5 py-0.5 font-mono text-xs text-ink-2">
          name,email,phone,department
        </code>{" "}
        to enroll your team.
      </p>
      <div className="mt-6">
        <ImportDialog />
      </div>
    </div>
  );
}
