import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrg } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, PageBody } from "@/components/page-header";
import { ArrowLeftIcon } from "lucide-react";

const EVENT_TYPES = ["sent", "opened", "clicked", "submitted", "reported", "training_completed"];

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

  return (
    <>
      <PageHeader
        title={campaign.name}
        description={`${campaign.channel} · ${campaign.template?.category ?? "—"}`}
        actions={
          <Link href="/campaigns" className="pill-btn">
            <ArrowLeftIcon className="h-3.5 w-3.5" /> Back to campaigns
          </Link>
        }
      />
      <PageBody>
        {/* Counter row */}
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
          {EVENT_TYPES.map((t) => (
            <div key={t} className="panel p-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3">
                {t.replaceAll("_", " ")}
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-ink">{counts[t] ?? 0}</p>
            </div>
          ))}
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
