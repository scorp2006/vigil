"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SparklesIcon,
  MailIcon,
  PhoneCallIcon,
  BookOpenIcon,
  Loader2Icon,
  PlayIcon,
  ShieldAlertIcon,
  RocketIcon,
  UsersIcon,
  CheckIcon,
} from "lucide-react";
import { composeCampaignAction, launchCampaign } from "@/app/actions/campaigns";

type Employee = { id: string; name: string; email: string; department: string | null; phone: string | null };
type Spec = Awaited<ReturnType<typeof composeCampaignAction>> extends { template: infer T; spec: infer S } | infer _
  ? S
  : never;

const EXAMPLES = [
  "Finance team. Fake invoice from vendor 'Kyocera' asking for urgent wire to new account.",
  "IT support calling everyone claiming a mandatory MFA re-enrollment by Monday.",
  "Blue Dart courier SMS claiming a package couldn't be delivered — confirm address via link.",
  "CEO fraud: short email from 'CEO' asking a finance manager to buy gift cards quickly.",
];

type ComposeResponse = Awaited<ReturnType<typeof composeCampaignAction>>;

export function Composer({
  employees,
  defaultChannel,
}: {
  employees: Employee[];
  defaultChannel: "email" | "voice" | "multi";
}) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [locale, setLocale] = useState("en");
  const [channel, setChannel] = useState<"email" | "voice" | "multi">(defaultChannel);
  const [composeState, setComposeState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "blocked"; reason: string }
    | { status: "ready"; templateId: string; spec: ComposeSpecShape }
  >({ status: "idle" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [pending, start] = useTransition();

  const toggle = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

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
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      {/* ── LEFT COLUMN ───────────────────────────────────────── */}
      <div className="space-y-5">
        {/* COMPOSER CARD */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Header */}
          <div className="border-b border-slate-100 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                <SparklesIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">AI Campaign Composer</p>
                <p className="text-xs text-blue-200">Describe a scenario — Vigil builds the whole campaign</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Scenario textarea */}
            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-slate-700 font-medium">
                Scenario description
              </Label>
              <Textarea
                id="prompt"
                rows={4}
                placeholder="e.g., Finance team. Fake invoice from vendor 'Kyocera' asking for urgent wire to a new account."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="resize-none border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 transition-colors"
              />
              {/* Example chips */}
              <div>
                <p className="mb-2 text-xs text-slate-400 font-medium">Quick examples:</p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLES.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setPrompt(e)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                    >
                      {e.split(".")[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Options row */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-medium">Channel</Label>
                <Select value={channel} onValueChange={(v) => { if (v) setChannel(v as "email" | "voice" | "multi"); }}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email only</SelectItem>
                    <SelectItem value="voice">Voice only</SelectItem>
                    <SelectItem value="multi">Email + Voice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-medium">Language</Label>
                <Select value={locale} onValueChange={(v) => { if (v) setLocale(v); }}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={onCompose}
                  disabled={pending || composeState.status === "loading"}
                  className="w-full gap-2 bg-blue-600 text-white hover:bg-blue-700"
                >
                  {composeState.status === "loading" ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    <SparklesIcon className="h-4 w-4" />
                  )}
                  {composeState.status === "loading" ? "Composing…" : "Compose"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* BLOCKED STATE */}
        {composeState.status === "blocked" ? (
          <div className="overflow-hidden rounded-xl border border-rose-200 bg-rose-50">
            <div className="flex gap-3 p-5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100">
                <ShieldAlertIcon className="h-4 w-4 text-rose-600" />
              </div>
              <div>
                <p className="font-semibold text-rose-800">Blocked by Ethical Simulation Principles</p>
                <p className="mt-1 text-sm text-rose-700">{composeState.reason}</p>
                <p className="mt-2 text-xs text-rose-600">
                  Vigil refuses fake-layoff, fake-bonus, or impersonation of named real individuals.
                  Try a realistic business pretext instead.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* COMPOSED RESULT */}
        {composeState.status === "ready" ? (
          <div className="overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm">
            {/* Success header */}
            <div className="flex items-center gap-3 border-b border-emerald-100 bg-emerald-50 px-5 py-3.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                <CheckIcon className="h-3.5 w-3.5 text-white" />
              </span>
              <p className="font-medium text-emerald-800">Campaign composed</p>
              <Badge className="ml-auto border-emerald-200 bg-emerald-100 text-emerald-700 text-xs">
                {composeState.spec.category.replaceAll("_", " ")}
              </Badge>
              <Badge className="border-slate-200 bg-white text-slate-600 text-xs">
                {composeState.spec.locale}
              </Badge>
            </div>

            <div className="p-5">
              <h3 className="mb-4 font-semibold text-slate-900">{composeState.spec.name}</h3>
              <Tabs defaultValue="email">
                <TabsList className="bg-slate-100">
                  <TabsTrigger value="email" className="gap-1.5 text-xs">
                    <MailIcon className="h-3.5 w-3.5" /> Email
                  </TabsTrigger>
                  <TabsTrigger value="landing" className="gap-1.5 text-xs">
                    <PlayIcon className="h-3.5 w-3.5" /> Landing
                  </TabsTrigger>
                  <TabsTrigger value="voice" className="gap-1.5 text-xs">
                    <PhoneCallIcon className="h-3.5 w-3.5" /> Voice
                  </TabsTrigger>
                  <TabsTrigger value="training" className="gap-1.5 text-xs">
                    <BookOpenIcon className="h-3.5 w-3.5" /> Training
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="email" className="mt-4">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm">
                    <div className="mb-3 grid grid-cols-[80px_1fr] gap-1 text-xs">
                      <span className="text-slate-400">From</span>
                      <span className="font-mono text-slate-600">
                        {composeState.spec.fromName} &lt;{composeState.spec.fromEmail}&gt;
                      </span>
                      <span className="text-slate-400">Subject</span>
                      <span className="font-medium text-slate-900">{composeState.spec.subject}</span>
                    </div>
                    <div className="mt-3 border-t border-slate-200 pt-3">
                      <div
                        className="prose prose-sm max-w-none text-sm leading-relaxed text-slate-700"
                        dangerouslySetInnerHTML={{ __html: composeState.spec.bodyHtml }}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="landing" className="mt-4">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-5 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Landing page preview</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">{composeState.spec.landingHeadline}</h3>
                    <p className="mt-1 text-slate-500">{composeState.spec.landingSubhead}</p>
                    <Button className="mt-4 bg-blue-600 text-white" size="sm" disabled>
                      {composeState.spec.ctaLabel}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="voice" className="mt-4">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm">
                    <div className="mb-3 flex items-center gap-2">
                      <PhoneCallIcon className="h-4 w-4 text-violet-500" />
                      <p className="font-medium text-slate-900">{composeState.spec.voicePersona}</p>
                    </div>
                    <p className="whitespace-pre-line leading-relaxed text-slate-600">
                      {composeState.spec.voiceScript}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="training" className="mt-4">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        90-sec micro-training
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">{composeState.spec.training.title}</h3>
                    <p className="text-slate-500">{composeState.spec.training.summary}</p>
                    <p className="whitespace-pre-line leading-relaxed text-slate-700">{composeState.spec.training.lesson}</p>
                    <p className="text-xs text-slate-400">
                      {composeState.spec.training.quiz.length} quiz question{composeState.spec.training.quiz.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : null}
      </div>

      {/* ── RIGHT COLUMN — LAUNCH PANEL ───────────────────────── */}
      <div className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Panel header */}
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <RocketIcon className="h-4 w-4 text-blue-600" />
            <p className="font-semibold text-slate-900">Launch</p>
          </div>

          <div className="p-5 space-y-4">
            {/* Campaign name */}
            <div className="space-y-1.5">
              <Label className="text-slate-700 font-medium text-xs">Campaign name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Will default to the generated name"
                className="border-slate-200 text-sm"
              />
            </div>

            {/* Targets */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-slate-700 font-medium text-xs flex items-center gap-1.5">
                  <UsersIcon className="h-3.5 w-3.5" />
                  Targets
                  {selected.size > 0 && (
                    <span className="ml-1 rounded-full bg-blue-100 px-1.5 text-blue-700">
                      {selected.size}
                    </span>
                  )}
                </Label>
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
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

              <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50">
                {employees.length === 0 ? (
                  <p className="p-4 text-center text-sm text-slate-400">
                    No employees yet. Import some first.
                  </p>
                ) : (
                  employees.map((e) => (
                    <label
                      key={e.id}
                      className="flex cursor-pointer items-center gap-3 border-b border-slate-100 bg-white px-3 py-2.5 text-sm last:border-0 hover:bg-blue-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                        checked={selected.has(e.id)}
                        onChange={() => toggle(e.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{e.name}</p>
                        <p className="truncate text-xs text-slate-400">
                          {e.email}{e.department ? ` · ${e.department}` : ""}
                        </p>
                      </div>
                      {channel !== "email" && !e.phone ? (
                        <Badge variant="outline" className="shrink-0 text-xs border-amber-200 text-amber-600 bg-amber-50">
                          no phone
                        </Badge>
                      ) : null}
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Launch button */}
            <Button
              onClick={onLaunch}
              disabled={composeState.status !== "ready" || pending || selected.size === 0}
              className="w-full gap-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
              size="lg"
            >
              {pending ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <RocketIcon className="h-4 w-4" />
              )}
              {pending
                ? "Launching…"
                : selected.size > 0
                  ? `Launch to ${selected.size} target${selected.size !== 1 ? "s" : ""}`
                  : "Launch campaign"}
            </Button>

            {composeState.status !== "ready" ? (
              <p className="text-center text-xs text-slate-400">
                Compose a scenario first to enable launch.
              </p>
            ) : null}
          </div>
        </div>

        {/* Ethics reminder */}
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs font-semibold text-emerald-800">Ethical guardrails active</p>
          <p className="mt-1 text-xs leading-relaxed text-emerald-700">
            Vigil blocks cruel pretexts, fake layoffs, and named impersonation. All campaigns are
            audit-logged and employees are always informed simulations will happen.
          </p>
        </div>
      </div>
    </div>
  );
}

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
