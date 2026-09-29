import Link from "next/link";
import type { Match, Team } from "@/types";
import { cn } from "@/lib/utils";
import { TeamBadge } from "@/components/team/TeamBadge";
import { MatchStatus } from "./MatchStatus";

function MobileTeamLine({
  team,
  score,
  showScore,
  live,
  emphasis,
}: {
  team: Team;
  score: number;
  showScore: boolean;
  live: boolean;
  emphasis: "bold" | "muted" | "normal";
}) {
  return (
    <div className="flex items-center gap-2">
      <TeamBadge team={team} size="xs" />
      <span className={cn("min-w-0 flex-1 truncate", emphasis === "bold" ? "font-bold text-fg" : emphasis === "muted" ? "text-fg-muted" : "font-semibold text-fg")}>
        {team.shortName}
      </span>
      {showScore && (
        <span className={cn("w-7 text-right font-extrabold tabular", live ? "text-accent" : emphasis === "muted" ? "text-fg-muted" : "text-fg")}>
          {score}
        </span>
      )}
    </div>
  );
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
    <Link href={`/match/${match.id}`} className="block px-3 py-2.5 text-sm transition-colors hover:bg-surface-2 sm:px-4">
      {/* Mobile : statut à gauche, équipes empilées */}
      <div className="flex items-center gap-3 sm:hidden">
        <div className="w-[4.25rem] shrink-0">
          <MatchStatus match={match} />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <MobileTeamLine team={homeTeam} score={match.homeScore} showScore={showScore} live={live} emphasis={homeEmphasis} />
          <MobileTeamLine team={awayTeam} score={match.awayScore} showScore={showScore} live={live} emphasis={awayEmphasis} />
        </div>
        <span aria-hidden="true" className="text-fg-subtle">
          ›
        </span>
      </div>

      {/* ≥ sm : une seule ligne domicile · score · extérieur */}
      <div className="hidden grid-cols-[4.25rem_minmax(0,1fr)_auto_minmax(0,1fr)_1rem] items-center gap-3 sm:grid">
        <MatchStatus match={match} />
        <span className={cn("flex min-w-0 items-center justify-end gap-2", homeEmphasis === "bold" ? "font-bold text-fg" : homeEmphasis === "muted" ? "text-fg-muted" : "font-semibold text-fg")}>
          <span className="truncate text-right">{homeTeam.shortName}</span>
          <TeamBadge team={homeTeam} size="sm" />
        </span>
        <span
          className={cn(
            "min-w-[3.75rem] rounded-md px-1.5 py-0.5 text-center text-sm font-extrabold tabular",
            live ? "bg-accent-soft text-accent" : showScore ? "bg-surface-3 text-fg" : "text-fg-subtle",
          )}
        >
          {showScore ? `${match.homeScore} – ${match.awayScore}` : "vs"}
        </span>
        <span className={cn("flex min-w-0 items-center gap-2", awayEmphasis === "bold" ? "font-bold text-fg" : awayEmphasis === "muted" ? "text-fg-muted" : "font-semibold text-fg")}>
          <TeamBadge team={awayTeam} size="sm" />
          <span className="truncate">{awayTeam.shortName}</span>
        </span>
        <span aria-hidden="true" className="text-fg-subtle">
          ›
        </span>
      </div>
    </Link>
  );
}
