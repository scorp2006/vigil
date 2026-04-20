"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { markSubmitted, markReported } from "@/app/actions/lure";
import { FlagIcon } from "lucide-react";

export function LureForm({ token, ctaLabel }: { token: string; ctaLabel: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    start(async () => {
      await markSubmitted(token);
      router.push(`/gotcha/${token}?mode=submit`);
    });
  };

  const onReport = () => {
    start(async () => {
      await markReported(token);
      router.push(`/gotcha/${token}?mode=report`);
    });
  };

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-200/60">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-slate-700 text-sm font-medium">
            Email address
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@acme.com"
            className="border-slate-200 text-slate-900"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-slate-700 text-sm font-medium">
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            className="border-slate-200 text-slate-900"
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-slate-900 text-white hover:bg-slate-800"
          size="lg"
          disabled={pending}
        >
          {pending ? "Verifying…" : ctaLabel}
        </Button>

        <div className="relative my-4 flex items-center">
          <div className="flex-1 border-t border-slate-200" />
          <span className="mx-3 text-xs text-slate-400">or</span>
          <div className="flex-1 border-t border-slate-200" />
        </div>

        <button
          type="button"
          onClick={onReport}
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100"
        >
          <FlagIcon className="h-4 w-4" />
          This looks suspicious — report it
        </button>
      </div>
    </form>
  );
}
