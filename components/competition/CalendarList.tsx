import Link from "next/link";
import type { Match, Team } from "@/types";
import { formatDayLabel, formatLongDate } from "@/lib/format";
import { matchDay } from "@/lib/time";
import { groupBy } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { MatchRow } from "@/components/match/MatchRow";

/**
 * Matchs regroupés par journée sportive, dans l'ordre fourni
 * (croissant pour le calendrier, décroissant pour les résultats).
 */
export function CalendarList({
  matches,
  teams,
  emptyTitle,
  emptyText,
  maxDays,
  moreHref,
}: {
  matches: Match[];
  teams: Map<string, Team>;
  emptyTitle: string;
  emptyText?: string;
  /** Nombre maximal de journées affichées ; au-delà, lien `moreHref`. */
  maxDays?: number;
  moreHref?: string;
}) {
  if (matches.length === 0) return <EmptyState title={emptyTitle}>{emptyText}</EmptyState>;

  const days = [...groupBy(matches, (m) => matchDay(m.date))];
  const visible = maxDays ? days.slice(0, maxDays) : days;
  const hidden = days.length - visible.length;

  return (
    <div className="space-y-4">
      {visible.map(([day, dayMatches]) => {
        const label = formatDayLabel(day);
        const longDate = formatLongDate(`${day}T12:00:00Z`);
        // « Aujourd'hui », « Hier », « Demain » : on précise la date complète en second
        const relative = !/\d/.test(label);
        const rounds = [...new Set(dayMatches.map((m) => m.round))];
        const details = [relative ? longDate : null, rounds.length <= 2 ? rounds.join(" · ") : null].filter(Boolean).join(" · ");
        return (
          <section key={day} aria-labelledby={`jour-${day}`} className="overflow-hidden rounded-md border border-border bg-surface">
            <header className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 sm:px-4">
              <h3 id={`jour-${day}`} className="flex min-w-0 items-baseline gap-2">
                <span className="shrink-0 font-display text-lg font-bold uppercase leading-none">{relative ? label : longDate}</span>
                {details && <span className="truncate text-xs text-fg-subtle">{details}</span>}
              </h3>
              <span className="shrink-0 text-xs text-fg-subtle tabular">
                {dayMatches.length} match{dayMatches.length > 1 ? "s" : ""}
              </span>
            </header>
            <div className="divide-y divide-border">
              {dayMatches.map((match) => {
                const home = teams.get(match.homeTeamId);
                const away = teams.get(match.awayTeamId);
                if (!home || !away) return null;
                return <MatchRow key={match.id} match={match} homeTeam={home} awayTeam={away} />;
              })}
            </div>
          </section>
        );
      })}
      {hidden > 0 && moreHref && (
        <div className="text-center">
          <Link href={moreHref} className="inline-flex h-10 items-center text-sm font-semibold text-fg-muted transition-colors hover:text-fg">
            Afficher {hidden} journée{hidden > 1 ? "s" : ""} de plus
          </Link>
        </div>
      )}
    </div>
  );
}
