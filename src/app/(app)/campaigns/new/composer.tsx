"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TrackerCard } from "@/components/vigil-ui";
import {
  SparklesIcon, MailIcon, PhoneCallIcon, BookOpenIcon, Loader2Icon,
  PlayIcon, ShieldAlertIcon, RocketIcon, UsersIcon, CheckIcon,
  CheckCircleIcon, GlobeIcon,
} from "lucide-react";
import { composeCampaignAction, launchCampaign } from "@/app/actions/campaigns";

type Employee = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  phone: string | null;
};

type ComposeSpecShape = {
  name: string;
  category: string;
  locale: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  bodyHtml: string;
  landingHeadline: string;
  landingSubhead: string;
  ctaLabel: string;
  voicePersona: string;
  voiceScript: string;
  redFlags: string[];
  training: {
    title: string;
    summary: string;
    lesson: string;
    quiz: Array<{ q: string; options: string[]; correctIndex: number; explain: string }>;
  };
};

const EXAMPLES = [
  "Finance team. Fake invoice from a vendor asking for an urgent wire to a new bank account.",
  "IT support calling everyone about a mandatory MFA re-enrollment by Monday.",
  "Aramex courier SMS claiming a package couldn't be delivered — confirm address via link.",
  "CFO fraud: short email from 'CFO' asking a finance manager to buy gift cards quickly.",
];

type ComposeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "blocked"; reason: string }
  | { status: "ready"; templateId: string; spec: ComposeSpecShape };

