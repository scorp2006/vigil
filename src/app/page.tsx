import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheckIcon,
  PhoneCallIcon,
  MailIcon,
  SparklesIcon,
  GraduationCapIcon,
  ActivityIcon,
  HeartHandshakeIcon,
  ArrowRightIcon,
  CheckIcon,
  ZapIcon,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── NAV ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-slate-900">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/30">
              <ShieldCheckIcon className="h-4 w-4" />
            </div>
            <span className="tracking-tight">Vigil</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-500 md:flex">
            <a href="#capabilities" className="transition-colors hover:text-slate-900">Platform</a>
            <a href="#ethics" className="transition-colors hover:text-slate-900">Ethics</a>
            <a href="#lms" className="transition-colors hover:text-slate-900">LMS</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-blue-600 text-white shadow-sm hover:bg-blue-700">Start free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-slate-100">
        {/* Subtle grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #e2e8f0 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Blue glow from top */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-blue-500/8 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 text-center">
          <Badge className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-medium text-blue-700">
            <ZapIcon className="h-3 w-3" /> AI-native. DPDP / GDPR ready.
          </Badge>

          <h1 className="mx-auto max-w-4xl text-balance text-5xl font-semibold leading-[1.08] tracking-[-0.03em] text-slate-900 md:text-7xl">
            Train humans against the{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              attacks AI just made cheap
            </span>
            .
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-slate-500">
            Vigil runs realistic email and voice phishing simulations, scores real behavior risk, and
            prescribes training your LMS already knows how to deliver.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup">
              <Button size="lg" className="h-11 gap-2 bg-blue-600 px-6 text-white shadow-sm shadow-blue-600/25 hover:bg-blue-700">
                Launch a demo tenant <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/ethics">
              <Button size="lg" variant="outline" className="h-11 border-slate-200 px-6 text-slate-700 hover:border-slate-300 hover:bg-slate-50">
                Read our ethics pledge
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-400">
            No credit card. No content library contract. Works without any API keys in preview mode.
          </p>

          {/* Social proof strip */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-xs font-medium text-slate-400">
            {["DPDP Ready", "GDPR Compliant", "SOC 2 Aligned", "CCPA Ready", "xAPI / SCORM 2004"].map((badge) => (
              <span key={badge} className="flex items-center gap-1.5">
                <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAPABILITIES ────────────────────────────────────────── */}
      <section id="capabilities" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">One platform, every vector</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            Real attackers don&apos;t pick a lane. Neither do we.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: MailIcon,
              title: "Email phishing",
              body: "AI-generated templates indistinguishable from real spear-phishing. Tracked opens, clicks, submissions, and reports.",
              color: "bg-blue-50 text-blue-600",
            },
            {
              icon: PhoneCallIcon,
              title: "AI vishing calls",
              body: "Place real voice calls from the dashboard. AI persona adapts to the target's replies. DTMF and speech captured.",
              color: "bg-violet-50 text-violet-600",
            },
            {
              icon: ActivityIcon,
              title: "Behavior-first risk",
              body: "Not click-rates. We score fast reporting, training completion, and recovery — with 90-day decay so people can improve.",
              color: "bg-emerald-50 text-emerald-600",
            },
            {
              icon: SparklesIcon,
              title: "AI Campaign Composer",
              body: "Describe the scenario in one sentence. Vigil generates the email, landing page, voice script, and training module.",
              color: "bg-amber-50 text-amber-600",
            },
            {
              icon: GraduationCapIcon,
              title: "90-second micro-training",
              body: "Delivered at the gotcha moment. No 15-minute modules. Learning happens where it's earned.",
              color: "bg-sky-50 text-sky-600",
            },
            {
              icon: HeartHandshakeIcon,
              title: "Ethical by design",
              body: "No fake layoffs. No public shaming. Celebrate reporters. Principles built into the product, not a blog post.",
              color: "bg-rose-50 text-rose-600",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5"
            >
              <div className={`mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg ${f.color}`}>
                <f.icon className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── LMS BRIDGE ──────────────────────────────────────────── */}
      <section id="lms" className="border-y border-slate-100 bg-slate-50/70">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-2">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">LMS Bridge</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              We don&apos;t replace your LMS. We make it smarter.
            </h2>
            <p className="mt-4 leading-relaxed text-slate-500">
              Vigil is the human-risk data layer. Your existing LMS — Moodle, SAP SuccessFactors,
              TalentLMS, or in-house — simply reads our{" "}
              <code className="rounded-md bg-slate-200/80 px-1.5 py-0.5 font-mono text-xs text-slate-700">
                Training Prescription API
              </code>{" "}
              and assigns the right course to the right person at the right time.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {[
                "SCORM 2004 package export",
                "xAPI statements to any LRS",
                "Training Prescription API (JSON)",
                "Single sign-on ready (SAML / OIDC)",
              ].map((x) => (
                <li key={x} className="flex items-center gap-2.5 text-slate-700">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <CheckIcon className="h-3 w-3 text-emerald-600" />
                  </span>
                  {x}
                </li>
              ))}
            </ul>
          </div>

          {/* Code card */}
          <div className="flex flex-col justify-center">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                GET /api/v1/prescription/e_123
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-xs leading-relaxed text-slate-700">{`{
  "employee_id": "e_123",
  "risk_score": 72,
  "risk_band": "high",
  "weak_areas": [
    "vendor_invoice_fraud",
    "urgency_pressure",
    "voice_impersonation"
  ],
  "recommended_courses": [
    { "scorm_id": "vf_001",
      "title": "Spotting vendor invoice fraud",
      "est_minutes": 5 },
    { "scorm_id": "ui_003",
      "title": "Urgency as a red flag",
      "est_minutes": 3 }
  ],
  "last_incident": "2026-04-15T10:22:00Z"
}`}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── ETHICS CALLOUT ──────────────────────────────────────── */}
      <section id="ethics" className="mx-auto max-w-6xl px-6 py-24">
        <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-600 to-indigo-600 p-10 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">
            Ethical Simulation Principles
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
            We tell your people we might test them. We just don&apos;t tell them when.
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              "Employees are informed that simulations will happen — consent framework built in.",
              "No fake layoffs, fake bonuses, or fake disciplinary action templates. Ever.",
              "Failing a simulation is never grounds for punishment. Reporters are celebrated.",
              "Voice simulations use generic AI voices. Cloning a real person requires written consent on file.",
              "Data residency respects regional law: India on AWS Mumbai, EU on Frankfurt, US on Virginia.",
              "Call recording is opt-in per jurisdiction, with mandatory two-party disclosure prompts.",
            ].map((p) => (
              <div key={p} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <CheckIcon className="h-3 w-3" />
                </span>
                <p className="text-sm leading-relaxed text-blue-100">{p}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/ethics">
              <Button className="border border-white/30 bg-white/15 text-white backdrop-blur hover:bg-white/25">
                Read the full ethics pledge <ArrowRightIcon className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-slate-400 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-white">
              <ShieldCheckIcon className="h-3.5 w-3.5" />
            </div>
            <p>© Vigil 2026 — Human risk, handled with care.</p>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/ethics" className="transition-colors hover:text-slate-600">Ethics</Link>
            <Link href="/login" className="transition-colors hover:text-slate-600">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
