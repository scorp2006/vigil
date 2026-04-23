import { requireOrg } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, PageBody } from "@/components/page-header";
import { ApiKeyPanel } from "./api-key-panel";
import { LrsForm } from "./lrs-form";
import { CodeIcon, WebhookIcon } from "lucide-react";

export default async function LmsPage() {
  const { org } = await requireOrg();
  const [keys, config] = await Promise.all([
    db.apiKey.findMany({ where: { orgId: org.id }, orderBy: { createdAt: "desc" } }),
    db.lmsConfig.findUnique({ where: { orgId: org.id } }),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <>
      <PageHeader
        title="LMS Bridge"
        description="Feed Vigil's behavior data into the LMS your org already owns. SCORM, xAPI, and our Training Prescription API."
      />
      <PageBody>
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Prescription API */}
          <div className="panel flex flex-col overflow-hidden">
            <div className="flex items-center gap-2.5 border-b border-line px-5 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-green-soft">
                <CodeIcon className="h-4 w-4 text-green" />
              </div>
              <p className="text-[15px] font-bold text-ink">Training Prescription API</p>
            </div>
            <div className="flex flex-col gap-4 p-5">
              <p className="text-sm text-ink-2">
                Read the right course for the right person at the right time. Your LMS calls one endpoint.
              </p>
              <div className="overflow-x-auto rounded-[12px] bg-page p-4 font-mono text-xs text-ink-2">
                <span className="font-semibold text-green">GET</span> {baseUrl}/api/v1/prescription/&#123;employee_id&#125;
                <br />
                <span className="text-ink-3">Authorization:</span> Bearer &lt;your-api-key&gt;
              </div>
              <p className="text-xs text-ink-3">
                Also available:{" "}
                <code className="rounded bg-page px-1.5 py-0.5 text-ink-2">
                  GET /api/v1/scorm/&#123;template_id&#125;
                </code>{" "}
                for SCORM 2004 bundles.
              </p>
              <ApiKeyPanel keys={keys} />
            </div>
          </div>

          {/* xAPI LRS */}
          <div className="panel flex flex-col overflow-hidden">
            <div className="flex items-center gap-2.5 border-b border-line px-5 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-amber-soft">
                <WebhookIcon className="h-4 w-4 text-amber" />
              </div>
              <p className="text-[15px] font-bold text-ink">xAPI LRS webhook</p>
            </div>
            <div className="flex flex-col gap-4 p-5">
              <p className="text-sm text-ink-2">
                We post xAPI statements (&ldquo;employee completed training&rdquo;, &ldquo;employee reported phishing&rdquo;) to your LRS
                whenever they happen. No polling.
              </p>
              <LrsForm initial={config} />
            </div>
          </div>
        </div>
      </PageBody>
    </>
  );
}
