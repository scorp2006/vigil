"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveLrsConfig } from "@/app/actions/lms";

export function LrsForm({
  initial,
}: {
  initial: { lrsEndpoint: string | null; lrsAuth: string | null } | null;
}) {
  const [pending, start] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      await saveLrsConfig(fd);
      toast.success("LRS config saved");
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="lrsEndpoint">LRS endpoint</Label>
        <Input
          id="lrsEndpoint"
          name="lrsEndpoint"
          defaultValue={initial?.lrsEndpoint ?? ""}
          placeholder="https://yourlrs.example.com/xapi/statements"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lrsAuth">Auth header</Label>
        <Input
          id="lrsAuth"
          name="lrsAuth"
          defaultValue={initial?.lrsAuth ?? ""}
          placeholder="Basic dXNlcjpwYXNz"
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
