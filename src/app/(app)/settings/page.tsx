import { requireOrg } from "@/lib/session";
import { PageHeader, PageBody } from "@/components/page-header";
import { CheckCircleIcon, XCircleIcon, ShieldCheckIcon } from "lucide-react";

export default async function SettingsPage() {
  const { org, session } = await requireOrg();

  const envStatus = {
    llm: Boolean(process.env.LLM_API_KEY),
    email: Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST),
    voice: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
    tts: Boolean(process.env.ELEVENLABS_API_KEY),
  };

  return (
    <div className="bg-slate-50/50">
      <PageHeader
        title="Settings"
        description="Workspace details, data residency, and integration status."
      />
      <PageBody className="space-y-5 max-w-2xl">
        {/* Workspace card */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="font-semibold text-slate-900">Workspace</p>
          </div>
          <div className="divide-y divide-slate-50 px-5 py-2">
            <Row label="Name" value={org.name} />
            <Row
              label="Slug"
              value={
                <code className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                  {org.slug}
                </code>
              }
            />
            <Row label="Region" value={org.region} />
            <Row label="Admin" value={`${session.name || "—"} · ${session.email}`} />
          </div>
        </div>

        {/* Integrations card */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="font-semibold text-slate-900">Integrations</p>
          </div>
          <div className="divide-y divide-slate-50 px-5 py-2">
            <IntRow
              name="LLM Composer"
              on={envStatus.llm}
              help="Set LLM_PROVIDER and LLM_API_KEY. Fallback: deterministic mock templates."
            />
            <IntRow
              name="Email delivery"
              on={envStatus.email}
              help="Set RESEND_API_KEY or SMTP_* env vars. Fallback: preview mode (logs to console)."
            />
            <IntRow
              name="Vishing (Twilio)"
              on={envStatus.voice}
              help="Set TWILIO_ACCOUNT_SID / AUTH_TOKEN / FROM_NUMBER. Fallback: preview mode."
            />
            <IntRow
              name="Realistic TTS (ElevenLabs)"
              on={envStatus.tts}
              help="Optional. Falls back to Twilio Polly voice if unset."
            />
          </div>
        </div>

        {/* Ethics card */}
        <div className="overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50 shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-emerald-100 px-5 py-4">
            <ShieldCheckIcon className="h-4 w-4 text-emerald-600" />
            <p className="font-semibold text-emerald-900">Ethical Simulation Principles</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-emerald-800">
              These principles are enforced at the platform level. See the public ethics page for the full text.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-emerald-700">
              {[
                "No fake-layoff, fake-bonus, or fake-crisis templates.",
                "No impersonation of a named real individual without consent on file.",
                "All simulations logged and auditable.",
                "Reporters celebrated, clickers coached.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </PageBody>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}

function IntRow({ name, on, help }: { name: string; on: boolean; help: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900">{name}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{help}</p>
      </div>
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
          on
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-slate-200 bg-slate-50 text-slate-500"
        }`}
      >
        {on ? (
          <CheckCircleIcon className="h-3 w-3 text-emerald-500" />
        ) : (
          <XCircleIcon className="h-3 w-3 text-slate-400" />
        )}
        {on ? "Connected" : "Preview mode"}
      </span>
    </div>
  );
}