export function Composer({
  employees,
  defaultChannel,
}: {
  employees: Employee[];
  defaultChannel: "email" | "voice" | "multi";
}) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [locale, setLocale] = useState<"en" | "ar">("en");
  const [channel, setChannel] = useState<"email" | "voice" | "multi">(defaultChannel);
  const [composeState, setComposeState] = useState<ComposeState>({ status: "idle" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [pending, start] = useTransition();

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const onCompose = () => {
    if (!prompt.trim()) {
      toast.error("Describe the scenario first.");
      return;
    }
    setComposeState({ status: "loading" });
    start(async () => {
      const res = await composeCampaignAction({ prompt, locale, channel });
      if (res.blocked) {
        setComposeState({ status: "blocked", reason: res.reason });
        return;
      }
      setComposeState({ status: "ready", templateId: res.template.id, spec: res.spec });
      setName(res.spec.name);
    });
  };

  const onLaunch = () => {
    if (composeState.status !== "ready") return;
    if (selected.size === 0) {
      toast.error("Select at least one target.");
      return;
    }
    start(async () => {
      const res = await launchCampaign({
        templateId: composeState.templateId,
        name,
        targets: Array.from(selected),
        channel,
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(`Launched · ${res.sent} emails, ${res.called} calls`);
      router.push(`/campaigns/${res.campaignId}`);
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      {/* ── LEFT COLUMN ───────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        {/* Composer card with green-gradient header */}
        <div className="panel overflow-hidden">
          <div
            className="relative overflow-hidden p-6 text-white"
            style={{ background: "linear-gradient(135deg,#0a3d24 0%,#0a6034 60%,#0d7a3d 100%)" }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 80% 100%, rgba(255,255,255,0.22), transparent 50%)",
              }}
            />
            <div className="relative flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <SparklesIcon className="h-4 w-4" strokeWidth={2.2} />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#cfe4d7]">
                  AI Campaign Composer
                </div>
                <p className="text-lg font-bold">
                  Describe a scenario — Vigil composes the whole thing.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5 p-6">
            <div>
              <Label htmlFor="prompt">Scenario description</Label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder="e.g. Finance team, fake vendor invoice asking to update bank details to a new account…"
                className="mt-1.5 w-full resize-none rounded-[12px] border border-line bg-page px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-3 focus:border-green focus:bg-card"
              />
              <div className="mt-2.5">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">
                  Quick examples
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {EXAMPLES.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setPrompt(e)}
                      className="rounded-full bg-page px-3 py-1.5 text-xs text-ink-2 transition-colors hover:bg-green-soft hover:text-green"
                    >
                      {e.split(/[.,]/)[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div>
                <Label>Channel</Label>
                <SelectField
                  value={channel}
                  onChange={(v) => setChannel(v as "email" | "voice" | "multi")}
                  options={[
                    { value: "email", label: "Email only" },
                    { value: "voice", label: "Voice only" },
                    { value: "multi", label: "Email + Voice" },
                  ]}
                />
              </div>
              <div>
                <Label>Language</Label>
                <SelectField
                  value={locale}
                  onChange={(v) => setLocale(v as "en" | "ar")}
                  options={[
                    { value: "en", label: "English" },
                    { value: "ar", label: "Arabic" },
                  ]}
                />
              </div>
              <button
                type="button"
                onClick={onCompose}
                disabled={pending || composeState.status === "loading"}
                className="pill-btn primary justify-center !py-3 disabled:opacity-60"
              >
                {composeState.status === "loading" ? (
                  <>
                    <Loader2Icon className="h-4 w-4 animate-spin" /> Composing…
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4" strokeWidth={2.2} /> Compose
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Blocked state */}
        {composeState.status === "blocked" ? (
          <div className="panel p-5">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-soft text-rose">
                <ShieldAlertIcon className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-rose">
                  Blocked by Ethical Simulation Principles
                </p>
                <p className="mt-1 text-sm text-ink-2">{composeState.reason}</p>
                <p className="mt-2 text-xs text-ink-3">
                  Vigil refuses fake-layoff, fake-bonus, and impersonation of named real
                  individuals. Try a realistic business pretext instead.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Composed result */}
        {composeState.status === "ready" ? (
          <div className="panel overflow-hidden">
            <div className="flex flex-wrap items-center gap-2.5 border-b border-line bg-green-soft/40 px-5 py-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green text-white">
                <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
              <p className="text-[15px] font-bold text-ink">Campaign composed</p>
              <span className="ml-auto rounded-full bg-green-pill px-2.5 py-1 text-xs font-semibold text-green capitalize">
                {composeState.spec.category.replaceAll("_", " ")}
              </span>
              <span className="rounded-full bg-page px-2.5 py-1 text-xs font-semibold text-ink-2">
                {composeState.spec.locale}
              </span>
            </div>

            <div className="p-5">
              <h3 className="mb-4 text-[18px] font-bold text-ink">{composeState.spec.name}</h3>
              <ResultTabs spec={composeState.spec} />
            </div>
          </div>
        ) : null}
      </div>

      {/* ── RIGHT COLUMN — Launch panel ───────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="panel overflow-hidden">
          <div className="flex items-center gap-2.5 border-b border-line px-5 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-green-soft text-green">
              <RocketIcon className="h-4 w-4" />
            </div>
            <p className="text-[15px] font-bold text-ink">Launch</p>
          </div>

          <div className="flex flex-col gap-4 p-5">
            <div>
              <Label htmlFor="name">Campaign name</Label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Will default to the generated name"
                className="mt-1.5 w-full rounded-[12px] border border-line bg-page px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-3 focus:border-green focus:bg-card"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label>
                  <span className="inline-flex items-center gap-1.5">
                    <UsersIcon className="h-3.5 w-3.5" />
                    Targets
                    {selected.size > 0 ? (
                      <span className="rounded-full bg-green-pill px-1.5 text-[11px] font-semibold text-green">
                        {selected.size}
                      </span>
                    ) : null}
                  </span>
                </Label>
                <button
                  type="button"
                  className="text-xs font-semibold text-green hover:underline"
                  onClick={() =>
                    setSelected(
                      selected.size === employees.length
                        ? new Set()
                        : new Set(employees.map((e) => e.id)),
                    )
                  }
                >
                  {selected.size === employees.length ? "Clear all" : "Select all"}
                </button>
              </div>

              <div className="mt-1.5 max-h-72 overflow-y-auto rounded-[12px] border border-line bg-page">
                {employees.length === 0 ? (
                  <p className="p-4 text-center text-sm text-ink-3">
                    No employees yet. Import some first.
                  </p>
                ) : (
                  employees.map((e) => {
                    const checked = selected.has(e.id);
                    return (
                      <label
                        key={e.id}
                        className="flex cursor-pointer items-center gap-3 border-b border-line bg-card px-3 py-2.5 text-sm last:border-0 hover:bg-green-soft/30"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-green"
                          checked={checked}
                          onChange={() => toggle(e.id)}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">{e.name}</p>
                          <p className="truncate text-xs text-ink-3">
                            {e.email}
                            {e.department ? ` · ${e.department}` : ""}
                          </p>
                        </div>
                        {channel !== "email" && !e.phone ? (
                          <span className="shrink-0 rounded-full bg-amber-soft px-2 py-0.5 text-[10px] font-semibold text-amber">
                            no phone
                          </span>
                        ) : null}
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onLaunch}
              disabled={composeState.status !== "ready" || pending || selected.size === 0}
              className="pill-btn primary w-full justify-center !py-3.5 text-[15px] disabled:opacity-40"
            >
              {pending ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" /> Launching…
                </>
              ) : (
                <>
                  <RocketIcon className="h-4 w-4" />
                  {selected.size > 0
                    ? `Launch to ${selected.size} target${selected.size !== 1 ? "s" : ""}`
                    : "Launch campaign"}
                </>
              )}
            </button>

            {composeState.status !== "ready" ? (
              <p className="text-center text-xs text-ink-3">
                Compose a scenario first to enable launch.
              </p>
            ) : null}
          </div>
        </div>

        {/* Ethics callout — TrackerCard so it speaks the brand vocabulary */}
        <TrackerCard padded={false} className="p-5">
          <div className="mb-2 flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4" strokeWidth={2.2} />
            <p className="text-[13px] font-semibold">Ethical guardrails active</p>
          </div>
          <p className="text-xs leading-relaxed text-[#cfe4d7]">
            Vigil blocks cruel pretexts, fake layoffs, and named impersonation. Every campaign is
            audit-logged; employees are always informed simulations may happen.
          </p>
        </TrackerCard>
      </div>
    </div>
  );
}

/* ── Subcomponents ─────────────────────────────────────────────── */

function ResultTabs({ spec }: { spec: ComposeSpecShape }) {
  const [tab, setTab] = useState<"email" | "landing" | "voice" | "training">("email");

  const tabs: Array<{ id: typeof tab; label: string; Icon: React.ComponentType<{ className?: string }> }> = [
    { id: "email", label: "Email", Icon: MailIcon },
    { id: "landing", label: "Landing", Icon: GlobeIcon },
    { id: "voice", label: "Voice", Icon: PhoneCallIcon },
    { id: "training", label: "Training", Icon: BookOpenIcon },
  ];

  return (
    <div>
      <div className="panel inline-flex items-center gap-1 p-1">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              tab === id ? "bg-green text-white" : "text-ink-2 hover:bg-page"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "email" ? (
          <div className="rounded-[14px] bg-page p-5 text-sm">
            <div className="mb-3 grid grid-cols-[80px_1fr] gap-y-1.5 gap-x-3 text-xs">
              <span className="font-semibold uppercase tracking-[0.12em] text-ink-3">From</span>
              <span className="font-mono text-ink-2">
                {spec.fromName} &lt;{spec.fromEmail}&gt;
              </span>
              <span className="font-semibold uppercase tracking-[0.12em] text-ink-3">Subject</span>
              <span className="font-semibold text-ink">{spec.subject}</span>
            </div>
            <div className="mt-3 border-t border-line pt-3">
              <div
                className="text-sm leading-relaxed text-ink"
                dangerouslySetInnerHTML={{
                  __html: spec.bodyHtml.replace(/\{\{TRACK_URL\}\}/g, "#"),
                }}
              />
            </div>
          </div>
        ) : null}

        {tab === "landing" ? (
          <div className="rounded-[14px] bg-page p-6 text-center">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3">
              Landing page preview
            </p>
            <h3 className="text-xl font-bold text-ink">{spec.landingHeadline}</h3>
            <p className="mt-1 text-sm text-ink-2">{spec.landingSubhead}</p>
            <span className="pill-btn primary mt-4 inline-flex">{spec.ctaLabel}</span>
          </div>
        ) : null}

        {tab === "voice" ? (
          <div className="rounded-[14px] bg-page p-5 text-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-soft text-amber">
                <PhoneCallIcon className="h-3.5 w-3.5" />
              </div>
              <p className="font-semibold text-ink">{spec.voicePersona}</p>
            </div>
            <p className="whitespace-pre-line leading-relaxed text-ink-2">
              &ldquo;{spec.voiceScript}&rdquo;
            </p>
          </div>
        ) : null}

        {tab === "training" ? (
          <div className="flex flex-col gap-3 rounded-[14px] bg-page p-5 text-sm">
            <span className="self-start rounded-full bg-green-pill px-2.5 py-1 text-xs font-semibold text-green">
              90-second micro-training
            </span>
            <h3 className="text-base font-bold text-ink">{spec.training.title}</h3>
            <p className="text-ink-2">{spec.training.summary}</p>
            <p className="whitespace-pre-line leading-relaxed text-ink-2">{spec.training.lesson}</p>
            {spec.redFlags.length > 0 ? (
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3">
                  Red flags taught
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {spec.redFlags.map((f) => (
                    <span
                      key={f}
                      className="rounded-full bg-rose-soft px-2.5 py-1 text-xs text-rose"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            <p className="text-xs text-ink-3">
              {spec.training.quiz.length} quiz question{spec.training.quiz.length !== 1 ? "s" : ""}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3"
    >
      {children}
    </label>
  );
}

function SelectField({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1.5 w-full rounded-[12px] border border-line bg-card px-4 py-2.5 text-sm font-medium text-ink outline-none focus:border-green"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
