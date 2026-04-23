"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { generateTemplate, createTemplateManual } from "@/app/actions/templates";
import { SparklesIcon, Loader2Icon, ShieldAlertIcon } from "lucide-react";

const EXAMPLES = [
  "Finance team. Fake invoice from a vendor asking for an urgent wire to a new bank account.",
  "IT support calling everyone about a mandatory MFA re-enrollment by Monday.",
  "Aramex courier SMS claiming a package couldn't be delivered — confirm address via link.",
  "CFO fraud: short email from 'CFO' asking a finance manager to buy gift cards quickly.",
];

type Mode = "ai" | "manual";

export function NewTemplateComposer() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("ai");

  return (
    <div className="flex flex-col gap-4">
      <div className="panel inline-flex items-center gap-1 self-start p-1">
        <Tab active={mode === "ai"} onClick={() => setMode("ai")}>
          <SparklesIcon className="h-3.5 w-3.5" /> AI Compose
        </Tab>
        <Tab active={mode === "manual"} onClick={() => setMode("manual")}>
          Manual
        </Tab>
      </div>

      {mode === "ai" ? <AiForm onDone={(id) => router.push(`/templates/${id}`)} /> : <ManualForm onDone={(id) => router.push(`/templates/${id}`)} />}

      <p className="px-1 text-xs text-ink-3">
        Any template can be launched as a campaign later from{" "}
        <Link href="/campaigns/new" className="font-semibold text-green hover:underline">
          Campaigns → New
        </Link>
        .
      </p>
    </div>
  );
}

