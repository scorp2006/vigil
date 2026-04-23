"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function SignupForm() {
  const router = useRouter();
  const [pending, start] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    start(() => router.push("/dashboard"));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field id="orgName" label="Organization name" defaultValue="Nile Commercial Bank" required />
      <div className="grid grid-cols-2 gap-3">
        <Field id="name" label="Your name" defaultValue="Youssef El-Sayed" />
        <Field
          id="email"
          label="Work email"
          type="email"
          defaultValue="youssef@nile.demo"
          autoComplete="email"
          required
        />
      </div>
      <Field
        id="password"
        label="Password"
        type="password"
        defaultValue="demo1234"
        autoComplete="new-password"
        required
        minLength={6}
      />

      <button
        type="submit"
        disabled={pending}
        className="pill-btn primary w-full justify-center py-3.5 text-[15px] disabled:opacity-60"
      >
        {pending ? "Creating workspace…" : "Create workspace"}
      </button>

      <p className="text-center text-xs text-ink-3">
        Demo values pre-filled — hit create and you&apos;re in.
      </p>
    </form>
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
