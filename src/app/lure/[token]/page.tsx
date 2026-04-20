import { redirect } from "next/navigation";
import { resolveTrackToken } from "@/lib/email";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/risk";
import { LureForm } from "./lure-form";
import { ShieldCheckIcon, LockIcon } from "lucide-react";

export default async function LurePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const resolved = await resolveTrackToken(token);
  if (!resolved) redirect("/");

  const campaign = await db.campaign.findUnique({
    where: { id: resolved.campaignId },
    include: { template: true },
  });
  if (!campaign?.template) redirect("/");

  await logEvent({
    orgId: resolved.orgId,
    employeeId: resolved.employeeId,
    campaignId: resolved.campaignId,
    type: "clicked",
    channel: "email",
    meta: { category: campaign.template.category },
  });

  let landing: { headline: string; subhead: string; ctaLabel: string } = {
    headline: "Sign in",
    subhead: "Enter your credentials to continue.",
    ctaLabel: "Continue",
  };
  try {
    if (campaign.template.landingHtml) {
      const parsed = JSON.parse(campaign.template.landingHtml);
      landing = { ...landing, ...parsed };
    }
  } catch {}

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Simulated portal header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-slate-900 flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span className="font-semibold text-slate-800">{campaign.template.fromName || "Portal"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <LockIcon className="h-3 w-3 text-emerald-500" />
            Secure session · TLS 1.3
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-4xl gap-10 px-6 py-16 md:grid-cols-2">
        {/* Left — marketing copy */}
        <div className="flex flex-col justify-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 leading-tight">
            {landing.headline}
          </h1>
          <p className="mt-3 text-slate-500 leading-relaxed">{landing.subhead}</p>
          <ul className="mt-6 space-y-2 text-sm text-slate-400">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" /> Single sign-on supported
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" /> MFA protected
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" /> 256-bit encryption
            </li>
          </ul>
        </div>

        {/* Right — form */}
        <LureForm token={token} ctaLabel={landing.ctaLabel} />
      </main>

      {/* Vigil disclosure bar */}
      <div className="fixed inset-x-0 bottom-0 border-t-2 border-amber-300 bg-amber-50">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-3 text-sm text-amber-900">
          <ShieldCheckIcon className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            <strong>This is a Vigil security simulation.</strong>{" "}
            Don&apos;t worry — no real credentials will be stored. See what you missed on the next screen.
          </span>
        </div>
      </div>
    </div>
  );
}
