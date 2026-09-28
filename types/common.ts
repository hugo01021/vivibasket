/** Identifiant opaque (string) — compatible avec les IDs numériques des API externes une fois convertis. */
export type ID = string;

/** Date/heure ISO 8601 en UTC, ex. "2026-09-28T18:45:00.000Z". */
export type ISODateString = string;

/** Jour calendaire (fuseau Europe/Paris), ex. "2026-09-28". */
export type DayString = string;

/** Libellé de saison, ex. "2026-27" (ligues) ou "2027" (tournois). */
export type Season = string;

/** Résultat d'un match du point de vue d'une équipe. */
export type FormResult = "W" | "L";

export interface WinLoss {
  wins: number;
  losses: number;
}

export interface Streak {
  type: FormResult;
  count: number;
}
