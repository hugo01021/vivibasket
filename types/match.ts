import type { FormResult, ID, ISODateString, Season, Streak, WinLoss } from "./common";
import type { Competition } from "./competition";
import type { AdvancedTeamStats, PlayerBoxScoreLine, TeamBoxScore } from "./stats";
import type { Team } from "./team";

export type MatchStatus =
  | "scheduled"
  | "live"
  | "halftime"
  | "finished"
  | "postponed"
  | "cancelled";

export interface PeriodScore {
  /** 1 à 4 = quart-temps ; 5+ = prolongations. */
  period: number;
  /** "Q1"…"Q4", "OT", "OT2"… */
  label: string;
  home: number;
  away: number;
}

export interface MatchClock {
  period: number;
  periodLabel: string;
  /** "mm:ss" restant dans la période. */
  timeRemaining: string;
  running: boolean;
}

export interface Match {
  id: ID;
  competitionId: ID;
  season: Season;
  /** "Saison régulière", "Qualifications", "Phase de groupes", "Playoffs". */
  stage: string;
  /** "Journée 12", "Round 3", "Fenêtre 4", "Groupe A". */
  round: string;
  /** Coup d'envoi (UTC). */
  date: ISODateString;
  status: MatchStatus;
  homeTeamId: ID;
  awayTeamId: ID;
  homeScore: number;
  awayScore: number;
  /** Détail par période (vide pour un match à venir). */
  periods: PeriodScore[];
  /** Présent uniquement pour un match en direct. */
  clock?: MatchClock;
  venue?: string;
  attendance?: number;
  broadcast?: string;
}

export type PlayEventType =
  | "period_start"
  | "period_end"
  | "jump_ball"
  | "two_made"
  | "two_missed"
  | "three_made"
  | "three_missed"
  | "free_throw_made"
  | "free_throw_missed"
  | "rebound_off"
  | "rebound_def"
  | "turnover"
  | "steal"
  | "block"
  | "foul"
  | "timeout"
  | "substitution";

export interface PlayByPlayEvent {
  id: ID;
  /** Ordre chronologique croissant. */
  sequence: number;
  period: number;
  /** "mm:ss" restant au moment de l'action. */
  clock: string;
  type: PlayEventType;
  teamId?: ID;
  playerId?: ID;
  assistPlayerId?: ID;
  /** Texte prêt à afficher : "Tatum — tir à 3 pts réussi (passe D. White)". */
  description: string;
  homeScore: number;
  awayScore: number;
  isScoring: boolean;
}

export type InsightTone = "positive" | "negative" | "neutral";

export interface AnalysisInsight {
  title: string;
  body: string;
  tone: InsightTone;
  /** Équipe concernée (absent = observation générale). */
  teamId?: ID;
}

export interface MomentumPoint {
  period: number;
  leader: "home" | "away" | "even";
  note: string;
}

/**
 * Bloc « Analyse IA » d'un match.
 * Aujourd'hui produit par des règles (mock) ; destiné à être généré par un LLM
 * via la route /api/analysis (champ `source` = "llm").
 */
export interface MatchAnalysis {
  matchId: ID;
  generatedAt: ISODateString;
  source: "mock" | "llm";
  model?: string;
  /** Résumé en 2-3 phrases. */
  summary: string;
  /** Points clés (3 à 5). */
  insights: AnalysisInsight[];
  keyPlayers: { home: ID; away: ID };
  /** Forme des deux équipes /10. */
  form: { home: number; away: number };
  /** Probabilité de victoire pré-match (somme = 1). */
  winProbability: { home: number; away: number };
  momentum: MomentumPoint[];
}

/** Ligne de classement. */
export interface StandingRow {
  competitionId: ID;
  teamId: ID;
  group?: string;
  rank: number;
  played: number;
  wins: number;
  losses: number;
  winPct: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  /** Matchs de retard sur le leader (NBA). */
  gamesBehind: number;
  streak: Streak;
  last5: FormResult[];
  home: WinLoss;
  away: WinLoss;
}

/** Tout ce qu'affiche la page d'un match. */
export interface MatchDetails {
  match: Match;
  competition: Competition;
  homeTeam: Team;
  awayTeam: Team;
  /** Absent pour un match à venir. */
  teamStats: { home: TeamBoxScore; away: TeamBoxScore } | null;
  /** Absent pour un match à venir. */
  advanced: { home: AdvancedTeamStats; away: AdvancedTeamStats } | null;
  /** Vide pour un match à venir. */
  boxScore: { home: PlayerBoxScoreLine[]; away: PlayerBoxScoreLine[] };
  /** Vide pour un match à venir. */
  playByPlay: PlayByPlayEvent[];
  analysis: MatchAnalysis;
  /** Confrontations directes récentes (saison en cours). */
  headToHead: Match[];
}
