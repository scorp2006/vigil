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
    <div className="bg-slate-50/50">
      <PageHeader
        title="LMS Bridge"
        description="Feed Vigil's behavior data into the LMS your org already owns. SCORM, xAPI, and our Training Prescription API."
      />
      <PageBody className="space-y-6">
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Prescription API */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                <CodeIcon className="h-4 w-4 text-blue-600" />
              </div>
              <p className="font-semibold text-slate-900">Training Prescription API</p>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-500">
                Read the right course for the right person at the right time. Your LMS calls one endpoint.
              </p>
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-700">
                <span className="text-blue-600">GET</span> {baseUrl}/api/v1/prescription/&#123;employee_id&#125;
                <br />
                <span className="text-slate-400">Authorization:</span> Bearer &lt;your-api-key&gt;
              </div>
              <p className="text-xs text-slate-400">
                Also available:{" "}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
                  GET /api/v1/scorm/&#123;template_id&#125;
                </code>{" "}
                for SCORM 2004 bundles.
              </p>
              <ApiKeyPanel keys={keys} />
            </div>
          </div>

          {/* xAPI LRS */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
                <WebhookIcon className="h-4 w-4 text-violet-600" />
              </div>
              <p className="font-semibold text-slate-900">xAPI LRS webhook</p>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-500">
                We post xAPI statements (&ldquo;employee completed training&rdquo;, &ldquo;employee reported phishing&rdquo;) to your LRS
                whenever they happen. No polling.
              </p>
              <LrsForm initial={config} />
            </div>
          </div>
        </div>
      </PageBody>
    </div>
  );
}
