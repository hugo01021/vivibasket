import type { Metadata } from "next";
import Link from "next/link";
import type { TeamSeasonStats } from "@/types";
import { formatNumber, formatPct, formatSigned } from "@/lib/format";
import { cn } from "@/lib/utils";
import { RatingsScatter, type RatingPoint } from "@/components/analysis/RatingsScatter";
import { TeamBadge } from "@/components/team/TeamBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AnalysisPageHeader } from "../_components/AnalysisPageHeader";
import { CompetitionChips } from "@/components/competition/CompetitionChips";
import { analysisHref, loadCompetitionTeamStats } from "../_lib/data";

export const metadata: Metadata = {
  title: "Stats avancées",
  description: "Ratings offensif et défensif, net rating, pace, eFG% et TS% des équipes, par compétition.",
};

type SearchParams = Promise<{ competition?: string | string[]; tri?: string | string[] }>;

type SortKey = "ortg" | "drtg" | "net" | "pace" | "efg" | "ts";

const COLUMNS: Array<{
  key: SortKey;
  label: string;
  title: string;
  /** Ordre du tri : la meilleure valeur en premier (DRTG : la plus basse). */
  direction: "asc" | "desc";
  value: (s: TeamSeasonStats) => number;
  format: (v: number) => string;
}> = [
  { key: "ortg", label: "ORTG", title: "Points marqués pour 100 possessions", direction: "desc", value: (s) => s.offensiveRating, format: (v) => formatNumber(v) },
  { key: "drtg", label: "DRTG", title: "Points encaissés pour 100 possessions (plus bas = meilleur)", direction: "asc", value: (s) => s.defensiveRating, format: (v) => formatNumber(v) },
  { key: "net", label: "NET", title: "Net rating : ORTG − DRTG", direction: "desc", value: (s) => s.netRating, format: (v) => formatSigned(v) },
  { key: "pace", label: "PACE", title: "Possessions par match", direction: "desc", value: (s) => s.pace, format: (v) => formatNumber(v) },
  { key: "efg", label: "eFG%", title: "Adresse effective (un tir à 3 pts vaut 1,5 tir)", direction: "desc", value: (s) => s.effectiveFieldGoalPct, format: (v) => formatPct(v) },
  { key: "ts", label: "TS%", title: "True shooting (tirs + lancers francs)", direction: "desc", value: (s) => s.trueShootingPct, format: (v) => formatPct(v) },
];

function isSortKey(value: string | undefined): value is SortKey {
  return COLUMNS.some((c) => c.key === value);
}

