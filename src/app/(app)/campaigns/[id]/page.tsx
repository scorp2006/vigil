import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrg } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, PageBody } from "@/components/page-header";
import { ArrowLeftIcon } from "lucide-react";

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

  const eventTypes = ["sent", "opened", "clicked", "submitted", "reported", "training_completed"];

  const eventStyles: Record<string, { badge: string }> = {
    reported: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    training_completed: { badge: "bg-blue-50 text-blue-700 border-blue-200" },
    clicked: { badge: "bg-rose-50 text-rose-700 border-rose-200" },
    submitted: { badge: "bg-rose-50 text-rose-700 border-rose-200" },
    opened: { badge: "bg-amber-50 text-amber-700 border-amber-200" },
    sent: { badge: "bg-slate-50 text-slate-600 border-slate-200" },
  };

  return (
    <div className="bg-slate-50/50">
      <PageHeader
        title={campaign.name}
        description={`${campaign.channel} · ${campaign.template?.category ?? "—"}`}
        actions={
          <Link
            href="/campaigns"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" /> Back to campaigns
          </Link>
        }
      />
      <PageBody className="space-y-5">
        {/* Stat mini-cards */}
        <div className="grid gap-3 grid-cols-3 md:grid-cols-6">
          {eventTypes.map((t) => (
            <div key={t} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
              <p className="text-xs uppercase tracking-wider text-slate-400">{t.replaceAll("_", " ")}</p>
              <p className="mt-1.5 text-2xl font-semibold tabular-nums text-slate-900">{counts[t] ?? 0}</p>
            </div>
          ))}
        </div>

        {/* Event timeline */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="font-semibold text-slate-900">Event timeline</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">When</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Employee</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Type</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Channel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {events.map((e) => {
                  const style = eventStyles[e.type] ?? eventStyles.sent;
                  return (
                    <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 text-xs tabular-nums text-slate-400">
                        {e.createdAt.toISOString().replace("T", " ").slice(0, 16)}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-900">{e.employee.name}</p>
                        <p className="text-xs text-slate-400">{e.employee.email}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.badge}`}>
                          {e.type.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{e.channel}</td>
                    </tr>
                  );
                })}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-400">
                      No events yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PageBody>
    </div>
  );
}