function Tab({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        active ? "bg-green text-white" : "text-ink-2 hover:bg-page"
      }`}
    >
      {children}
    </button>
  );
}

function AiForm({ onDone }: { onDone: (templateId: string) => void }) {
  const [prompt, setPrompt] = useState("");
  const [channel, setChannel] = useState<"email" | "voice" | "multi">("email");
  const [locale, setLocale] = useState<"en" | "ar">("en");
  const [pending, start] = useTransition();
  const [blocked, setBlocked] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast.error("Describe the scenario first.");
      return;
    }
    setBlocked(null);
    start(async () => {
      const res = await generateTemplate({ prompt, channel, locale });
      if (res.blocked) {
        setBlocked(res.reason);
        return;
      }
      toast.success("Template created.");
      onDone(res.templateId);
    });
  };

  return (
    <form onSubmit={submit} className="panel flex flex-col gap-5 p-6">
      <div>
        <Label htmlFor="prompt">Scenario prompt</Label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder="e.g. Finance team, fake vendor invoice asking to update bank details…"
          className="mt-1.5 w-full resize-none rounded-[12px] border border-line bg-page px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-3 focus:border-green focus:bg-white"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {EXAMPLES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setPrompt(e)}
              className="rounded-full bg-page px-3 py-1 text-xs text-ink-2 transition-colors hover:bg-green-soft hover:text-green"
            >
              {e.slice(0, 55)}…
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Channel</Label>
          <SelectField value={channel} onChange={(v) => setChannel(v as typeof channel)} options={[
            { value: "email", label: "Email" },
            { value: "voice", label: "Voice" },
            { value: "multi", label: "Multi (email + voice)" },
          ]} />
        </div>
        <div>
          <Label>Locale</Label>
          <SelectField value={locale} onChange={(v) => setLocale(v as typeof locale)} options={[
            { value: "en", label: "English" },
            { value: "ar", label: "Arabic" },
          ]} />
        </div>
      </div>

      {blocked ? (
        <div className="flex items-start gap-2.5 rounded-[14px] bg-rose-soft p-4 text-sm text-rose">
          <ShieldAlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Blocked by ethics guardrails</p>
            <p className="mt-0.5 text-xs">{blocked}</p>
          </div>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="pill-btn primary w-full justify-center py-3.5 text-[15px] disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2Icon className="h-4 w-4 animate-spin" /> Composing…
          </>
        ) : (
          <>
            <SparklesIcon className="h-4 w-4" /> Generate template
          </>
        )}
      </button>
    </form>
  );
}

function ManualForm({ onDone }: { onDone: (templateId: string) => void }) {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<"email" | "voice" | "multi">("email");
  const [category, setCategory] = useState("invoice_fraud");
  const [locale, setLocale] = useState<"en" | "ar">("en");
  const [subject, setSubject] = useState("");
  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [voiceScript, setVoiceScript] = useState("");
  const [voicePersona, setVoicePersona] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await createTemplateManual({
        name, channel, category, locale,
        subject, fromName, fromEmail, bodyHtml, voiceScript, voicePersona,
      });
      if ("error" in res) {
        setError(res.error ?? "Could not save template.");
        return;
      }
      toast.success("Template saved.");
      onDone(res.templateId);
    });
  };

  return (
    <form onSubmit={submit} className="panel flex flex-col gap-5 p-6">
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
        <div>
          <Label htmlFor="name">Template name</Label>
          <TextInput id="name" value={name} onChange={setName} required placeholder="Vendor invoice urgency" />
        </div>
        <div>
          <Label>Channel</Label>
          <SelectField value={channel} onChange={(v) => setChannel(v as typeof channel)} options={[
            { value: "email", label: "Email" },
            { value: "voice", label: "Voice" },
            { value: "multi", label: "Multi" },
          ]} />
        </div>
        <div>
          <Label>Locale</Label>
          <SelectField value={locale} onChange={(v) => setLocale(v as typeof locale)} options={[
            { value: "en", label: "English" },
            { value: "ar", label: "Arabic" },
          ]} />
        </div>
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <TextInput id="category" value={category} onChange={setCategory} required placeholder="e.g. invoice_fraud, it_support, courier" />
      </div>

      {channel !== "voice" ? (
        <fieldset className="flex flex-col gap-4 rounded-[14px] bg-page/60 p-4">
          <legend className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Email</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="fromName">From name</Label>
              <TextInput id="fromName" value={fromName} onChange={setFromName} placeholder="Kyocera Accounts" />
            </div>
            <div>
              <Label htmlFor="fromEmail">From email</Label>
              <TextInput id="fromEmail" value={fromEmail} onChange={setFromEmail} type="email" placeholder="accounts@kyocera-payments.co" />
            </div>
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <TextInput id="subject" value={subject} onChange={setSubject} placeholder="URGENT: Invoice past due" />
          </div>
          <div>
            <Label htmlFor="bodyHtml">Body (HTML — use &#123;&#123;TRACK_URL&#125;&#125; for the tracked link)</Label>
            <textarea
              id="bodyHtml"
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              rows={6}
              className="mt-1.5 w-full resize-y rounded-[12px] border border-line bg-white px-4 py-3 font-mono text-xs text-ink outline-none focus:border-green"
            />
          </div>
        </fieldset>
      ) : null}

      {channel !== "email" ? (
        <fieldset className="flex flex-col gap-4 rounded-[14px] bg-page/60 p-4">
          <legend className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Voice</legend>
          <div>
            <Label htmlFor="voicePersona">Voice persona</Label>
            <TextInput id="voicePersona" value={voicePersona} onChange={setVoicePersona} placeholder="IT helpdesk agent" />
          </div>
          <div>
            <Label htmlFor="voiceScript">Script</Label>
            <textarea
              id="voiceScript"
              value={voiceScript}
              onChange={(e) => setVoiceScript(e.target.value)}
              rows={5}
              className="mt-1.5 w-full resize-y rounded-[12px] border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-green"
            />
          </div>
        </fieldset>
      ) : null}

      {error ? (
        <div className="flex items-start gap-2.5 rounded-[14px] bg-rose-soft p-4 text-sm text-rose">
          <ShieldAlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      <div className="flex justify-end gap-3">
        <Link href="/templates" className="pill-btn">Cancel</Link>
        <button
          type="submit"
          disabled={pending}
          className="pill-btn primary disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save template"}
        </button>
      </div>
    </form>
  );
}

/* ── inputs ──────────────────────────────────────────────────────── */

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-semibold text-ink-2">
      {children}
    </label>
  );
}

function TextInput({
  id,
  value,
  onChange,
  ...rest
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1.5 w-full rounded-[12px] border border-line bg-white px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-3 focus:border-green"
      {...rest}
    />
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
      className="mt-1.5 w-full rounded-[12px] border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-green"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
