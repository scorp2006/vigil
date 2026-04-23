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
                  <Th>Department</Th>
                  <Th>Risk</Th>
                  <Th className="text-right">Consent</Th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => {
                  const score = e.riskScore?.score ?? 0;
                  const band = e.riskScore?.band ?? "low";
                  return (
                    <tr key={e.id} className="border-b border-line last:border-b-0 transition-colors hover:bg-page">
                      <Td>
                        <div className="font-semibold text-ink">{e.name}</div>
                        <div className="text-xs text-ink-3">{e.email}</div>
                      </Td>
                      <Td className="text-ink-2">{e.department || "—"}</Td>
                      <Td>
                        <BandPill band={band} score={Math.round(score)} />
                      </Td>
                      <Td className="text-right">
                        <ConsentDot given={e.consent} />
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

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3 ${className}`}>
      {children}
    </th>
  );
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-4 ${className}`}>{children}</td>;
}

function ConsentDot({ given }: { given: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-ink-3"
      title={given ? "Consent given" : "Consent pending"}
    >
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: given ? "var(--green)" : "var(--line-2)" }}
        aria-hidden="true"
      />
      {given ? "Given" : "Pending"}
    </span>
  );
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
