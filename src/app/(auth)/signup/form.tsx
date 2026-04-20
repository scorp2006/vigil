"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupForm() {
  const router = useRouter();
  const [pending, start] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    start(() => {
      router.push("/dashboard");
    });
  };

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="orgName">Organization name</Label>
        <Input id="orgName" name="orgName" required defaultValue="Acme Bank Ltd" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="name">Your name</Label>
          <Input id="name" name="name" defaultValue="Priya Shah" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" name="email" type="email" required defaultValue="priya@acme.demo" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required minLength={6} defaultValue="demo1234" />
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Creating…" : "Create workspace"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Demo workspace pre-filled — hit create and you&apos;re in.
      </p>
    </form>
  );
}
