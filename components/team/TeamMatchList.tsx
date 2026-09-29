import type { Competition, Match, Team } from "@/types";
import { formatShortDate } from "@/lib/format";
import { matchDay } from "@/lib/time";
import { cn } from "@/lib/utils";
import { MatchRow } from "@/components/match/MatchRow";

/** Matchs d'une équipe (toutes compétitions) : date, compétition, V/D éventuel, ligne de match. */
export function TeamMatchList({
  teamId,
  matches,
  teams,
  competitions,
}: {
  teamId: string;
  matches: Match[];
  teams: Map<string, Team>;
  competitions: Map<string, Competition>;
}) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface shadow-card">
      {matches.map((match) => {
        const home = teams.get(match.homeTeamId);
        const away = teams.get(match.awayTeamId);
        if (!home || !away) return null;
        const competition = competitions.get(match.competitionId);
        let result: "W" | "L" | null = null;
        if (match.status === "finished") {
          const isHome = match.homeTeamId === teamId;
          const own = isHome ? match.homeScore : match.awayScore;
          const other = isHome ? match.awayScore : match.homeScore;
          result = own > other ? "W" : "L";
        }
        return (
          <li key={match.id} className="flex items-stretch">
            {result && (
              <span className="flex w-9 shrink-0 items-center justify-center border-r border-border">
                <span
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-extrabold",
                    result === "W" ? "bg-win/15 text-win" : "bg-loss/15 text-loss",
                  )}
                  aria-label={result === "W" ? "Victoire" : "Défaite"}
                >
                  {result === "W" ? "V" : "D"}
                </span>
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="-mb-1.5 flex min-w-0 items-center gap-1.5 px-3 pt-2 text-[11px] text-fg-subtle sm:px-4">
                <span className="shrink-0 font-semibold text-fg-muted">{formatShortDate(`${matchDay(match.date)}T12:00:00Z`)}</span>
                {competition && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: competition.accentColor }} aria-hidden="true" />
                    <span className="truncate">
                      {competition.name} · {match.round}
                    </span>
                  </>
                )}
              </p>
              <MatchRow match={match} homeTeam={home} awayTeam={away} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
