import { requireOrg } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, PageBody } from "@/components/page-header";
import { SparklesIcon } from "lucide-react";

export default async function TemplatesPage() {
  const { org } = await requireOrg();
  const templates = await db.template.findMany({
    where: { orgId: org.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="bg-slate-50/50">
      <PageHeader
        title="Templates"
        description="Every scenario generated or seeded in your workspace. Reuse in new campaigns."
      />
      <PageBody>
        {templates.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">
            No templates yet. Compose a campaign to create one.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {templates.map((t) => (
              <div
                key={t.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-3.5 flex items-center justify-between">
                  <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      t.generatedBy === "ai"
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                  >
                    {t.generatedBy === "ai" && <SparklesIcon className="h-3 w-3" />}
                    {t.generatedBy === "ai" ? "AI generated" : t.generatedBy}
                  </span>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600">
                      {t.channel}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600">
                      {t.category}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600">
                      {t.locale}
                    </span>
                  </div>
                  {t.subject ? (
                    <p className="text-sm text-slate-700">
                      <span className="font-medium text-slate-500">Subject:</span> {t.subject}
                    </p>
                  ) : null}
                  {t.voiceScript ? (
                    <p className="line-clamp-2 text-xs text-slate-500">
                      <span className="font-medium">Voice:</span> {t.voiceScript}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </PageBody>
    </div>
  );
}
