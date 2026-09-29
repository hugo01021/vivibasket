import type { Competition, Match, Player, Team } from "@/types";

/** Réponse de GET /api/favorites. */
export interface FavoritesPayload {
  teams: Team[];
  players: Array<{ player: Player; team: Team | null }>;
  competitions: Competition[];
  /** Matchs des équipes favorites. */
  matches: {
    live: Match[];
    upcoming: Match[];
    recent: Match[];
  };
  /** Équipes et compétitions référencées par `matches` (adversaires compris), pour l'affichage. */
  lookup: {
    teams: Team[];
    competitions: Competition[];
  };
}
