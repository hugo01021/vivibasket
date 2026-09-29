import { featuredAnalyses } from "@/data/analyses";
import { competitionById, competitionBySlug, competitions } from "@/data/competitions";
import { buildAnalysis } from "@/data/generated/analysis";
import { getDataset, statsKey } from "@/data/generated/dataset";
import { buildPlayByPlay } from "@/data/generated/playbyplay";
import { Rng } from "@/data/generated/rng";
import type { PlayerSeed } from "@/data/players";
import { teamById, teamStrength, teams } from "@/data/teams";
import { normalizeForSearch } from "@/lib/utils";
import { matchDay } from "@/lib/time";
import type {
  Competition,
  CompetitionSlug,
  DayString,
  ID,
  Match,
  MatchAnalysis,
  MatchDetails,
  MatchStatus,
  Player,
  PlayerGameLog,
  PlayerSeasonStats,
  SearchResult,
  StandingRow,
  Team,
  TeamSeasonStats,
} from "@/types";
import type { BasketDataProvider, LeaderStat, MatchFilter, PlayerFilter, PlayerLeader, TeamFilter } from "../provider";

function toPlayer(seed: PlayerSeed): Player {
  const { profile: _profile, ...player } = seed;
  return player;
}

function matchesStatus(match: Match, status: MatchStatus | MatchStatus[] | undefined): boolean {
  if (!status) return true;
  const list = Array.isArray(status) ? status : [status];
  return list.includes(match.status);
}

function applyMatchFilter(matches: Match[], filter: MatchFilter = {}): Match[] {
  let result = matches;
  if (filter.competitionId) result = result.filter((m) => m.competitionId === filter.competitionId);
  if (filter.teamId) result = result.filter((m) => m.homeTeamId === filter.teamId || m.awayTeamId === filter.teamId);
  if (filter.status) result = result.filter((m) => matchesStatus(m, filter.status));
  if (filter.day) result = result.filter((m) => matchDay(m.date) === filter.day);
  if (filter.from) result = result.filter((m) => matchDay(m.date) >= filter.from!);
  if (filter.to) result = result.filter((m) => matchDay(m.date) <= filter.to!);
  result = [...result].sort((a, b) =>
    filter.order === "desc" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date),
  );
  if (filter.limit) result = result.slice(0, filter.limit);
  return result;
}

function scoreMatch(haystack: string[], needle: string): number {
  let best = 0;
  for (const raw of haystack) {
    const value = normalizeForSearch(raw);
    if (value === needle) best = Math.max(best, 100);
    else if (value.startsWith(needle)) best = Math.max(best, 80);
    else if (value.split(/\s+/).some((word) => word.startsWith(needle))) best = Math.max(best, 60);
    else if (value.includes(needle)) best = Math.max(best, 40);
  }
  return best;
}

const LIVE_STATUSES: MatchStatus[] = ["live", "halftime"];

export class MockBasketProvider implements BasketDataProvider {
  async getCompetitions(): Promise<Competition[]> {
    return [...competitions].sort((a, b) => a.navOrder - b.navOrder);
  }

  async getCompetition(slugOrId: string): Promise<Competition | null> {
    return competitionBySlug.get(slugOrId as CompetitionSlug) ?? competitionById.get(slugOrId) ?? null;
  }

  async getStandings(competitionId: ID): Promise<StandingRow[]> {
    return getDataset().standings.get(competitionId) ?? [];
  }

  async getCompetitionTeamStats(competitionId: ID): Promise<TeamSeasonStats[]> {
    const dataset = getDataset();
    return [...dataset.teamSeasonStats.values()].filter((s) => s.competitionId === competitionId);
  }

  async getMatches(filter?: MatchFilter): Promise<Match[]> {
    return applyMatchFilter(getDataset().matches, filter);
  }

  async getLiveMatches(): Promise<Match[]> {
    return applyMatchFilter(getDataset().matches, { status: LIVE_STATUSES });
  }

  async getMatchesForDay(day: DayString): Promise<Match[]> {
    const dataset = getDataset();
    const ids = dataset.matchIdsByDay.get(day) ?? [];
    return applyMatchFilter(ids.map((id) => dataset.matchById.get(id)!), {});
  }

