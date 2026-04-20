import Link from "next/link";
import { requireOrg } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, PageBody } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { SparklesIcon } from "lucide-react";

export default async function CampaignsPage() {
  const { org } = await requireOrg();
  const campaigns = await db.campaign.findMany({
    where: { orgId: org.id },
    orderBy: { createdAt: "desc" },
    include: { template: true, _count: { select: { events: true } } },
  });

  const statusStyles: Record<string, string> = {
    running: "bg-blue-50 text-blue-700 border-blue-200",
    scheduled: "bg-violet-50 text-violet-700 border-violet-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    draft: "bg-slate-50 text-slate-600 border-slate-200",
  };

  return (
    <div className="bg-slate-50/50">
      <PageHeader
        title="Campaigns"
        description="Every simulation you've run. Click one to see the per-employee event timeline."
        actions={
          <Link href="/campaigns/new">
            <Button className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
              <SparklesIcon className="h-4 w-4" /> New campaign
            </Button>
          </Link>
        }
      />
      <PageBody>
        {campaigns.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
              <SparklesIcon className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">No campaigns yet</h3>
            <p className="mt-1.5 text-sm text-slate-500">
              Launch your first in under a minute with the AI Composer.
            </p>
            <Link href="/campaigns/new" className="mt-6 inline-block">
              <Button className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
                <SparklesIcon className="h-4 w-4" /> New campaign
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-left">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Name</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Channel</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Category</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Events</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/campaigns/${c.id}`}
                          className="font-medium text-slate-900 hover:text-blue-600 transition-colors"
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          {c.channel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{c.template?.category || "—"}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[c.status] ?? statusStyles.draft}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs tabular-nums text-slate-600">
                        {c._count.events}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-400">
                        {c.createdAt.toISOString().slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </PageBody>
    </div>
  );
}
