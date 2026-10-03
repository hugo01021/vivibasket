export type LeagueId = "nba" | "euroleague" | "betclic";

export type League = {
  id: LeagueId;
  name: string;
  short: string;
  /** Avantage du terrain moyen, en points. */
  homeAdvantage: number;
  /** Écart-type de la marge finale, en points (sert au calcul des probabilités). */
  marginSigma: number;
  /** Moyennes de ligue pour situer une équipe. */
  avgRating: number;
  avgPace: number;
  minutes: 40 | 48;
};

export type Team = {
  id: string;
  league: LeagueId;
  name: string;
  short: string;
  city: string;
  arena: string;
  /** Rating offensif / défensif (points pour 100 possessions) et rythme (possessions par match). */
  off: number;
  def: number;
  pace: number;
  /** Mots-clés de recherche supplémentaires (surnoms, variantes). */
  aliases?: string[];
  /** Identifiant chez le fournisseur de données externe (API-Sports). */
  externalId?: number;
};

export type MatchStatus = "upcoming" | "live" | "finished";

export type LiveState = {
  period: number;
  /** Libellé du moment : « Q3 · 04:12 », « Mi-temps », « Prolongation »… */
  label: string;
  home: number;
  away: number;
  /** Fraction du temps réglementaire écoulée (0..1). */
  progress: number;
};

export type Fixture = {
  id: string;
  dateKey: string;
  league: LeagueId;
  home: Team;
  away: Team;
  tipoff: string;
  phase: string;
  venue: string;
  status: MatchStatus;
  live?: LiveState;
};

export type Injury = {
  role: string;
  issue: string;
  status: "absent" | "incertain" | "ménagé";
  impact: "faible" | "modéré" | "fort";
};

export type TeamSheet = {
  teamId: string;
  form: Array<"V" | "D">;
  homeRecord: { wins: number; losses: number };
  awayRecord: { wins: number; losses: number };
  restDays: number;
  backToBack: boolean;
  injuries: Injury[];
  off: number;
  def: number;
  pace: number;
  efg: number;
  tov: number;
  orb: number;
  ftr: number;
  threePct: number;
  benchPoints: number;
  clutchNet: number;
};

export type FactorKey =
  | "forme"
  | "terrain"
  | "h2h"
  | "attaque"
  | "defense"
  | "rythme"
  | "fatigue"
  | "blessures";

export type Factor = {
  key: FactorKey;
  label: string;
  /** Scores 0-100 pour chaque équipe. */
  home: number;
  away: number;
  edge: "home" | "away" | "even";
  note: string;
};

export type H2HGame = {
  date: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
};

/** Données nécessaires au moteur pour analyser un match (mock ou fournisseur réel). */
export type AnalysisData = {
  home: TeamSheet;
  away: TeamSheet;
  h2h: H2HGame[];
  /** Cotes décimales du marché si connues ; sinon le moteur simule un marché. */
  marketOdds: { home: number; away: number } | null;
  /** Provenance des données, affichée dans le résultat. */
  source: "mock" | "api-sports";
  notes: string[];
};

export type StatLine = { key: string; label: string; home: number; away: number; unit?: "pct" | "pts" | "num"; betterIs: "high" | "low" };

export type AnalysisResult = {
  version: 1;
  generatedAt: string;
  match: {
    id: string;
    league: LeagueId;
    leagueName: string;
    home: Pick<Team, "id" | "name" | "short" | "city">;
    away: Pick<Team, "id" | "name" | "short" | "city">;
    venue: string;
    phase: string;
    tipoff: string;
    status: MatchStatus;
  };
  probabilities: { home: number; away: number; confidence: number };
  projectedScore: { home: number; away: number; total: number; spread: number };
  factors: Factor[];
  form: { home: Array<"V" | "D">; away: Array<"V" | "D"> };
  h2h: H2HGame[];
  keyStats: StatLine[];
  advanced: StatLine[];
  injuries: { home: Injury[]; away: Injury[] };
  value: {
    market: { home: number; away: number };
    fair: { home: number; away: number };
    edge: { home: number; away: number };
    pick: "home" | "away" | null;
  };
  live: (LiveState & { winProbHome: number }) | null;
  summary: string;
  bullets: string[];
  source: "mock" | "api-sports";
  notes: string[];
};
