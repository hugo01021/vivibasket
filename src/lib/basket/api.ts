/**
 * Couche « API de statistiques basket ».
 *
 * Pour démarrer, un fournisseur mock produit des données fictives mais
 * déterministes (même journée → même programme, mêmes fiches). Pour brancher
 * un vrai fournisseur, implémentez `BasketStatsProvider` et remplacez
 * `basketApi` ci-dessous ; le reste de l'application ne change pas.
 */
import { buildCustomFixture, getDayFixtures, getFixtureById, resolveMatchup, searchTeams, sportsDayKey } from "./fixtures";
import { getTeamSheet } from "./sheets";
import { getTeam } from "./teams";
import type { MatchupResolution } from "./fixtures";
import type { Fixture, LeagueId, Team, TeamSheet } from "./types";

export type { MatchupResolution };

export interface BasketStatsProvider {
  /** Programme de la journée sportive courante, directs en tête. */
  getTodayFixtures(now?: Date, league?: LeagueId): Promise<Fixture[]>;
  getFixture(id: string, now?: Date): Promise<Fixture | undefined>;
  getTeamSheet(teamId: string, dateKey: string): Promise<TeamSheet | undefined>;
  searchTeams(query: string, limit?: number): Promise<Team[]>;
  resolveMatchup(query: string, now?: Date): Promise<MatchupResolution>;
  buildMatchup(homeId: string, awayId: string, now?: Date): Promise<Fixture | undefined>;
}

export const mockProvider: BasketStatsProvider = {
  async getTodayFixtures(now = new Date(), league) {
    const all = getDayFixtures(now);
    return league ? all.filter((f) => f.league === league) : all;
  },
  async getFixture(id, now = new Date()) {
    return getFixtureById(id, now);
  },
  async getTeamSheet(teamId, dateKey) {
    const team = getTeam(teamId);
    return team ? getTeamSheet(team, dateKey) : undefined;
  },
  async searchTeams(query, limit) {
    return searchTeams(query, limit);
  },
  async resolveMatchup(query, now = new Date()) {
    return resolveMatchup(query, now);
  },
  async buildMatchup(homeId, awayId, now = new Date()) {
    const home = getTeam(homeId);
    const away = getTeam(awayId);
    if (!home || !away || home.id === away.id) return undefined;
    return buildCustomFixture(home, away, sportsDayKey(now), now);
  },
};

export const basketApi: BasketStatsProvider = mockProvider;
