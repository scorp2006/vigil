import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheckIcon, CheckIcon, ArrowLeftIcon } from "lucide-react";

const PRINCIPLES = [
  {
    title: "Informed participation",
    body: "Employees are told that simulations will happen as part of security training, though not when. Consent is captured and audit-logged.",
    tag: "Consent",
  },
  {
    title: "No cruel pretexts",
    body: "We block fake layoff, fake bonus, fake death-in-the-family, and fake disciplinary-action templates at the platform level. Ever.",
    tag: "Content guardrails",
  },
  {
    title: "Celebrate reporters, coach clickers",
    body: "Failing a simulation is never grounds for punishment. Reporters appear on a celebratory leaderboard. Clickers get a 90-second coaching moment.",
    tag: "Outcomes",
  },
  {
    title: "Generic voices only",
    body: "Vishing simulations use generic AI voices. Cloning a named real executive requires their written consent on file and a human review.",
    tag: "Voice AI",
  },
  {
    title: "Regional data residency",
    body: "Indian organizations: AWS Mumbai. EU: Frankfurt. US: Virginia. We never export personally identifiable data across the boundary you care about.",
    tag: "Data & privacy",
  },
  {
    title: "Transparent scoring",
    body: "Every factor in the risk score is visible to admins. Scores decay over a 45-day half-life so people can improve.",
    tag: "Risk scoring",
  },
  {
    title: "Call-recording consent",
    body: "Recording is opt-in per jurisdiction. When enabled we play a disclosure prompt at the start of every call. Two-party-consent states are respected.",
    tag: "Compliance",
  },
  {
    title: "No dark-pattern urgency",
    body: "Admins cannot enable features that threaten termination, public shaming, or exposure for failure. The platform refuses.",
    tag: "UX guardrails",
  },
];

export default function EthicsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* NAV */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-slate-900">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <ShieldCheckIcon className="h-4 w-4" />
            </div>
            Vigil
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-slate-500 hover:text-slate-900">
              <ArrowLeftIcon className="h-3.5 w-3.5" /> Back to home
            </Button>
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Our pledge</p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
            Ethical Simulation Principles
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-lg leading-relaxed text-slate-500">
            Phishing simulations fail when they feel like traps. These are the rules we built into
            the platform so they never do.
          </p>
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="space-y-3">
          {PRINCIPLES.map((p, idx) => (
            <div
              key={p.title}
              className="group flex gap-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-blue-100 hover:shadow-md hover:shadow-blue-500/5"
            >
              {/* Number */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {idx + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-slate-900">{p.title}</h2>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    {p.tag}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{p.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA box */}
        <div className="mt-14 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-600 to-indigo-600 p-8 text-center text-white shadow-lg shadow-blue-500/20">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <CheckIcon className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold">We&apos;d rather lose the deal than lose the trust.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-blue-100">
            If any of these principles conflict with what you want, we&apos;re not the right vendor for
            you — and we&apos;d rather say that upfront.
          </p>
          <div className="mt-6">
            <Link href="/signup">
              <Button className="border border-white/30 bg-white/15 text-white hover:bg-white/25">
                Start with ethics first
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
