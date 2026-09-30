import Link from "next/link";
import type { Match, Team } from "@/types";
import { cn } from "@/lib/utils";
import { MatchStatus } from "./MatchStatus";

function nameClass(emphasis: "bold" | "muted" | "normal"): string {
  return emphasis === "bold" ? "font-semibold text-fg" : emphasis === "muted" ? "text-fg-muted" : "text-fg/85";
}

/**
 * Ligne d'une liste de matchs, sur une seule ligne quelle que soit la largeur :
 * statut · [score] domicile – extérieur [score]. Les scores se placent de chaque côté des équipes.
 */
export function MatchRow({ match, homeTeam, awayTeam }: { match: Match; homeTeam: Team; awayTeam: Team }) {
  const live = match.status === "live" || match.status === "halftime";
  const finished = match.status === "finished";
  const showScore = live || finished;
  const homeWon = finished && match.homeScore > match.awayScore;
  const awayWon = finished && match.awayScore > match.homeScore;
  const homeEmphasis = homeWon ? "bold" : awayWon ? "muted" : "normal";
  const awayEmphasis = awayWon ? "bold" : homeWon ? "muted" : "normal";
  const scoreClass = (lost: boolean) =>
    cn("w-8 shrink-0 font-display text-lg font-bold leading-none tabular sm:w-9", live ? "text-accent" : lost ? "text-fg-muted" : "text-fg");

  return (
    <Link
      href={`/match/${match.id}`}
      className="grid grid-cols-[4.25rem_minmax(0,1fr)] items-center gap-3 px-2 py-2.5 text-[13px] transition-colors hover:bg-surface-2 sm:px-3 sm:text-sm"
    >
      <MatchStatus match={match} />
      <span className="flex items-center gap-2">
        {showScore && <span className={cn(scoreClass(awayWon), "text-left")}>{match.homeScore}</span>}
        <span className={cn("min-w-0 flex-1 truncate text-right", nameClass(homeEmphasis))}>{homeTeam.shortName}</span>
        <span aria-hidden="true" className="shrink-0 text-fg-subtle">
          –
        </span>
        <span className={cn("min-w-0 flex-1 truncate", nameClass(awayEmphasis))}>{awayTeam.shortName}</span>
        {showScore && <span className={cn(scoreClass(homeWon), "text-right")}>{match.awayScore}</span>}
      </span>
    </Link>
  );
}
