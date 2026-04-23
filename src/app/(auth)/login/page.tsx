import Link from "next/link";
import LoginForm from "./form";
import { ensureSeeded } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  await ensureSeeded();
  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-ink md:text-[34px]">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-ink-2">
          Sign in to your Vigil workspace — or skip the form and jump into the demo.
        </p>
      </div>

      <LoginForm />

      <p className="mt-8 text-center text-sm text-ink-2">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-green hover:underline">
          Create a workspace
        </Link>
      </p>
    </div>
  );
}
