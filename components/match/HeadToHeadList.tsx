import Link from "next/link";
import type { Match, Team } from "@/types";
import { formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
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
    <section aria-labelledby="titre-h2h" className="rounded-md border border-border bg-surface">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <h3 id="titre-h2h" className="text-[11px] uppercase tracking-[0.08em] text-fg-muted">
          Confrontations directes
        </h3>
        {finished.length > 0 && (
          <span className="text-xs text-fg-muted tabular">
            <span className="text-fg">{homeTeam.abbreviation}</span> {winsOf(homeTeam.id)} – {winsOf(awayTeam.id)}{" "}
            <span className="text-fg">{awayTeam.abbreviation}</span>
          </span>
        )}
      </header>
      {list.length === 0 ? (
        <div className="p-4">
          <EmptyState title="Aucune confrontation cette saison">Ce match est le premier face-à-face de la saison entre les deux équipes.</EmptyState>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {list.map((m) => {
            const home = teams.get(m.homeTeamId);
            const away = teams.get(m.awayTeamId);
            if (!home || !away) return null;
            const played = m.status === "finished" || m.status === "live" || m.status === "halftime";
            const decided = m.status === "finished";
            const homeWon = decided && m.homeScore > m.awayScore;
            const awayWon = decided && m.awayScore > m.homeScore;
            const scoreClass = (won: boolean) => (decided && !won ? "text-fg-muted" : "text-fg");
            return (
              <li key={m.id}>
                <Link
                  href={`/match/${m.id}`}
                  className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-surface-2"
                >
                  <span className="text-xs text-fg-subtle first-letter:uppercase">{formatShortDate(m.date)}</span>
                  <span className={cn("truncate text-right", homeWon ? "font-semibold text-fg" : "text-fg-muted")}>{home.abbreviation}</span>
                  <span className="min-w-[3.5rem] text-center tabular">
                    {played ? (
                      <>
                        <span className={scoreClass(homeWon)}>{m.homeScore}</span>
                        <span className="text-fg-subtle"> – </span>
                        <span className={scoreClass(awayWon)}>{m.awayScore}</span>
                      </>
                    ) : (
                      <MatchStatus match={m} />
                    )}
                  </span>
                  <span className={cn("truncate", awayWon ? "font-semibold text-fg" : "text-fg-muted")}>{away.abbreviation}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
