import { requireOrg } from "@/lib/session";
import { PageHeader, PageBody } from "@/components/page-header";
import { NewTemplateComposer } from "./composer";

export default async function NewTemplatePage() {
  await requireOrg();
  return (
    <>
      <PageHeader
        title="New template"
        description="Describe the scenario in plain English and let Vigil compose the email, landing, voice script, and training module — or write it yourself."
      />
      <PageBody>
        <NewTemplateComposer />
      </PageBody>
    </>
  );
}
