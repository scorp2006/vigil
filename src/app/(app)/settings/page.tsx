import { requireOrg } from "@/lib/session";
import { PageHeader, PageBody } from "@/components/page-header";
import { TrackerCard } from "@/components/vigil-ui";
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
    <>
      <PageHeader
        title="Settings"
        description="Workspace details, data residency, and integration status."
      />
      <PageBody className="max-w-2xl">
        {/* Workspace */}
        <div className="panel overflow-hidden">
          <SectionHead>Workspace</SectionHead>
          <div className="px-5 py-1">
            <Row label="Name" value={org.name} />
            <Row
              label="Slug"
              value={
                <code className="rounded-md bg-page px-2 py-0.5 font-mono text-xs text-ink-2">
                  {org.slug}
                </code>
              }
            />
            <Row label="Region" value={org.region} />
            <Row label="Admin" value={`${session.name || "—"} · ${session.email}`} />
          </div>
        </div>

        {/* Integrations */}
        <div className="panel overflow-hidden">
          <SectionHead>Integrations</SectionHead>
          <div className="px-5 py-1">
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

        {/* Ethics — the Donezo "tracker" card style, green gradient */}
        <TrackerCard>
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <ShieldCheckIcon className="h-4 w-4" />
            </div>
            <p className="text-[15px] font-bold">Ethical Simulation Principles</p>
          </div>
          <p className="text-sm text-[#cfe4d7]">
            These principles are enforced at the platform level. See the public ethics page for the full text.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              "No fake-layoff, fake-bonus, or fake-crisis templates.",
              "No impersonation of a named real individual without consent on file.",
              "All simulations logged and auditable.",
              "Reporters celebrated, clickers coached.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[#cfe4d7]">
                <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-white/80" />
                {item}
              </li>
            ))}
          </ul>
        </TrackerCard>
      </PageBody>
    </>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-line px-5 py-4">
      <p className="text-[15px] font-bold text-ink">{children}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-3 last:border-b-0">
      <span className="text-sm text-ink-2">{label}</span>
      <span className="text-sm font-semibold text-ink">{value}</span>
    </div>
  );
}

function IntRow({ name, on, help }: { name: string; on: boolean; help: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-4 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{name}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-2">{help}</p>
      </div>
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
          on ? "bg-green-pill text-green" : "bg-page text-ink-3"
        }`}
      >
        {on ? (
          <CheckCircleIcon className="h-3.5 w-3.5" />
        ) : (
          <XCircleIcon className="h-3.5 w-3.5" />
        )}
        {on ? "Connected" : "Preview mode"}
      </span>
    </div>
  );
}
