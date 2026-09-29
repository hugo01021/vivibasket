import Link from "next/link";
import type { Competition, Match } from "@/types";
import { api } from "@/lib/api";
import { formatDayLabel, formatLongDate } from "@/lib/format";
import { addDays, currentMatchDay, isValidDay } from "@/lib/time";
import { groupBy } from "@/lib/utils";
import { CompetitionFilter } from "@/components/competition/CompetitionFilter";
import { MatchCard } from "@/components/match/MatchCard";
import { MatchGroup } from "@/components/match/MatchGroup";
import { EmptyState } from "@/components/ui/EmptyState";
import { LiveDot } from "@/components/ui/LiveDot";
import { SectionTitle } from "@/components/ui/SectionTitle";

type SearchParams = Promise<{ competition?: string; jour?: string }>;

function matchesFilter(match: Match, competitions: Map<string, Competition>, filter?: string): boolean {
  if (!filter) return true;
  const competition = competitions.get(match.competitionId);
  if (!competition) return false;
  if (filter === "autres") return competition.category === "other";
  return competition.slug === filter;
}

function buildHref(day: string, today: string, competition?: string): string {
  const params = new URLSearchParams();
  if (competition) params.set("competition", competition);
  if (day !== today) params.set("jour", day);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const { competition: filter, jour } = await searchParams;
  const today = currentMatchDay();
  const day = jour && isValidDay(jour) ? jour : today;
  const isToday = day === today;

  const [competitions, teams, live, dayMatches] = await Promise.all([
    api.getCompetitions(),
    api.getTeams(),
    api.getLiveMatches(),
    api.getMatchesForDay(day),
  ]);
  const competitionMap = new Map(competitions.map((c) => [c.id, c]));
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  const navOrder = (competitionId: string) => competitionMap.get(competitionId)?.navOrder ?? 99;
  // Cartes en direct : une seule grille, regroupée par compétition via l'ordre d'affichage
  const liveVisible = live
    .filter((m) => matchesFilter(m, competitionMap, filter))
    .sort((a, b) => navOrder(a.competitionId) - navOrder(b.competitionId) || a.date.localeCompare(b.date));
  const dayVisible = dayMatches.filter((m) => matchesFilter(m, competitionMap, filter));
  const dayGroups = [...groupBy(dayVisible, (m) => m.competitionId)].sort(([a], [b]) => navOrder(a) - navOrder(b));

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Matchs</h1>
            <p className="text-sm text-fg-muted">
              {live.length > 0 ? (
                <>
                  <span className="font-semibold text-live">{live.length} match{live.length > 1 ? "s" : ""} en direct</span> ·{" "}
                </>
              ) : null}
              {formatLongDate(`${day}T12:00:00Z`)}
            </p>
          </div>
          <nav aria-label="Changer de journée" className="flex items-center gap-1 text-sm">
            <Link href={buildHref(addDays(day, -1), today, filter)} className="rounded-full border border-border px-3 py-1.5 font-semibold text-fg-muted hover:text-fg" aria-label="Journée précédente">
              ‹ {formatDayLabel(addDays(day, -1))}
            </Link>
            {!isToday && (
              <Link href={buildHref(today, today, filter)} className="rounded-full bg-accent-soft px-3 py-1.5 font-semibold text-accent">
                Aujourd’hui
              </Link>
            )}
            <Link href={buildHref(addDays(day, 1), today, filter)} className="rounded-full border border-border px-3 py-1.5 font-semibold text-fg-muted hover:text-fg" aria-label="Journée suivante">
              {formatDayLabel(addDays(day, 1))} ›
            </Link>
          </nav>
        </div>
        <CompetitionFilter competitions={competitions} active={filter} buildHref={(value) => buildHref(day, today, value)} />
      </div>

      {isToday && (
        <section aria-labelledby="titre-direct">
          <SectionTitle count={liveVisible.length}>
            <span id="titre-direct" className="flex items-center gap-2">
              <LiveDot /> En direct
            </span>
          </SectionTitle>
          {liveVisible.length === 0 ? (
            <EmptyState title="Aucun match en direct pour le moment">
              Les matchs du jour apparaissent ci-dessous avec leur heure de coup d’envoi.
            </EmptyState>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {liveVisible.map((match) => {
                const competition = competitionMap.get(match.competitionId);
                const home = teamMap.get(match.homeTeamId);
                const away = teamMap.get(match.awayTeamId);
                if (!competition || !home || !away) return null;
                return <MatchCard key={match.id} match={match} competition={competition} homeTeam={home} awayTeam={away} />;
              })}
            </div>
          )}
        </section>
      )}

      <section aria-labelledby="titre-jour">
        <SectionTitle count={dayVisible.length}>
          <span id="titre-jour">{isToday ? "Matchs du jour" : `Matchs · ${formatDayLabel(day)}`}</span>
        </SectionTitle>
        {dayGroups.length === 0 ? (
          <EmptyState title="Aucun match ce jour">Essayez une autre journée ou retirez le filtre de compétition.</EmptyState>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {dayGroups.map(([competitionId, matches]) => {
              const competition = competitionMap.get(competitionId)!;
              return <MatchGroup key={competitionId} competition={competition} matches={matches} teams={teamMap} subtitle={matches[0]?.round} />;
            })}
          </div>
        )}
      </section>
    </div>
  );
}
