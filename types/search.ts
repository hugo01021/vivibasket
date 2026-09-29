import type { ID, ISODateString } from "./common";

export type SearchResultType = "team" | "player" | "competition";

export interface SearchResult {
  type: SearchResultType;
  id: ID;
  label: string;
  /** Contexte : club, compétition, poste… */
  sublabel?: string;
  href: string;
}

export type FavoriteKind = "team" | "competition" | "player";

export interface Favorite {
  kind: FavoriteKind;
  id: ID;
  addedAt: ISODateString;
}
