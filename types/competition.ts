import type { ID, Season } from "./common";

/** Slugs d'URL des compétitions (/competitions/[slug]). */
export type CompetitionSlug =
  | "nba"
  | "euroleague"
  | "eurocup"
  | "fiba-world-cup"
  | "olympics"
  | "liga-acb"
  | "betclic-elite"
  | "lega-a"
  | "bcl";

/**
 * Catégorie de navigation.
 * - `nba`           : NBA
 * - `europe`        : coupes d'Europe (EuroLeague, EuroCup)
 * - `international` : sélections nationales (Coupe du Monde, JO)
 * - `national`      : championnats nationaux mis en avant (ACB, Betclic Élite)
 * - `other`         : entrée « Autres » du menu
 */
export type CompetitionCategory =
  | "nba"
  | "europe"
  | "international"
  | "national"
  | "other";

export type CompetitionFormat = "league" | "league-playoffs" | "tournament";

export interface Competition {
  id: ID;
  slug: CompetitionSlug;
  /** Nom court affiché partout : "NBA", "EuroLeague", "Betclic Élite". */
  name: string;
  /** Nom complet : "National Basketball Association". */
  fullName: string;
  /** Région / pays : "États-Unis", "Europe", "Monde", "Espagne", "France". */
  region: string;
  category: CompetitionCategory;
  format: CompetitionFormat;
  season: Season;
  /** Phase en cours : "Saison régulière", "Qualifications", "Phase de groupes". */
  stage: string;
  /** Couleur d'identification (badge, filtres). Palette propre à l'app. */
  accentColor: string;
  /** Durée réglementaire d'un match (48 min NBA, 40 min FIBA). */
  gameMinutes: 48 | 40;
  /** Nombre de périodes réglementaires (4 partout, garde la porte ouverte). */
  periods: number;
  /** Groupes / conférences : ["Est", "Ouest"], ["Groupe A", ...]. Absent = classement unique. */
  groups?: string[];
  /** Ordre dans le menu principal. */
  navOrder: number;
  /** Nombre d'équipes engagées (informatif). */
  teamCount: number;
}
