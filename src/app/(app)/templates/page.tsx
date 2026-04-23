import Link from "next/link";
import { requireOrg } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, PageBody } from "@/components/page-header";
import { SparklesIcon, PlusIcon, BookOpenIcon } from "lucide-react";

export default async function TemplatesPage() {
  const { org } = await requireOrg();
  const templates = await db.template.findMany({
    where: { orgId: org.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { campaigns: true } } },
  });

  return (
    <>
      <PageHeader
        title="Templates"
        description="Every scenario in your workspace. Reuse any of them in new campaigns."
        actions={
          <Link href="/templates/new" className="pill-btn primary">
            <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.5} /> New template
          </Link>
        }
      />
      <PageBody>
        {templates.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {templates.map((t) => (
              <Link
                key={t.id}
                href={`/templates/${t.id}`}
                className="panel group flex flex-col gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(10,96,52,0.06)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[15px] font-bold text-ink transition-colors group-hover:text-green">
                    {t.name}
                  </p>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      t.generatedBy === "ai" ? "bg-green-pill text-green" : "bg-page text-ink-3"
                    }`}
                  >
                    {t.generatedBy === "ai" && <SparklesIcon className="h-3 w-3" />}
                    {t.generatedBy === "ai" ? "AI generated" : t.generatedBy}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Chip>{t.channel}</Chip>
                  <Chip>{t.category.replaceAll("_", " ")}</Chip>
                  {t.locale !== "en" ? <Chip>{t.locale}</Chip> : null}
                </div>

                {t.subject ? (
                  <p className="line-clamp-2 text-sm text-ink-2">{t.subject}</p>
                ) : null}
                {t.voiceScript && (t.channel === "voice" || t.channel === "multi") ? (
                  <p className="line-clamp-2 text-xs text-ink-3">{t.voiceScript}</p>
                ) : null}

                <div className="mt-auto flex items-center justify-between pt-2 text-xs text-ink-3">
                  <span>
                    {t._count.campaigns} campaign{t._count.campaigns === 1 ? "" : "s"}
                  </span>
                  <span>Created {t.createdAt.toISOString().slice(0, 10)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </PageBody>
    </>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-page px-2.5 py-1 text-xs text-ink-2 capitalize">
      {children}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="panel flex flex-col items-center p-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-soft">
        <BookOpenIcon className="h-6 w-6 text-green" />
      </div>
      <h3 className="text-base font-semibold text-ink">No templates yet</h3>
      <p className="mt-1.5 text-sm text-ink-2">
        Describe a scenario and let Vigil compose it — or write one by hand.
      </p>
      <Link href="/templates/new" className="pill-btn primary mt-6">
        <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.5} /> New template
      </Link>
    </div>
  );
}
