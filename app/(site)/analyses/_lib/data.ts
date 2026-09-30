import type { Competition, Team, TeamSeasonStats } from "@/types";
import { api } from "@/lib/api";
import type { ChipOption } from "@/components/competition/CompetitionChips";

const DEFAULT_COMPETITION = "nba";

export interface CompetitionTeamStatsView {
  competitions: Competition[];
  competition: Competition;
  /** Stats des équipes ayant disputé au moins un match. */
  stats: TeamSeasonStats[];
  teams: Map<string, Team>;
  options: ChipOption[];
}

/**
 * Données communes aux pages d'analyse par compétition (`?competition=slug`).
 * Slug inconnu ou absent → NBA.
 */
export async function loadCompetitionTeamStats(slug: string | undefined): Promise<CompetitionTeamStatsView> {
  const [competitions, teams, requested] = await Promise.all([
    api.getCompetitions(),
    api.getTeams(),
    slug ? api.getCompetition(slug) : Promise.resolve(null),
  ]);
  const competition =
    requested ?? competitions.find((c) => c.slug === DEFAULT_COMPETITION) ?? competitions[0];
  const stats = (await api.getCompetitionTeamStats(competition.id)).filter((s) => s.gamesPlayed > 0);
  return {
    competitions,
    competition,
    stats,
    teams: new Map(teams.map((t) => [t.id, t])),
    options: competitions.map((c) => ({ value: c.slug, label: c.name, color: c.accentColor })),
  };
}

/** Construit l'URL d'une page d'analyse en conservant les paramètres utiles. */
export function analysisHref(pathname: string, params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}
