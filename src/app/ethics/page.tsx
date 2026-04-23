import Link from "next/link";
import { TrackerCard } from "@/components/vigil-ui";
import { ArrowLeftIcon, CheckIcon, ShieldCheckIcon } from "lucide-react";

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
    body: "Egyptian organizations: AWS Bahrain (Middle East). EU customers: Frankfurt. We never export personally identifiable data across the boundary you care about.",
    tag: "Data & privacy",
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
    <div className="min-h-screen bg-page p-4 lg:p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {/* Topbar — mirrors (app) layout */}
        <div className="panel flex items-center justify-between px-[22px] py-3.5">
          <Link href="/login" className="flex items-center gap-2.5 font-bold text-ink">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green text-base font-bold text-white">
              V
            </div>
            <span className="text-lg tracking-tight">Vigil</span>
          </Link>
          <Link href="/login" className="more-btn">
            <ArrowLeftIcon className="h-3.5 w-3.5" /> Back
          </Link>
        </div>

        {/* Hero */}
        <TrackerCard className="p-10" padded={false}>
          <div className="mb-5 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <ShieldCheckIcon className="h-4 w-4" strokeWidth={2.2} />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#cfe4d7]">
              Our Pledge
            </p>
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-[42px]">
            Ethical Simulation Principles
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#cfe4d7] md:text-base">
            Phishing simulations fail when they feel like traps. These are the rules we built into
            the platform so they never do.
          </p>
        </TrackerCard>

        {/* Principles */}
        <div className="flex flex-col gap-3">
          {PRINCIPLES.map((p, idx) => (
            <div key={p.title} className="panel flex gap-5 p-5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-pill text-xs font-bold text-green">
                {idx + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[15px] font-bold text-ink">{p.title}</h2>
                  <span className="rounded-full bg-green-soft px-2 py-0.5 text-xs text-green">
                    {p.tag}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-ink-2">{p.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Closing callout */}
        <TrackerCard className="p-8 text-center" padded={false}>
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
            <CheckIcon className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-bold">
            We&apos;d rather lose the deal than lose the trust.
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#cfe4d7]">
            If any of these principles conflict with what you want, we&apos;re not the right vendor
            for you — and we&apos;d rather say that upfront.
          </p>
          <div className="mt-6">
            <Link href="/signup" className="pill-btn bg-white !border-white !text-green">
              Start with ethics first
            </Link>
          </div>
        </TrackerCard>

        <p className="px-2 py-2 text-center text-xs text-ink-3">
          © Vigil 2026 · Human risk, handled with care.
        </p>
      </div>
    </div>
  );
}
