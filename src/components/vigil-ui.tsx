import type { CSSProperties, ReactNode } from "react";

/**
 * TrackerCard — the flagship green-gradient panel with soft radial glows.
 * Used for "branded moments" (Integration Status, Ethical Principles, sidebar promo).
 * Renders a `.panel` with gradient bg + pointer-events-none overlay for the glows.
 * Children are already positioned above the glow layer.
 */
export function TrackerCard({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  const style: CSSProperties = {
    background: "linear-gradient(135deg,#0a3d24 0%,#0a6034 60%,#0d7a3d 100%)",
  };
  return (
    <div
      className={`panel relative overflow-hidden text-white ${padded ? "p-6" : ""} ${className}`}
      style={style}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 75% 80%, rgba(255,255,255,0.25), transparent 50%), radial-gradient(ellipse at 20% 20%, rgba(12,121,64,0.4), transparent 50%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

/**
 * BandPill — shared risk-band badge used by dashboard, employees, risk.
 * Tone maps: critical = rose, high = amber, medium/low = green.
 * Pass optional score to show "<score> · <band>"; omit for band-only.
 */
const BAND_TONE: Record<string, string> = {
  critical: "bg-rose-soft text-rose",
  high: "bg-amber-soft text-amber",
  medium: "bg-green-pill text-green",
  low: "bg-green-pill text-green",
};

export function BandPill({
  band,
  score,
  capitalize = true,
}: {
  band: string;
  score?: number;
  capitalize?: boolean;
}) {
  const cls = BAND_TONE[band] ?? BAND_TONE.low;
  return (
    <span
      className={`inline-flex whitespace-nowrap items-center rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${
        capitalize ? "capitalize" : ""
      } ${cls}`}
    >
      {score != null ? `${score} · ${band}` : band}
    </span>
  );
}
