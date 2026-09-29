import type { Match } from "@/types";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { LiveDot } from "@/components/ui/LiveDot";

/** Heure, chrono ou état du match, sous forme compacte. */
export function MatchStatus({ match, className }: { match: Match; className?: string }) {
  if (match.status === "live" && match.clock) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold text-live tabular", className)}>
        <LiveDot />
        {match.clock.periodLabel} {match.clock.timeRemaining}
      </span>
    );
  }
  if (match.status === "halftime") {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold text-live", className)}>
        <LiveDot />
        Mi-temps
      </span>
    );
  }
  if (match.status === "finished") {
    return (
      <span className={cn("text-xs font-semibold text-fg-muted", className)}>
        Terminé{match.periods.length > 4 ? " (Prol.)" : ""}
      </span>
    );
  }
  if (match.status === "postponed" || match.status === "cancelled") {
    return <span className={cn("text-xs font-semibold text-fg-subtle", className)}>{match.status === "postponed" ? "Reporté" : "Annulé"}</span>;
  }
  return <span className={cn("text-xs font-semibold text-fg tabular", className)}>{formatTime(match.date)}</span>;
}
