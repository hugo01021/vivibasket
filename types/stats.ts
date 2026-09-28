import type { ID } from "./common";

export interface ShootingLine {
  made: number;
  attempted: number;
}

/** Ligne de box score d'un joueur sur un match. */
export interface PlayerBoxScoreLine {
  playerId: ID;
  teamId: ID;
  starter: boolean;
  /** Minutes jouées (décimales : 34.5 = 34 min 30 s). */
  minutes: number;
  points: number;
  rebounds: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fieldGoals: ShootingLine;
  threePointers: ShootingLine;
  freeThrows: ShootingLine;
  plusMinus: number;
  /** PIR : (PTS+REB+AST+STL+BLK+fautes provoquées) − (tirs ratés + LF ratés + BP + fautes). */
  efficiency: number;
  /** Sur le terrain en ce moment (match en direct). */
  onCourt?: boolean;
}

/** Totaux d'équipe sur un match. */
export interface TeamBoxScore {
  teamId: ID;
  points: number;
  fieldGoals: ShootingLine;
  threePointers: ShootingLine;
  freeThrows: ShootingLine;
  rebounds: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  pointsInPaint: number;
  fastBreakPoints: number;
  secondChancePoints: number;
  benchPoints: number;
  pointsOffTurnovers: number;
  biggestLead: number;
  timeoutsRemaining: number;
}

/** Stats avancées d'équipe sur un match (four factors, ratings, pace). */
export interface AdvancedTeamStats {
  teamId: ID;
  possessions: number;
  pace: number;
  offensiveRating: number;
  defensiveRating: number;
  netRating: number;
  effectiveFieldGoalPct: number;
  trueShootingPct: number;
  turnoverPct: number;
  offensiveReboundPct: number;
  freeThrowRate: number;
  assistPct: number;
  threePointRate: number;
}
