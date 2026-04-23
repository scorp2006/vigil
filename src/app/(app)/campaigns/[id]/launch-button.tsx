"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { launchScheduledCampaign } from "@/app/actions/campaigns";
import { PlayIcon, Loader2Icon } from "lucide-react";

export function LaunchButton({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const onLaunch = () => {
    start(async () => {
      const res = await launchScheduledCampaign(campaignId);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(`Launched. Sent ${res.sent}, called ${res.called}${res.failed ? `, ${res.failed} failed` : ""}.`);
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={onLaunch}
      disabled={pending}
      className="pill-btn primary disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2Icon className="h-3.5 w-3.5 animate-spin" /> Launching…
        </>
      ) : (
        <>
          <PlayIcon className="h-3.5 w-3.5 fill-current" strokeWidth={0} /> Launch now
        </>
      )}
    </button>
  );
}