  async getMatch(id: ID): Promise<MatchDetails | null> {
    const dataset = getDataset();
    const match = dataset.matchById.get(id);
    if (!match) return null;
    const competition = competitionById.get(match.competitionId);
    const homeTeam = teamById.get(match.homeTeamId);
    const awayTeam = teamById.get(match.awayTeamId);
    if (!competition || !homeTeam || !awayTeam) return null;

    const bundle = dataset.stats.get(id);
    const boxScore = bundle?.boxScore ?? { home: [], away: [] };
    const playByPlay = bundle
      ? buildPlayByPlay(
          match,
          competition,
          { team: homeTeam, box: boxScore.home, players: dataset.playerById },
          { team: awayTeam, box: boxScore.away, players: dataset.playerById },
          new Rng(`pbp:${id}:${match.homeScore}:${match.awayScore}:${match.clock?.timeRemaining ?? "final"}`),
        )
      : [];
    const analysis = await this.getMatchAnalysis(id);
    const headToHead = applyMatchFilter(
      dataset.matches.filter(
        (m) =>
          m.id !== id &&
          m.status === "finished" &&
          ((m.homeTeamId === match.homeTeamId && m.awayTeamId === match.awayTeamId) ||
            (m.homeTeamId === match.awayTeamId && m.awayTeamId === match.homeTeamId)),
      ),
      { order: "desc", limit: 5 },
    );

    return {
      match,
      competition,
      homeTeam,
      awayTeam,
      teamStats: bundle?.teamStats ?? null,
      advanced: bundle?.advanced ?? null,
      boxScore,
      playByPlay,
      analysis: analysis!,
      headToHead,
    };
  }

  async getMatchAnalysis(id: ID): Promise<MatchAnalysis | null> {
    const dataset = getDataset();
    const match = dataset.matchById.get(id);
    if (!match) return null;
    const competition = competitionById.get(match.competitionId);
    const homeTeam = teamById.get(match.homeTeamId);
    const awayTeam = teamById.get(match.awayTeamId);
    if (!competition || !homeTeam || !awayTeam) return null;
    const bundle = dataset.stats.get(id);
    const players = new Map<ID, PlayerSeed>();
    for (const p of dataset.rosterByTeam.get(homeTeam.id) ?? []) players.set(p.id, p);
    for (const p of dataset.rosterByTeam.get(awayTeam.id) ?? []) players.set(p.id, p);
    return buildAnalysis(
      {
        match,
        competition,
        homeTeam,
        awayTeam,
        homeStrength: teamStrength[homeTeam.id] ?? 65,
        awayStrength: teamStrength[awayTeam.id] ?? 65,
        homeSeason: dataset.teamSeasonStats.get(statsKey(homeTeam.id, competition.id)),
        awaySeason: dataset.teamSeasonStats.get(statsKey(awayTeam.id, competition.id)),
        teamStats: bundle?.teamStats,
        advanced: bundle?.advanced,
        boxScore: bundle?.boxScore,
        players,
      },
      featuredAnalyses[id],
    );
  }

  async getTeams(filter: TeamFilter = {}): Promise<Team[]> {
    let result = teams;
    if (filter.competitionId) result = result.filter((t) => t.competitionIds.includes(filter.competitionId!));
    if (filter.kind) result = result.filter((t) => t.kind === filter.kind);
    if (filter.query) {
      const needle = normalizeForSearch(filter.query);
      result = result.filter((t) => scoreMatch([t.name, t.shortName, t.city, t.abbreviation], needle) > 0);
    }
    return [...result].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }

  async getTeam(id: ID): Promise<Team | null> {
    return teamById.get(id) ?? null;
  }

  async getTeamSeasonStats(teamId: ID): Promise<TeamSeasonStats[]> {
    const dataset = getDataset();
    const team = teamById.get(teamId);
    if (!team) return [];
    return team.competitionIds
      .map((competitionId) => dataset.teamSeasonStats.get(statsKey(teamId, competitionId)))
      .filter((s): s is TeamSeasonStats => Boolean(s));
  }

  async getTeamRoster(teamId: ID): Promise<Player[]> {
    return (getDataset().rosterByTeam.get(teamId) ?? []).map(toPlayer);
  }

  async getTeamMatches(teamId: ID, options: Omit<MatchFilter, "teamId"> = {}): Promise<Match[]> {
    const dataset = getDataset();
    const ids = dataset.matchIdsByTeam.get(teamId) ?? [];
    return applyMatchFilter(ids.map((id) => dataset.matchById.get(id)!), { ...options, teamId });
  }

