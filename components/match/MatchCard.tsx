import Link from "next/link";
import type { Competition, Match, Team } from "@/types";
import { cn } from "@/lib/utils";
import { TeamBadge } from "@/components/team/TeamBadge";
import { MatchStatus } from "./MatchStatus";

function TeamLine({
  team,
  score,
  muted,
  showScore,
}: {
  team: Team;
  score: number;
  muted: boolean;
  showScore: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <TeamBadge team={team} size="md" />
      <span className={cn("min-w-0 flex-1 truncate text-[15px] font-semibold", muted ? "text-fg-muted" : "text-fg")}>
        {team.shortName}
      </span>
      {showScore && (
        <span className={cn("text-xl font-extrabold tabular", muted ? "text-fg-muted" : "text-fg")}>{score}</span>
      )}
    </div>
  );
}

/** Carte de match (utilisée pour le direct et les temps forts). */
export function MatchCard({
  match,
  competition,
  homeTeam,
  awayTeam,
}: {
  match: Match;
  competition: Competition;
  homeTeam: Team;
  awayTeam: Team;
}) {
  const live = match.status === "live" || match.status === "halftime";
  const finished = match.status === "finished";
  const showScore = live || finished;
  const homeLeads = match.homeScore > match.awayScore;
  const awayLeads = match.awayScore > match.homeScore;

  return (
    <Link
      href={`/match/${match.id}`}
      className={cn(
        "block rounded-card border bg-surface p-3.5 shadow-card transition-colors hover:bg-surface-2",
        live ? "border-accent/40 hover:border-accent/70" : "border-border hover:border-border-strong",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2 text-xs">
        <span className="flex min-w-0 items-center gap-1.5 text-fg-muted">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: competition.accentColor }} aria-hidden="true" />
          <span className="truncate">
            {competition.name} · {match.round}
          </span>
        </span>
        <MatchStatus match={match} />
      </div>
      <div className="space-y-2">
        <TeamLine team={homeTeam} score={match.homeScore} muted={showScore && awayLeads} showScore={showScore} />
        <TeamLine team={awayTeam} score={match.awayScore} muted={showScore && homeLeads} showScore={showScore} />
      </div>
      {live && match.periods.length > 0 && (
        <div className="mt-3 flex gap-1 border-t border-border pt-2 text-[11px] text-fg-subtle tabular">
          {match.periods.map((p) => (
            <span key={p.period} className="rounded bg-surface-3 px-1.5 py-0.5">
              {p.label} {p.home}-{p.away}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
