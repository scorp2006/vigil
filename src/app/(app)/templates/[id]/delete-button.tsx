"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteTemplate } from "@/app/actions/templates";
import { Trash2Icon } from "lucide-react";

export function DeleteTemplateButton({
  templateId,
  templateName,
  inUse,
}: {
  templateId: string;
  templateName: string;
  inUse: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (inUse) {
    return (
      <button
        type="button"
        disabled
        title="Template is used by one or more campaigns — detach or delete those first."
        className="pill-btn disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Trash2Icon className="h-3.5 w-3.5" /> Delete
      </button>
    );
  }

  const onDelete = () => {
    start(async () => {
      const res = await deleteTemplate(templateId);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(`Deleted "${templateName}".`);
      router.push("/templates");
    });
  };

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="pill-btn">
        <Trash2Icon className="h-3.5 w-3.5" /> Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-ink-2">Delete permanently?</span>
      <button type="button" onClick={() => setConfirming(false)} className="pill-btn">
        Cancel
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="pill-btn"
        style={{ borderColor: "var(--rose)", color: "var(--rose)" }}
      >
        {pending ? "Deleting…" : "Confirm"}
      </button>
    </div>
  );
}
