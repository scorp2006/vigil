import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrg } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, PageBody } from "@/components/page-header";
import { ArrowLeftIcon, FlagIcon, GraduationCapIcon } from "lucide-react";
import { LaunchButton } from "./launch-button";

const EVENT_TONE: Record<string, string> = {
  sent: "bg-page text-ink-2",
  opened: "bg-amber-soft text-amber",
  clicked: "bg-rose-soft text-rose",
  submitted: "bg-rose-soft text-rose",
  reported: "bg-green-pill text-green",
  training_completed: "bg-green-pill text-green",
};

export default async function CampaignDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { org } = await requireOrg();
  const campaign = await db.campaign.findFirst({
    where: { id, orgId: org.id },
    include: { template: true },
  });
  if (!campaign) notFound();

  const events = await db.event.findMany({
    where: { campaignId: campaign.id },
    orderBy: { createdAt: "desc" },
    include: { employee: { select: { name: true, email: true } } },
  });

  const counts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + 1;
    return acc;
  }, {});

  const sent = counts.sent ?? 0;
  const opened = counts.opened ?? 0;
  const clicked = counts.clicked ?? 0;
  const submitted = counts.submitted ?? 0;
  const reported = counts.reported ?? 0;
  const trained = counts.training_completed ?? 0;
  const openedPct = sent > 0 ? Math.round((opened / sent) * 100) : 0;
  const clickedPct = sent > 0 ? Math.round((clicked / sent) * 100) : 0;
  const submittedPct = sent > 0 ? Math.round((submitted / sent) * 100) : 0;

  return (
    <>
      <PageHeader
        title={campaign.name}
        description={`${campaign.channel} · ${campaign.template?.category?.replaceAll("_", " ") ?? "—"} · ${campaign.status}`}
        actions={
          <>
            {campaign.status === "scheduled" ? <LaunchButton campaignId={campaign.id} /> : null}
            <Link href="/campaigns" className="pill-btn">
              <ArrowLeftIcon className="h-3.5 w-3.5" /> Back to campaigns
            </Link>
          </>
        }
      />
      <PageBody>
        {/* Funnel + Outcomes */}
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          {/* Funnel — horizontal bars, each % of sent */}
          <div className="panel p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-ink">Delivery funnel</h3>
              <span className="text-xs text-ink-3">% of {sent} sent</span>
            </div>
            <div className="space-y-4">
              <FunnelBar label="Sent" count={sent} pct={sent > 0 ? 100 : 0} tone="ink" />
              <FunnelBar label="Opened" count={opened} pct={openedPct} tone="amber" />
              <FunnelBar label="Clicked" count={clicked} pct={clickedPct} tone="rose" />
              <FunnelBar label="Submitted" count={submitted} pct={submittedPct} tone="rose" />
            </div>
          </div>

          {/* Outcomes — the positive half: reports + training */}
          <div className="panel p-6">
            <h3 className="mb-4 text-[15px] font-bold text-ink">Outcomes</h3>
            <div className="flex flex-col gap-3">
              <OutcomeCell
                icon={FlagIcon}
                label="Reported"
                count={reported}
                sub={sent > 0 ? `${Math.round((reported / sent) * 100)}% report rate` : "—"}
              />
              <OutcomeCell
                icon={GraduationCapIcon}
                label="Training completed"
                count={trained}
                sub={clicked > 0 ? `${Math.round((trained / clicked) * 100)}% of clickers` : "—"}
              />
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="panel overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <p className="text-[15px] font-bold text-ink">Event timeline</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <Th>When</Th>
                  <Th>Employee</Th>
                  <Th>Type</Th>
                  <Th>Channel</Th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-ink-3">
                      No events yet.
                    </td>
                  </tr>
                ) : (
                  events.map((e) => (
                    <tr
                      key={e.id}
                      className="border-b border-line last:border-b-0 transition-colors hover:bg-page"
                    >
                      <Td className="font-mono text-xs tabular-nums text-ink-3">
                        {e.createdAt.toISOString().replace("T", " ").slice(0, 16)}
                      </Td>
                      <Td>
                        <p className="font-semibold text-ink">{e.employee.name}</p>
                        <p className="text-xs text-ink-3">{e.employee.email}</p>
                      </Td>
                      <Td>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                            EVENT_TONE[e.type] ?? EVENT_TONE.sent
                          }`}
                        >
                          {e.type.replaceAll("_", " ")}
                        </span>
                      </Td>
                      <Td className="text-ink-2">{e.channel}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PageBody>
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">
      {children}
    </th>
  );
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-4 ${className}`}>{children}</td>;
}

function FunnelBar({
  label,
  count,
  pct,
  tone,
}: {
  label: string;
  count: number;
  pct: number;
  tone: "ink" | "amber" | "rose" | "green";
}) {
  const fillColor =
    tone === "amber"
      ? "var(--amber)"
      : tone === "rose"
        ? "var(--rose)"
        : tone === "green"
          ? "var(--green-active)"
          : "var(--ink)";
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-ink">{label}</span>
          <span className="text-xs text-ink-3">{pct}%</span>
        </div>
        <span className="font-mono text-sm tabular-nums text-ink-2">{count}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-page">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: fillColor }}
        />
      </div>
    </div>
  );
}

function OutcomeCell({
  icon: Icon,
  label,
  count,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-[14px] bg-green-soft/40 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-pill text-green">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-ink-3">{label}</div>
        <div className="mt-0.5 text-2xl font-bold tabular-nums text-ink">{count}</div>
      </div>
      <div className="text-right text-xs text-ink-3">{sub}</div>
    </div>
  );
}