export default async function AdvancedStatsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const slug = Array.isArray(params.competition) ? params.competition[0] : params.competition;
  const rawSort = Array.isArray(params.tri) ? params.tri[0] : params.tri;
  const sortKey: SortKey = isSortKey(rawSort) ? rawSort : "net";
  const sortColumn = COLUMNS.find((c) => c.key === sortKey)!;

  const { competition, stats, teams, options } = await loadCompetitionTeamStats(slug);
  const sorted = [...stats].sort((a, b) => {
    const diff = sortColumn.value(a) - sortColumn.value(b);
    return sortColumn.direction === "asc" ? diff : -diff;
  });
  const points: RatingPoint[] = stats.flatMap((s) => {
    const team = teams.get(s.teamId);
    return team
      ? [{ teamId: team.id, name: team.name, abbreviation: team.abbreviation, ortg: s.offensiveRating, drtg: s.defensiveRating, net: s.netRating }]
      : [];
  });
  const hrefFor = (competitionSlug: string, tri: SortKey) =>
    analysisHref("/analyses/stats-avancees", { competition: competitionSlug, tri: tri === "net" ? undefined : tri });

  return (
    <div className="space-y-6">
      <AnalysisPageHeader title="Stats avancées">
        Efficacité rapportée à 100 possessions pour comparer des équipes au rythme différent. Données de la saison en cours,
        calculées à partir des box scores.
      </AnalysisPageHeader>

      <CompetitionChips options={options} active={competition.slug} buildHref={(value) => hrefFor(value, sortKey)} />

      {stats.length === 0 ? (
        <EmptyState title={`${competition.name} : pas encore de match joué`}>
          Les stats avancées apparaîtront après les premières rencontres.
        </EmptyState>
      ) : (
        <>
          <section aria-labelledby="titre-nuage">
            <SectionTitle>
              <span id="titre-nuage">Attaque vs défense · {competition.name}</span>
            </SectionTitle>
            <RatingsScatter points={points} />
          </section>

          <section aria-labelledby="titre-tableau">
            <SectionTitle count={sorted.length}>
              <span id="titre-tableau">Tableau des équipes</span>
            </SectionTitle>
            <div className="overflow-x-auto rounded-md border border-border bg-surface">
              <table className="w-full min-w-[40rem] text-sm tabular">
                <caption className="sr-only">
                  Stats avancées des équipes de {competition.name}, triées par {sortColumn.label}
                </caption>
                <thead>
                  <tr className="border-b border-border text-[11px] uppercase tracking-[0.08em] text-fg-muted">
                    {/* Rang et équipe collants : restent lisibles pendant le défilement horizontal (mobile) */}
                    <th scope="col" className="sticky left-0 w-10 bg-surface px-2 py-2 text-right font-semibold">#</th>
                    <th scope="col" className="sticky left-10 bg-surface px-2 py-2 text-left font-semibold">Équipe</th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">
                      <abbr title="Matchs joués" className="no-underline">MJ</abbr>
                    </th>
                    {COLUMNS.map((c) => {
                      const active = c.key === sortKey;
                      return (
                        <th
                          key={c.key}
                          scope="col"
                          aria-sort={active ? (c.direction === "asc" ? "ascending" : "descending") : undefined}
                          className="px-2 py-2 text-right font-semibold last:pr-4"
                        >
                          <Link
                            href={hrefFor(competition.slug, c.key)}
                            title={`Trier par ${c.title}`}
                            scroll={false}
                            className={cn(
                              "inline-flex items-center gap-1 whitespace-nowrap transition-colors",
                              active ? "text-fg" : "hover:text-fg",
                            )}
                          >
                            {c.label}
                            <span aria-hidden="true" className={active ? "text-accent" : "opacity-0"}>
                              {c.direction === "asc" ? "↑" : "↓"}
                            </span>
                          </Link>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sorted.map((s, index) => {
                    const team = teams.get(s.teamId);
                    if (!team) return null;
                    return (
                      <tr key={s.teamId} className="transition-colors hover:bg-surface-2">
                        <td
                          className={cn(
                            "sticky left-0 bg-surface px-2 py-2 text-right text-xs tabular",
                            index < 3 ? "font-bold text-accent" : "text-fg-subtle",
                          )}
                        >
                          {index + 1}
                        </td>
                        <th scope="row" className="sticky left-10 bg-surface px-2 py-2 text-left font-semibold">
                          <Link
                            href={`/equipes/${team.id}`}
                            className="inline-flex items-center gap-2 whitespace-nowrap text-fg transition-colors hover:text-accent"
                          >
                            <TeamBadge team={team} size="sm" />
                            <span className="hidden sm:inline">{team.name}</span>
                            <span className="sm:hidden">{team.shortName}</span>
                          </Link>
                        </th>
                        <td className="px-2 py-2 text-right text-fg-muted">{s.gamesPlayed}</td>
                        {COLUMNS.map((c) => (
                          <td
                            key={c.key}
                            className={cn(
                              "px-2 py-2 text-right whitespace-nowrap last:pr-4",
                              c.key === sortKey ? "font-semibold text-fg" : "text-fg-muted",
                            )}
                          >
                            {c.format(c.value(s))}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-fg-muted">
              Cliquez sur un en-tête de colonne pour trier. DRTG : plus la valeur est basse, meilleure est la défense.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
