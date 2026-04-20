"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyIcon, TrashIcon, PlusIcon } from "lucide-react";
import { createApiKey, deleteApiKey } from "@/app/actions/lms";

type Key = { id: string; name: string; createdAt: Date | string; lastUsed: Date | string | null };

export function ApiKeyPanel({ keys }: { keys: Key[] }) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [pending, start] = useTransition();

  const onCreate = () => {
    start(async () => {
      const res = await createApiKey(name || "LMS key");
      setRevealed(res.key);
      setName("");
      toast.success("Key created. Copy it now — we only show it once.");
    });
  };

  const onDelete = (id: string) => {
    start(async () => {
      await deleteApiKey(id);
      toast.success("Key deleted");
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Key name (e.g., Moodle prod)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button onClick={onCreate} disabled={pending} className="gap-1.5">
          <PlusIcon className="h-4 w-4" /> Create
        </Button>
      </div>

      {revealed ? (
        <div className="rounded-lg border border-primary/40 bg-primary/10 p-3">
          <p className="mb-1 text-xs font-medium">Your new key — copy it now:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded bg-background px-2 py-1 font-mono text-xs">
              {revealed}
            </code>
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(revealed);
                toast.success("Copied");
              }}
            >
              <CopyIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        {keys.map((k) => (
          <div key={k.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
            <div>
              <p className="font-medium">{k.name}</p>
              <p className="text-xs text-muted-foreground">
                Created {new Date(k.createdAt).toISOString().slice(0, 10)} ·{" "}
                {k.lastUsed ? `last used ${new Date(k.lastUsed).toISOString().slice(0, 10)}` : "never used"}
              </p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => onDelete(k.id)} disabled={pending}>
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {keys.length === 0 && !revealed ? (
          <p className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            No API keys yet. Create one to let your LMS call the Prescription API.
          </p>
        ) : null}
      </div>
    </div>
  );
}
