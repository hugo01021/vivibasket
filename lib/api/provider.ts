import type {
  Competition,
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
  TeamKind,
  TeamSeasonStats,
} from "@/types";

export interface MatchFilter {
  competitionId?: ID;
  teamId?: ID;
  status?: MatchStatus | MatchStatus[];
  /** Journée sportive "YYYY-MM-DD". */
  day?: DayString;
  from?: DayString;
  to?: DayString;
  order?: "asc" | "desc";
  limit?: number;
}

export interface TeamFilter {
  competitionId?: ID;
  kind?: TeamKind;
  query?: string;
}

export interface PlayerFilter {
  teamId?: ID;
  competitionId?: ID;
  nationality?: string;
  query?: string;
  limit?: number;
}

export type LeaderStat =
  | "pointsPerGame"
  | "reboundsPerGame"
  | "assistsPerGame"
  | "stealsPerGame"
  | "blocksPerGame"
  | "efficiency"
  | "threePointPct";

export interface PlayerLeader {
  player: Player;
  team: Team;
  stats: PlayerSeasonStats;
}

/**
 * Contrat d'accès aux données. L'app ne dépend que de cette interface :
 * le provider mock peut être remplacé par un client API-Sports / balldontlie
 * sans toucher aux pages.
 */
export interface BasketDataProvider {
  // Compétitions
  getCompetitions(): Promise<Competition[]>;
  getCompetition(slugOrId: string): Promise<Competition | null>;
  getStandings(competitionId: ID): Promise<StandingRow[]>;
  getCompetitionTeamStats(competitionId: ID): Promise<TeamSeasonStats[]>;

  // Matchs
  getMatches(filter?: MatchFilter): Promise<Match[]>;
  getLiveMatches(): Promise<Match[]>;
  getMatchesForDay(day: DayString): Promise<Match[]>;
  getMatch(id: ID): Promise<MatchDetails | null>;
  getMatchAnalysis(id: ID): Promise<MatchAnalysis | null>;

  // Équipes
  getTeams(filter?: TeamFilter): Promise<Team[]>;
  getTeam(id: ID): Promise<Team | null>;
  getTeamSeasonStats(teamId: ID): Promise<TeamSeasonStats[]>;
  getTeamRoster(teamId: ID): Promise<Player[]>;
  getTeamMatches(teamId: ID, options?: Omit<MatchFilter, "teamId">): Promise<Match[]>;

  // Joueurs
  getPlayers(filter?: PlayerFilter): Promise<Player[]>;
  getPlayer(id: ID): Promise<Player | null>;
  getPlayerSeasonStats(playerId: ID): Promise<PlayerSeasonStats[]>;
  getPlayerGameLogs(playerId: ID, limit?: number): Promise<PlayerGameLog[]>;
  getLeaders(options: { competitionId?: ID; stat: LeaderStat; limit?: number }): Promise<PlayerLeader[]>;

  // Recherche
  search(query: string, limit?: number): Promise<SearchResult[]>;
}
