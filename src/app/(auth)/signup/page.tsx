import Link from "next/link";
import SignupForm from "./form";

export default function SignupPage() {
  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-ink md:text-[34px]">
          Create your workspace
        </h1>
        <p className="mt-2 text-sm text-ink-2">
          Your org, your data. One admin account to start — and an ethics pledge baked in.
        </p>
      </div>

      <SignupForm />

      <p className="mt-8 text-center text-sm text-ink-2">
        Already have one?{" "}
        <Link href="/login" className="font-semibold text-green hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
