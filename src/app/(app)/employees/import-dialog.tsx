"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UploadIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { importEmployeesCsv } from "@/app/actions/employees";

const SAMPLE = `name,email,phone,department
Priya Shah,priya@acme.test,+91 98765 00001,Finance
Rohan Mehta,rohan@acme.test,+91 98765 00002,Engineering
Ananya Rao,ananya@acme.test,+91 98765 00003,HR`;

export function ImportDialog() {
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState(SAMPLE);
  const [pending, start] = useTransition();

  const onSubmit = () => {
    const fd = new FormData();
    fd.set("csv", csv);
    start(async () => {
      const res = await importEmployeesCsv(fd);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(`${res.created} added · ${res.updated} updated`);
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-2"><UploadIcon className="h-4 w-4" /> Import CSV</Button>} />
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import employees</DialogTitle>
          <DialogDescription>
            Paste CSV with columns: <code className="rounded bg-muted px-1 text-xs">name</code>,{" "}
            <code className="rounded bg-muted px-1 text-xs">email</code>,{" "}
            <code className="rounded bg-muted px-1 text-xs">phone</code>,{" "}
            <code className="rounded bg-muted px-1 text-xs">department</code>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="csv">CSV</Label>
          <Textarea
            id="csv"
            rows={12}
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            className="font-mono text-xs"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={onSubmit} disabled={pending}>
            {pending ? "Importing…" : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
