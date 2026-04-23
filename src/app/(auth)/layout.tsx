import Link from "next/link";
import { CheckIcon } from "lucide-react";

const TRUST = [
  "Ethical guardrails enforced at the platform level",
  "Regional data residency — IN / EU / US",
  "No fake layoffs, no shame leaderboards, ever",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-page p-4 lg:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-5xl gap-4 lg:grid-cols-2 lg:gap-6">
        {/* Brand panel — green gradient, same vocabulary as dashboard promo */}
        <aside
          className="panel relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex"
          style={{
            background:
              "linear-gradient(145deg,#0a3d24 0%,#0a6034 50%,#0d7a3d 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 85% 110%, rgba(255,255,255,0.22), transparent 42%), radial-gradient(circle at 15% 10%, rgba(255,255,255,0.08), transparent 50%)",
            }}
          />

          {/* Brand */}
          <Link href="/login" className="relative flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white text-[18px] font-bold text-green">
              V
            </div>
            <span className="text-xl font-bold tracking-tight">Vigil</span>
          </Link>

          {/* Pull quote + trust */}
          <div className="relative space-y-6">
            <blockquote className="text-[22px] font-semibold leading-[1.3] tracking-tight">
              &ldquo;Real attackers don&apos;t wait for quarterly training.&rdquo;
            </blockquote>
            <p className="text-sm text-[#cfe4d7]">
              Simulate, measure, and coach — ethically. No shame, no gotchas beyond the 90-second
              training moment.
            </p>

            <div className="space-y-2.5 pt-2">
              {TRUST.map((t) => (
                <div key={t} className="flex items-start gap-2.5 text-sm text-[#cfe4d7]">
                  <span className="mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/20">
                    <CheckIcon className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                  {t}
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-xs text-[#9ec2ad]">
            © Vigil 2026 · Human risk, handled with care.
          </p>
        </aside>

        {/* Form panel */}
        <main className="panel flex flex-col justify-center px-8 py-12 sm:px-12 lg:p-14">
          {/* Mobile brand lockup */}
          <Link href="/login" className="mb-10 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green text-base font-bold text-white">
              V
            </div>
            <span className="text-lg font-bold tracking-tight text-ink">Vigil</span>
          </Link>

          <div className="mx-auto w-full max-w-sm">{children}</div>
        </main>
      </div>
    </div>
  );
}
