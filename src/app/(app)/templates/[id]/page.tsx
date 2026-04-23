import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrg } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, PageBody } from "@/components/page-header";
import { DeleteTemplateButton } from "./delete-button";
import {
  ArrowLeftIcon, MailIcon, PhoneIcon, GraduationCapIcon, SparklesIcon, PlayIcon,
} from "lucide-react";

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { org } = await requireOrg();

  const template = await db.template.findFirst({
    where: { id, orgId: org.id },
    include: { _count: { select: { campaigns: true } } },
  });
  if (!template) notFound();

  const landing: { headline?: string; subhead?: string; ctaLabel?: string } | null = (() => {
    if (!template.landingHtml) return null;
    try {
      return JSON.parse(template.landingHtml);
    } catch {
      return null;
    }
  })();

  const training: {
    title?: string; summary?: string; lesson?: string;
    quiz?: Array<{ q: string; options: string[]; correctIndex: number; explain?: string }>;
    redFlags?: string[];
  } | null = (() => {
    if (!template.trainingModuleJson) return null;
    try {
      return JSON.parse(template.trainingModuleJson);
    } catch {
      return null;
    }
  })();

  return (
    <>
      <PageHeader
        title={template.name}
        description={`${template.channel} · ${template.category.replaceAll("_", " ")}`}
        actions={
          <Link href="/templates" className="pill-btn">
            <ArrowLeftIcon className="h-3.5 w-3.5" /> Back
          </Link>
        }
      />
      <PageBody>
        {/* Summary strip */}
        <div className="panel flex flex-wrap items-center gap-3 p-5">
          <Chip tone={template.generatedBy === "ai" ? "green" : "page"}>
            {template.generatedBy === "ai" && <SparklesIcon className="h-3 w-3" />}
            {template.generatedBy}
          </Chip>
          <Chip tone="page">{template.locale}</Chip>
          <Chip tone="page">{template._count.campaigns} campaign{template._count.campaigns === 1 ? "" : "s"}</Chip>
          <div className="ml-auto flex items-center gap-2.5">
            <Link href="/campaigns/new" className="pill-btn primary">
              <PlayIcon className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
              New campaign
            </Link>
            <DeleteTemplateButton
              templateId={template.id}
              templateName={template.name}
              inUse={template._count.campaigns > 0}
            />
          </div>
        </div>

        {/* Email preview */}
        {(template.channel === "email" || template.channel === "multi") && (template.subject || template.bodyHtml) ? (
          <div className="panel overflow-hidden">
            <SectionHead icon={<MailIcon className="h-4 w-4" />} label="Email" tone="green" />
            <div className="flex flex-col gap-3 p-5">
              <MetaRow label="From" value={template.fromName && template.fromEmail ? `${template.fromName} <${template.fromEmail}>` : template.fromEmail || template.fromName || "—"} />
              <MetaRow label="Subject" value={template.subject || "—"} />
              {template.bodyHtml ? (
                <div className="rounded-[14px] bg-page p-5">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">Preview</p>
                  <div
                    className="email-preview text-sm text-ink"
                    dangerouslySetInnerHTML={{
                      __html: template.bodyHtml.replace(/\{\{TRACK_URL\}\}/g, "#"),
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Landing preview */}
        {landing?.headline ? (
          <div className="panel overflow-hidden">
            <SectionHead label="Landing page" tone="amber" />
            <div className="p-5">
              <div className="rounded-[14px] bg-page p-6 text-center">
                <p className="text-xl font-bold text-ink">{landing.headline}</p>
                {landing.subhead ? <p className="mt-1 text-sm text-ink-2">{landing.subhead}</p> : null}
                {landing.ctaLabel ? (
                  <span className="pill-btn primary mt-4 inline-flex">{landing.ctaLabel}</span>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {/* Voice preview */}
        {(template.channel === "voice" || template.channel === "multi") && template.voiceScript ? (
          <div className="panel overflow-hidden">
            <SectionHead icon={<PhoneIcon className="h-4 w-4" />} label="Voice" tone="amber" />
            <div className="flex flex-col gap-3 p-5">
              {template.voicePersona ? (
                <MetaRow label="Persona" value={template.voicePersona} />
              ) : null}
              <div className="rounded-[14px] bg-page p-4 text-sm leading-relaxed text-ink">
                &ldquo;{template.voiceScript}&rdquo;
              </div>
            </div>
          </div>
        ) : null}

        {/* Training module */}
        {training?.title ? (
          <div className="panel overflow-hidden">
            <SectionHead
              icon={<GraduationCapIcon className="h-4 w-4" />}
              label="Training module"
              tone="green"
            />
            <div className="flex flex-col gap-4 p-5">
              <div>
                <p className="text-[15px] font-bold text-ink">{training.title}</p>
                {training.summary ? (
                  <p className="mt-1 text-sm text-ink-2">{training.summary}</p>
                ) : null}
              </div>
              {training.lesson ? (
                <div className="rounded-[14px] bg-page p-4 text-sm leading-relaxed text-ink-2">
                  {training.lesson}
                </div>
              ) : null}
              {training.redFlags && training.redFlags.length > 0 ? (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">Red flags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {training.redFlags.map((f) => (
                      <span key={f} className="rounded-full bg-rose-soft px-2.5 py-1 text-xs text-rose">{f}</span>
                    ))}
                  </div>
                </div>
              ) : null}
              {training.quiz && training.quiz.length > 0 ? (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">
                    Quiz ({training.quiz.length} question{training.quiz.length === 1 ? "" : "s"})
                  </p>
                  <ol className="flex flex-col gap-3">
                    {training.quiz.map((q, i) => (
                      <li key={i} className="rounded-[14px] bg-page p-4">
                        <p className="text-sm font-semibold text-ink">{i + 1}. {q.q}</p>
                        <ul className="mt-2 space-y-1 text-sm">
                          {q.options.map((opt, oi) => (
                            <li
                              key={oi}
                              className={`rounded-md px-2.5 py-1 ${
                                oi === q.correctIndex
                                  ? "bg-green-pill text-green font-semibold"
                                  : "text-ink-2"
                              }`}
                            >
                              {opt}
                            </li>
                          ))}
                        </ul>
                        {q.explain ? (
                          <p className="mt-2 text-xs text-ink-3">{q.explain}</p>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </PageBody>
    </>
  );
}

function Chip({ children, tone = "page" }: { children: React.ReactNode; tone?: "page" | "green" }) {
  const cls = tone === "green" ? "bg-green-pill text-green" : "bg-page text-ink-2";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${cls}`}>
      {children}
    </span>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 text-sm">
      <span className="w-20 shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}

function SectionHead({
  icon,
  label,
  tone,
}: {
  icon?: React.ReactNode;
  label: string;
  tone: "green" | "amber";
}) {
  const bg = tone === "green" ? "bg-green-soft text-green" : "bg-amber-soft text-amber";
  return (
    <div className="flex items-center gap-2.5 border-b border-line px-5 py-4">
      {icon ? <div className={`flex h-8 w-8 items-center justify-center rounded-[10px] ${bg}`}>{icon}</div> : null}
      <p className="text-[15px] font-bold text-ink">{label}</p>
    </div>
  );
}
