import Link from "next/link";
import LoginForm from "./form";

export default function LoginPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Sign in to your Vigil workspace.
        </p>
      </div>
      <LoginForm />
      <p className="mt-6 text-sm text-slate-500">
        New here?{" "}
        <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
          Create a workspace
        </Link>
      </p>
    </div>
  );
}
