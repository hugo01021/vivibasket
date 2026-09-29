import Link from "next/link";
import type { Match, Team } from "@/types";
import { formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { TeamBadge } from "@/components/team/TeamBadge";
import { MatchStatus } from "./MatchStatus";

/** Confrontations directes récentes entre les deux équipes, avec le bilan. */
export function HeadToHeadList({
  matches,
  homeTeam,
  awayTeam,
  currentMatchId,
}: {
  matches: Match[];
  homeTeam: Team;
  awayTeam: Team;
  currentMatchId: string;
}) {
  const teams = new Map([
    [homeTeam.id, homeTeam],
    [awayTeam.id, awayTeam],
  ]);
  const list = matches.filter((m) => m.id !== currentMatchId).sort((a, b) => b.date.localeCompare(a.date));
  const finished = list.filter((m) => m.status === "finished");
  const winsOf = (teamId: string) =>
    finished.filter((m) => (m.homeScore > m.awayScore ? m.homeTeamId : m.awayTeamId) === teamId).length;

  return (
    <section aria-labelledby="titre-h2h" className="rounded-card border border-border bg-surface p-4 shadow-card">
      <header className="mb-3 flex items-center justify-between gap-3">
        <h3 id="titre-h2h" className="text-xs font-bold uppercase tracking-wide text-fg-subtle">
          Confrontations directes
        </h3>
        {finished.length > 0 && (
          <span className="text-xs font-semibold text-fg-muted tabular">
            {homeTeam.abbreviation} {winsOf(homeTeam.id)} – {winsOf(awayTeam.id)} {awayTeam.abbreviation}
          </span>
        )}
      </header>
      {list.length === 0 ? (
        <EmptyState title="Aucune confrontation cette saison">Ce match est le premier face-à-face de la saison entre les deux équipes.</EmptyState>
      ) : (
        <ul className="divide-y divide-border/60">
          {list.map((m) => {
            const home = teams.get(m.homeTeamId);
            const away = teams.get(m.awayTeamId);
            if (!home || !away) return null;
            const played = m.status === "finished" || m.status === "live" || m.status === "halftime";
            const homeWon = m.status === "finished" && m.homeScore > m.awayScore;
            const awayWon = m.status === "finished" && m.awayScore > m.homeScore;
            return (
              <li key={m.id}>
                <Link
                  href={`/match/${m.id}`}
                  className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 py-2 text-sm hover:text-accent"
                >
                  <span className="text-xs text-fg-subtle first-letter:uppercase">{formatShortDate(m.date)}</span>
                  <span className={cn("flex min-w-0 items-center justify-end gap-1.5", homeWon ? "font-bold" : "text-fg-muted")}>
                    <span className="truncate">{home.abbreviation}</span>
                    <TeamBadge team={home} size="xs" />
                  </span>
                  <span className="min-w-[3.5rem] rounded-md bg-surface-3 px-1.5 py-0.5 text-center text-xs font-extrabold tabular">
                    {played ? `${m.homeScore} – ${m.awayScore}` : <MatchStatus match={m} />}
                  </span>
                  <span className={cn("flex min-w-0 items-center gap-1.5", awayWon ? "font-bold" : "text-fg-muted")}>
                    <TeamBadge team={away} size="xs" />
                    <span className="truncate">{away.abbreviation}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
