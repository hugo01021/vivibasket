import Link from "next/link";
import type { Match, Team } from "@/types";
import { cn } from "@/lib/utils";
import { MatchStatus } from "./MatchStatus";

function emphasisClass(emphasis: "bold" | "muted" | "normal"): string {
  return emphasis === "bold" ? "font-semibold text-fg" : emphasis === "muted" ? "text-fg-muted" : "text-fg/85";
}

/** Ligne compacte d'une liste de matchs : deux lignes sur mobile, une seule à partir de 640 px. */
export function MatchRow({ match, homeTeam, awayTeam }: { match: Match; homeTeam: Team; awayTeam: Team }) {
  const live = match.status === "live" || match.status === "halftime";
  const finished = match.status === "finished";
  const showScore = live || finished;
  const homeWon = finished && match.homeScore > match.awayScore;
  const awayWon = finished && match.awayScore > match.homeScore;
  const homeEmphasis = homeWon ? "bold" : awayWon ? "muted" : "normal";
  const awayEmphasis = awayWon ? "bold" : homeWon ? "muted" : "normal";

  return (
    <Link href={`/match/${match.id}`} className="block px-2 py-2.5 text-sm transition-colors hover:bg-white/[0.025] sm:px-3">
      {/* Mobile : statut à gauche, équipes empilées */}
      <div className="flex items-center gap-3 sm:hidden">
        <div className="w-[4.25rem] shrink-0">
          <MatchStatus match={match} />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          {[
            [homeTeam, match.homeScore, homeEmphasis],
            [awayTeam, match.awayScore, awayEmphasis],
          ].map(([team, score, emphasis]) => (
            <div key={(team as Team).id} className="flex items-center gap-2">
              <span className={cn("min-w-0 flex-1 truncate", emphasisClass(emphasis as "bold"))}>{(team as Team).shortName}</span>
              {showScore && (
                <span className={cn("w-7 text-right font-semibold tabular", live ? "text-accent" : emphasis === "muted" ? "text-fg-muted" : "text-fg")}>
                  {score as number}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ≥ sm : une seule ligne domicile · score · extérieur */}
      <div className="hidden grid-cols-[4.25rem_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:grid">
        <MatchStatus match={match} />
        <span className={cn("min-w-0 truncate text-right", emphasisClass(homeEmphasis))}>{homeTeam.shortName}</span>
        <span
          className={cn(
            "min-w-[3.75rem] text-center font-semibold tabular",
            live ? "text-accent" : showScore ? "text-fg" : "text-fg-subtle",
          )}
        >
          {showScore ? `${match.homeScore} – ${match.awayScore}` : "vs"}
        </span>
        <span className={cn("min-w-0 truncate", emphasisClass(awayEmphasis))}>{awayTeam.shortName}</span>
      </div>
    </Link>
  );
}
