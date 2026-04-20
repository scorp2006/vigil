import Link from "next/link";
import SignupForm from "./form";

export default function SignupPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Create your workspace</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Your org, your data. One admin account to start.
        </p>
      </div>
      <SignupForm />
      <p className="mt-6 text-sm text-slate-500">
        Already have one?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
