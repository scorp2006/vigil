"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { SparklesIcon } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const [pending, start] = useTransition();

  const goToApp = () => start(() => router.push("/dashboard"));

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    goToApp();
  };

  return (
    <div className="space-y-6">
      {/* Primary: zero-friction demo shortcut */}
      <button
        type="button"
        onClick={goToApp}
        disabled={pending}
        className="pill-btn primary w-full justify-center py-3.5 text-[15px] disabled:opacity-60"
      >
        <SparklesIcon className="h-4 w-4" strokeWidth={2.2} />
        Try the demo — no account needed
      </button>

      <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-3">
        <span className="h-px flex-1 bg-line" />
        or sign in
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          id="email"
          label="Work email"
          type="email"
          defaultValue="admin@nile.demo"
          autoComplete="email"
          required
        />
        <Field
          id="password"
          label="Password"
          type="password"
          defaultValue="demo1234"
          autoComplete="current-password"
          required
        />

        <button
          type="submit"
          disabled={pending}
          className="pill-btn w-full justify-center py-3.5 text-[15px] disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-ink-2">
        {label}
      </label>
      <input
        id={id}
        name={id}
        {...rest}
        className="w-full rounded-[12px] border border-line bg-page px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-green focus:bg-white"
      />
    </div>
  );
}
