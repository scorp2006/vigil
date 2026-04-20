import Link from "next/link";
import { ShieldCheckIcon, CheckIcon } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      {/* ── LEFT PANEL — brand panel ─────────────────────────── */}
      <div className="hidden flex-col justify-between border-r border-slate-100 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 lg:flex">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-semibold text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/40">
            <ShieldCheckIcon className="h-5 w-5" />
          </div>
          <span className="text-lg tracking-tight">Vigil</span>
        </Link>

        {/* Quote */}
        <div className="space-y-6">
          <blockquote className="text-xl font-medium leading-relaxed text-white">
            &ldquo;Real attackers don&apos;t wait for quarterly training. Why do you?&rdquo;
          </blockquote>
          <p className="text-sm text-slate-400">— The attackers we built this to stop.</p>

          {/* Trust signals */}
          <div className="space-y-2.5 pt-4">
            {[
              "DPDP / GDPR / CCPA ready",
              "Regional data residency respected",
              "Ethical simulation principles enforced at platform level",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-slate-400">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                  <CheckIcon className="h-2.5 w-2.5 text-emerald-400" />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-500">© Vigil 2026. Human risk, handled with care.</p>
      </div>

      {/* ── RIGHT PANEL — form ───────────────────────────────── */}
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-8 py-12">
        {/* Mobile logo */}
        <div className="mb-10 lg:hidden">
          <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <ShieldCheckIcon className="h-4 w-4" />
            </div>
            Vigil
          </Link>
        </div>

        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
