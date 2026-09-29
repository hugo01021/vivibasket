import Link from "next/link";
import type { PlayByPlayEvent, PlayEventType, Team } from "@/types";
import { cn, groupBy } from "@/lib/utils";
import { TeamBadge } from "@/components/team/TeamBadge";
import { periodName } from "./periods";

const POINTS: Partial<Record<PlayEventType, number>> = {
  two_made: 2,
  three_made: 3,
  free_throw_made: 1,
};

const MARKERS = new Set<PlayEventType>(["period_start", "period_end", "jump_ball"]);

function EventRow({ event, team, homeTeamId }: { event: PlayByPlayEvent; team?: Team; homeTeamId: string }) {
  if (MARKERS.has(event.type)) {
    return (
      <li className="flex items-center gap-3 px-3 py-2 text-xs sm:px-4">
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
        <span className="font-semibold text-fg-subtle">
          {event.description}
          {event.type === "period_end" && (
            <span className="ml-2 text-fg-muted tabular">
              {event.homeScore}-{event.awayScore}
            </span>
          )}
        </span>
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
      </li>
    );
  }

  const points = event.isScoring ? POINTS[event.type] : undefined;
  const scoringSide = event.isScoring ? (event.teamId === homeTeamId ? "home" : "away") : null;
  const muted = event.type === "substitution" || event.type === "timeout";

  return (
    <li
      className={cn(
        "grid grid-cols-[2.75rem_1.25rem_minmax(0,1fr)_auto] items-center gap-2.5 px-3 py-2 text-sm sm:px-4",
        event.isScoring && "border-l-2 border-accent bg-accent-soft/40",
        !event.isScoring && "border-l-2 border-transparent",
      )}
    >
      <span className="text-xs text-fg-subtle tabular">{event.clock}</span>
      {team ? <TeamBadge team={team} size="xs" /> : <span aria-hidden="true" />}
      <span className={cn("min-w-0", event.isScoring ? "font-semibold text-fg" : muted ? "text-fg-subtle" : "text-fg-muted")}>
        {points && (
          <span className="mr-1.5 inline-flex rounded bg-accent px-1 text-[10px] font-extrabold text-accent-ink tabular">+{points}</span>
        )}
        {event.description}
      </span>
      <span className={cn("text-right text-xs tabular", event.isScoring ? "font-extrabold text-fg" : "text-fg-subtle")}>
        <span className={cn(scoringSide === "home" && "text-accent")}>{event.homeScore}</span>
        <span className="text-fg-subtle">-</span>
        <span className={cn(scoringSide === "away" && "text-accent")}>{event.awayScore}</span>
      </span>
    </li>
  );
}

/** Play-by-play regroupé par période, de l'action la plus récente à la plus ancienne. */
export function PlayByPlayList({
  events,
  homeTeam,
  awayTeam,
  scoringOnly = false,
  allHref,
  scoringHref,
}: {
  events: PlayByPlayEvent[];
  homeTeam: Team;
  awayTeam: Team;
  scoringOnly?: boolean;
  allHref: string;
  scoringHref: string;
}) {
  const teams = new Map([
    [homeTeam.id, homeTeam],
    [awayTeam.id, awayTeam],
  ]);
  const visible = (scoringOnly ? events.filter((e) => e.isScoring) : events).slice().sort((a, b) => b.sequence - a.sequence);
  const periods = [...groupBy(visible, (e) => String(e.period))].sort(([a], [b]) => Number(b) - Number(a));
  const scoringCount = events.filter((e) => e.isScoring).length;

  const filterClass = (active: boolean) =>
    cn(
      "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
      active ? "bg-accent-soft text-accent" : "border border-border text-fg-muted hover:text-fg",
    );

  return (
    <div className="space-y-4">
      <nav aria-label="Filtrer les actions" className="flex flex-wrap items-center gap-2">
        <Link href={allHref} scroll={false} className={filterClass(!scoringOnly)} aria-current={!scoringOnly ? "page" : undefined}>
          Toutes les actions <span className="tabular">({events.length})</span>
        </Link>
        <Link href={scoringHref} scroll={false} className={filterClass(scoringOnly)} aria-current={scoringOnly ? "page" : undefined}>
          Paniers uniquement <span className="tabular">({scoringCount})</span>
        </Link>
      </nav>

      {periods.map(([period, periodEvents]) => {
        const n = Number(period);
        const last = periodEvents[0];
        return (
          <section key={period} aria-labelledby={`pbp-${period}`} className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
            <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
              <h3 id={`pbp-${period}`} className="text-sm font-bold">
                {periodName(n)}
              </h3>
              {last && (
                <span className="text-xs text-fg-muted tabular">
                  {homeTeam.abbreviation} {last.homeScore} – {last.awayScore} {awayTeam.abbreviation}
                </span>
              )}
            </header>
            <ol className="divide-y divide-border/60">
              {periodEvents.map((event) => (
                <EventRow key={event.id} event={event} team={event.teamId ? teams.get(event.teamId) : undefined} homeTeamId={homeTeam.id} />
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
