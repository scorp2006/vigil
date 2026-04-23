import { requireOrg } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, PageBody } from "@/components/page-header";
import { Composer } from "./composer";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { org } = await requireOrg();
  const { mode } = await searchParams;
  const employees = await db.employee.findMany({
    where: { orgId: org.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, department: true, phone: true },
  });

  const defaultChannel: "email" | "voice" | "multi" =
    mode === "vishing" ? "voice" : mode === "multi" ? "multi" : "email";

  return (
    <>
      <PageHeader
        title="New campaign"
        description="Describe the scenario in plain English. Vigil composes the email, landing page, voice script, and training module."
      />
      <PageBody>
        <Composer employees={employees} defaultChannel={defaultChannel} />
      </PageBody>
    </>
  );
}
