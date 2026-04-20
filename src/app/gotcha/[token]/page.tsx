import { redirect } from "next/navigation";
import Link from "next/link";
import { resolveTrackToken } from "@/lib/email";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { ShieldCheckIcon, AlertTriangleIcon, CheckCircleIcon, SparklesIcon, ArrowRightIcon } from "lucide-react";

export default async function GotchaPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { token } = await params;
  const { mode } = await searchParams;
  const resolved = await resolveTrackToken(token);
  if (!resolved) redirect("/");

  const campaign = await db.campaign.findUnique({
    where: { id: resolved.campaignId },
    include: { template: true },
  });
  const employee = await db.employee.findUnique({ where: { id: resolved.employeeId } });
  if (!campaign?.template) redirect("/");

  let training: { title: string; summary: string; redFlags?: string[] } = {
    title: "Micro-training",
    summary: "",
  };
  try {
    if (campaign.template.trainingModuleJson) {
      training = JSON.parse(campaign.template.trainingModuleJson);
    }
  } catch {}

  const reported = mode === "report";
  const firstName = employee?.name?.split(" ")[0] || (reported ? "friend" : "Hello");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* TOP HERO SECTION */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-2xl px-6 py-14 text-center">
          {reported ? (
            <>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircleIcon className="h-7 w-7 text-emerald-600" />
              </div>
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-sm font-semibold text-emerald-700">
                Well done, {firstName}
              </span>
              <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                You caught a phishing simulation.
              </h1>
              <p className="mx-auto mt-4 max-w-md text-balance text-slate-500 leading-relaxed">
                You just saved your team from a real attack. Take 60 seconds to see what the giveaways
                were — your instincts were right.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangleIcon className="h-7 w-7 text-amber-600" />
              </div>
              <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1 text-sm font-semibold text-amber-700">
                Gotcha · {firstName}
              </span>
              <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                This was a phishing simulation.
              </h1>
              <p className="mx-auto mt-4 max-w-md text-balance text-slate-500 leading-relaxed">
                Don&apos;t worry — no real credentials were stored. A real attacker would already have them.
                Let&apos;s make sure next time is different.
              </p>
            </>
          )}
        </div>
      </div>

      {/* TRAINING CARD */}
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50 px-6 py-4">
            <SparklesIcon className="h-4 w-4 text-blue-500" />
            <p className="text-sm font-medium text-slate-600">90-second micro-training</p>
          </div>

          <div className="p-6 space-y-4">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">{training.title}</h2>
            <p className="text-sm leading-relaxed text-slate-500">{training.summary}</p>

            {training.redFlags?.length ? (
              <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-rose-600">
                  Red flags in this simulation
                </p>
                <ul className="space-y-2">
                  {training.redFlags.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-rose-800">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Link href={`/train/${token}`} className="flex-1">
                <Button
                  size="lg"
                  className="w-full gap-2 bg-blue-600 text-white hover:bg-blue-700"
                >
                  Start 90-second module <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full gap-2 border-slate-200"
                >
                  <ShieldCheckIcon className="h-4 w-4" /> Learn about Vigil
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-xs leading-relaxed text-slate-400">
          At your company, failing a simulation is never grounds for punishment. It&apos;s a chance to
          practice and improve your risk score.
        </p>
      </div>
    </div>
  );
}
