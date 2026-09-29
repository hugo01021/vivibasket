import type { Competition, Match, MatchAnalysis, Team } from "@/types";
import { api } from "@/lib/api";
import { currentMatchDay } from "@/lib/time";

export interface AnalyzedMatch {
  match: Match;
  analysis: MatchAnalysis;
  competition: Competition;
  homeTeam: Team;
  awayTeam: Team;
}

const STATUS_ORDER: Record<Match["status"], number> = {
  live: 0,
  halftime: 0,
  scheduled: 1,
  finished: 2,
  postponed: 3,
  cancelled: 3,
};

/**
 * Matchs à l'affiche : en direct + journée sportive du jour (sans doublon),
 * direct d'abord, puis à venir, puis terminés ; chaque groupe par ordre de compétition.
 */
export async function loadFeaturedAnalyses(limit?: number): Promise<AnalyzedMatch[]> {
  const [live, today, competitions, teams] = await Promise.all([
    api.getLiveMatches(),
    api.getMatchesForDay(currentMatchDay()),
    api.getCompetitions(),
    api.getTeams(),
  ]);
  const competitionMap = new Map(competitions.map((c) => [c.id, c]));
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const unique = new Map<string, Match>();
  for (const m of [...live, ...today]) {
    if (m.status !== "postponed" && m.status !== "cancelled") unique.set(m.id, m);
  }
  const navOrder = (m: Match) => competitionMap.get(m.competitionId)?.navOrder ?? 99;
  const ordered = [...unique.values()]
    .sort(
      (a, b) =>
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || navOrder(a) - navOrder(b) || a.date.localeCompare(b.date),
    )
    .slice(0, limit);

  const results = await Promise.all(
    ordered.map(async (match): Promise<AnalyzedMatch | null> => {
      const competition = competitionMap.get(match.competitionId);
      const homeTeam = teamMap.get(match.homeTeamId);
      const awayTeam = teamMap.get(match.awayTeamId);
      if (!competition || !homeTeam || !awayTeam) return null;
      const analysis = await api.getMatchAnalysis(match.id);
      return analysis ? { match, analysis, competition, homeTeam, awayTeam } : null;
    }),
  );
  return results.filter((r): r is AnalyzedMatch => r !== null);
}
