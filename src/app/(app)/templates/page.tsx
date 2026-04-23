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
    <>
      <PageHeader
        title="Templates"
        description="Every scenario generated or seeded in your workspace. Reuse in new campaigns."
      />
      <PageBody>
        {templates.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-3">
            No templates yet. Compose a campaign to create one.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {templates.map((t) => (
              <div key={t.id} className="panel flex flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[15px] font-bold text-ink">{t.name}</p>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      t.generatedBy === "ai"
                        ? "bg-green-pill text-green"
                        : "bg-page text-ink-3"
                    }`}
                  >
                    {t.generatedBy === "ai" && <SparklesIcon className="h-3 w-3" />}
                    {t.generatedBy === "ai" ? "AI generated" : t.generatedBy}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Chip>{t.channel}</Chip>
                  <Chip>{t.category}</Chip>
                  {t.locale !== "en" ? <Chip>{t.locale}</Chip> : null}
                </div>

                {t.subject ? (
                  <p className="line-clamp-2 text-sm text-ink-2">{t.subject}</p>
                ) : null}
                {t.voiceScript && (t.channel === "voice" || t.channel === "multi") ? (
                  <p className="line-clamp-2 text-xs text-ink-3">{t.voiceScript}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </PageBody>
    </>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-page px-2.5 py-1 text-xs text-ink-2">
      {children}
    </span>
  );
}