  async getPlayers(filter: PlayerFilter = {}): Promise<Player[]> {
    const dataset = getDataset();
    let result = dataset.players;
    if (filter.teamId) result = dataset.rosterByTeam.get(filter.teamId) ?? [];
    if (filter.competitionId) {
      const teamIds = new Set(teams.filter((t) => t.competitionIds.includes(filter.competitionId!)).map((t) => t.id));
      result = result.filter((p) => teamIds.has(p.teamId));
    }
    if (filter.nationality) result = result.filter((p) => p.nationality === filter.nationality);
    if (filter.query) {
      const needle = normalizeForSearch(filter.query);
      result = result
        .map((p) => ({ p, score: scoreMatch([`${p.firstName} ${p.lastName}`, p.lastName], needle) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((x) => x.p);
    } else {
      result = [...result].sort((a, b) => b.profile.ppg - a.profile.ppg);
    }
    if (filter.limit) result = result.slice(0, filter.limit);
    return result.map(toPlayer);
  }

  async getPlayer(id: ID): Promise<Player | null> {
    const seed = getDataset().playerById.get(id);
    return seed ? toPlayer(seed) : null;
  }

  async getPlayerSeasonStats(playerId: ID): Promise<PlayerSeasonStats[]> {
    const dataset = getDataset();
    return [...dataset.playerSeasonStats.values()]
      .filter((s) => s.playerId === playerId)
      .sort((a, b) => b.gamesPlayed - a.gamesPlayed);
  }

  async getPlayerGameLogs(playerId: ID, limit = 10): Promise<PlayerGameLog[]> {
    return (getDataset().playerGameLogs.get(playerId) ?? []).slice(0, limit);
  }

  async getLeaders(options: { competitionId?: ID; stat: LeaderStat; limit?: number }): Promise<PlayerLeader[]> {
    const dataset = getDataset();
    const minGames = 3;
    const candidates = [...dataset.playerSeasonStats.values()].filter(
      (s) =>
        (!options.competitionId || s.competitionId === options.competitionId) &&
        s.gamesPlayed >= minGames &&
        (options.stat !== "threePointPct" || s.threePointAttemptsPerGame >= 3),
    );
    candidates.sort((a, b) => b[options.stat] - a[options.stat]);
    return candidates.slice(0, options.limit ?? 10).flatMap((stats) => {
      const seed = dataset.playerById.get(stats.playerId);
      const team = teamById.get(stats.teamId);
      return seed && team ? [{ player: toPlayer(seed), team, stats }] : [];
    });
  }

  async search(query: string, limit = 12): Promise<SearchResult[]> {
    const needle = normalizeForSearch(query);
    if (needle.length < 2) return [];
    const dataset = getDataset();
    const results: Array<SearchResult & { score: number }> = [];

    for (const c of competitions) {
      const score = scoreMatch([c.name, c.fullName, c.region], needle);
      if (score > 0) results.push({ type: "competition", id: c.id, label: c.name, sublabel: c.region, href: `/competitions/${c.slug}`, score: score + 10 });
    }
    for (const t of teams) {
      const score = scoreMatch([t.name, t.shortName, t.city, t.abbreviation], needle);
      if (score > 0) {
        const comps = t.competitionIds.map((id) => competitionById.get(id)?.name).filter(Boolean).join(" · ");
        results.push({ type: "team", id: t.id, label: t.name, sublabel: comps, href: `/equipes/${t.id}`, score: score + 5 });
      }
    }
    for (const p of dataset.players) {
      const score = scoreMatch([`${p.firstName} ${p.lastName}`, p.lastName], needle);
      if (score > 0) {
        const team = teamById.get(p.teamId);
        results.push({
          type: "player",
          id: p.id,
          label: `${p.firstName} ${p.lastName}`,
          sublabel: `${team?.name ?? ""} · ${p.position}`,
          href: `/joueurs/${p.id}`,
          score: score + (p.isFeatured ? 3 : 0),
        });
      }
    }
    return results
      .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label, "fr"))
      .slice(0, limit)
      .map(({ score: _score, ...r }) => r);
  }
}

export const mockProvider = new MockBasketProvider();
