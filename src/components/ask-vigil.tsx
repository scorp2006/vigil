"use client";

import { useState, useTransition, useEffect } from "react";
import { askVigilAi } from "@/app/actions/ai";
import { SparklesIcon, XIcon, Loader2Icon, SendIcon } from "lucide-react";

const SUGGESTIONS = [
  "Why is our 30-day report rate trending the way it is?",
  "Which department needs targeted training next?",
  "Suggest a vishing scenario tailored for the Finance team.",
  "Summarise this week's high-risk events.",
];

export function AskVigilButton() {
  const [open, setOpen] = useState(false);

  // ⌘K / Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pill-btn primary !px-3 !py-2 text-xs"
        title="Ask Vigil AI (⌘K)"
      >
        <SparklesIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
        Ask Vigil
        <span className="hidden rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-medium md:inline">⌘K</span>
      </button>

      {open ? <Panel onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function Panel({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const ask = (q: string) => {
    setError(null);
    setAnswer(null);
    setQuery(q);
    start(async () => {
      const res = await askVigilAi(q);
      if ("error" in res) setError(res.error);
      else setAnswer(res.answer);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="flex-1 bg-ink/40 backdrop-blur-sm"
      />
      {/* panel */}
      <aside className="flex h-full w-full max-w-[460px] flex-col bg-card shadow-[-12px_0_48px_rgba(10,25,15,0.18)]">
        {/* header */}
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
          <div className="relative flex items-start justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                  <SparklesIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#cfe4d7]">
                  AI Copilot
                </p>
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Ask Vigil</h2>
              <p className="mt-1 text-sm text-[#cfe4d7]">
                Ask about your program, your people, or what to do next.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
              aria-label="Close"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* body */}
        <div className="flex flex-1 flex-col overflow-y-auto p-6">
          {!answer && !pending && !error ? (
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
                Try asking
              </p>
              <div className="flex flex-col gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => ask(s)}
                    className="rounded-[14px] border border-line bg-page px-4 py-3 text-left text-sm text-ink-2 transition-colors hover:border-green hover:bg-green-soft hover:text-ink"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {pending ? (
            <div className="flex items-center gap-3 rounded-[14px] bg-page p-4 text-sm text-ink-2">
              <Loader2Icon className="h-4 w-4 animate-spin text-green" />
              Thinking through your data…
            </div>
          ) : null}

          {answer ? (
            <div className="rounded-[14px] bg-green-soft p-4 text-sm leading-relaxed text-ink whitespace-pre-wrap">
              {answer}
              <div className="mt-3 border-t border-green/20 pt-3 text-xs text-ink-3">
                Vigil AI · grounded in your tenant&apos;s data
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-[14px] bg-rose-soft p-4 text-sm text-rose">{error}</div>
          ) : null}
        </div>

        {/* input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim()) ask(query);
          }}
          className="border-t border-line p-4"
        >
          <div className="flex items-center gap-2 rounded-[14px] border border-line bg-page px-3 py-2 focus-within:border-green focus-within:bg-white">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about your security program…"
              className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-3"
              autoFocus
            />
            <button
              type="submit"
              disabled={pending || !query.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-green text-white disabled:opacity-40"
              aria-label="Send"
            >
              <SendIcon className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-2 px-1 text-[11px] text-ink-3">
            Press <kbd className="rounded bg-page px-1 py-0.5">Esc</kbd> to close ·{" "}
            <kbd className="rounded bg-page px-1 py-0.5">⌘K</kbd> to toggle
          </p>
        </form>
      </aside>
    </div>
  );
}
