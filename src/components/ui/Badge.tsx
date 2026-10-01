import type { HTMLAttributes } from "react";
import { cn } from "~/lib/utils";

type Tone = "accent" | "live" | "muted" | "win" | "info" | "outline";

const TONES: Record<Tone, string> = {
  accent: "bg-accent-soft text-accent",
  live: "bg-live/15 text-live",
  muted: "bg-surface-3 text-fg-muted",
  win: "bg-win/15 text-win",
  info: "bg-info/15 text-info",
  outline: "border border-border-strong text-fg-muted",
};

export function Badge({ tone = "muted", className, ...rest }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-chip px-2.5 py-1 text-xs font-semibold uppercase tracking-wide", TONES[tone], className)}
      {...rest}
    />
  );
}

export function LiveBadge({ label = "En direct" }: { label?: string }) {
  return (
    <Badge tone="live">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-live animate-live-pulse" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
      </span>
      {label}
    </Badge>
  );
}
