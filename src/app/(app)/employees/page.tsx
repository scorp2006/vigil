import { requireOrg } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, PageBody } from "@/components/page-header";
import { ImportDialog } from "./import-dialog";
import { EmployeesTable, type EmployeeRow } from "./employees-table";
import { UsersIcon } from "lucide-react";

export default async function EmployeesPage() {
  const { org } = await requireOrg();
  const employees = await db.employee.findMany({
    where: { orgId: org.id },
    orderBy: { createdAt: "desc" },
    include: { riskScore: true },
  });

  const rows: EmployeeRow[] = employees.map((e) => ({
    id: e.id,
    name: e.name,
    email: e.email,
    department: e.department,
    consent: e.consent,
    score: e.riskScore?.score ?? 0,
    band: e.riskScore?.band ?? "low",
  }));

  return (
    <>
      <PageHeader
        title="Employees"
        description="Everyone enrolled in your workspace. Consent is captured once per employee; records are audit-logged."
        actions={<ImportDialog />}
      />
      <PageBody>
        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          <EmployeesTable employees={rows} />
        )}
      </PageBody>
    </>
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
