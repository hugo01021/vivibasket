import type { FormResult, ID, ISODateString, Season } from "./common";
import type { PlayerBoxScoreLine } from "./stats";

export type Position = "PG" | "SG" | "SF" | "PF" | "C" | "G" | "F" | "G-F" | "F-C";

export interface Player {
  id: ID;
  firstName: string;
  lastName: string;
  /** Club actuel (ou sélection nationale pour un joueur généré sans club connu). */
  teamId: ID;
  jerseyNumber: number;
  position: Position;
  heightCm: number;
  weightKg: number;
  /** "YYYY-MM-DD". */
  birthDate: string;
  /** Code pays ISO-3. */
  nationality: string;
  /** Sélectionnable en équipe nationale (Coupe du Monde, JO). */
  international: boolean;
  /** Vrai pour les joueurs saisis à la main ; faux pour les joueurs générés par le mock. */
  isFeatured: boolean;
}

/** Moyennes d'un joueur sur une saison, pour une compétition donnée. */
export interface PlayerSeasonStats {
  playerId: ID;
  teamId: ID;
  competitionId: ID;
  season: Season;
  gamesPlayed: number;
  gamesStarted: number;
  minutesPerGame: number;
  pointsPerGame: number;
  reboundsPerGame: number;
  assistsPerGame: number;
  stealsPerGame: number;
  blocksPerGame: number;
  turnoversPerGame: number;
  foulsPerGame: number;
  fieldGoalPct: number;
  threePointPct: number;
  freeThrowPct: number;
  fieldGoalAttemptsPerGame: number;
  threePointAttemptsPerGame: number;
  freeThrowAttemptsPerGame: number;
  plusMinus: number;
  /** Indice d'efficacité (PIR en Europe, proche du EFF NBA). */
  efficiency: number;
  /** Part des possessions utilisées (%). */
  usageRate: number;
  trueShootingPct: number;
  /** Meilleures marques de la saison. */
  highs: { points: number; rebounds: number; assists: number };
}

/** Ligne de box score d'un joueur enrichie du contexte du match. */
export interface PlayerGameLog extends PlayerBoxScoreLine {
  matchId: ID;
  competitionId: ID;
  date: ISODateString;
  opponentTeamId: ID;
  isHome: boolean;
  result: FormResult;
  teamScore: number;
  opponentScore: number;
}
