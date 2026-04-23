import Link from "next/link";
import { requireOrg } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, PageBody } from "@/components/page-header";
import { SparklesIcon, PlusIcon } from "lucide-react";

const STATUS_TONE: Record<string, string> = {
  running: "bg-green-pill text-green",
  scheduled: "bg-amber-soft text-amber",
  completed: "bg-page text-ink-2",
  draft: "bg-page text-ink-3",
};

export default async function CampaignsPage() {
  const { org } = await requireOrg();
  const campaigns = await db.campaign.findMany({
    where: { orgId: org.id },
    orderBy: { createdAt: "desc" },
    include: { template: true, _count: { select: { events: true } } },
  });

  return (
    <>
      <PageHeader
        title="Campaigns"
        description="Every simulation you've run. Click one to see the per-employee event timeline."
        actions={
          <Link href="/campaigns/new" className="pill-btn primary">
            <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.5} /> New campaign
          </Link>
        }
      />
      <PageBody>
        {campaigns.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="panel overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <Th>Name</Th>
                  <Th>Channel</Th>
                  <Th>Category</Th>
                  <Th>Status</Th>
                  <Th>Events</Th>
                  <Th>Created</Th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-line last:border-b-0 transition-colors hover:bg-page">
                    <Td>
                      <Link
                        href={`/campaigns/${c.id}`}
                        className="font-semibold text-ink transition-colors hover:text-green"
                      >
                        {c.name}
                      </Link>
                    </Td>
                    <Td>
                      <Chip>{c.channel}</Chip>
                    </Td>
                    <Td className="text-ink-2">{c.template?.category || "—"}</Td>
                    <Td>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                          STATUS_TONE[c.status] ?? STATUS_TONE.draft
                        }`}
                      >
                        {c.status}
                      </span>
                    </Td>
                    <Td className="font-mono tabular-nums text-ink-2">{c._count.events}</Td>
                    <Td className="text-xs text-ink-3">{c.createdAt.toISOString().slice(0, 10)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-page px-2.5 py-1 text-xs text-ink-2">
      {children}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="panel flex flex-col items-center p-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-soft">
        <SparklesIcon className="h-6 w-6 text-green" />
      </div>
      <h3 className="text-base font-semibold text-ink">No campaigns yet</h3>
      <p className="mt-1.5 text-sm text-ink-2">
        Launch your first in under a minute with the AI Composer.
      </p>
      <Link href="/campaigns/new" className="pill-btn primary mt-6">
        <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.5} /> New campaign
      </Link>
    </div>
  );
}
