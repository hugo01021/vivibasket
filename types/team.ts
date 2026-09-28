import type { FormResult, ID, Season, Streak, WinLoss } from "./common";

export type TeamKind = "club" | "national";

export interface TeamColors {
  primary: string;
  secondary: string;
}

export interface Team {
  id: ID;
  /** Nom complet : "Boston Celtics", "Real Madrid", "France". */
  name: string;
  /** Nom court : "Celtics", "Real", "France". */
  shortName: string;
  /** Trigramme : "BOS", "RMB", "FRA". */
  abbreviation: string;
  city: string;
  /** Code pays ISO-3 : "USA", "ESP", "FRA"… */
  country: string;
  kind: TeamKind;
  /** Une équipe peut disputer plusieurs compétitions (ex. Real Madrid : EuroLeague + Liga ACB). */
  competitionIds: ID[];
  /** Groupe / conférence par compétition : { nba: "Est" }, { "fiba-world-cup": "Groupe A" }. */
  groups?: Record<ID, string>;
  colors: TeamColors;
  arena?: string;
  coach?: string;
  founded?: number;
}

/** Statistiques d'une équipe sur une saison, pour une compétition donnée. */
export interface TeamSeasonStats {
  teamId: ID;
  competitionId: ID;
  season: Season;
  gamesPlayed: number;
  wins: number;
  losses: number;
  pointsPerGame: number;
  pointsAllowedPerGame: number;
  /** Points marqués pour 100 possessions. */
  offensiveRating: number;
  /** Points encaissés pour 100 possessions. */
  defensiveRating: number;
  netRating: number;
  /** Possessions par match (normalisées sur la durée réglementaire). */
  pace: number;
  fieldGoalPct: number;
  threePointPct: number;
  freeThrowPct: number;
  effectiveFieldGoalPct: number;
  trueShootingPct: number;
  reboundsPerGame: number;
  assistsPerGame: number;
  turnoversPerGame: number;
  stealsPerGame: number;
  blocksPerGame: number;
  /** 5 derniers résultats, du plus ancien au plus récent. */
  form: FormResult[];
  /** Indice de forme /10 (résultats récents pondérés + écarts de score). */
  formScore: number;
  homeRecord: WinLoss;
  awayRecord: WinLoss;
  streak: Streak;
}
