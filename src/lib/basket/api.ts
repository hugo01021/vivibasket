/**
 * Couche « API de statistiques basket ».
 *
 * Deux fournisseurs implémentent `BasketStatsProvider` :
 *  - `mockProvider` : données fictives mais déterministes (démarrage, tests) ;
 *  - `apiSportsProvider` : données réelles via api-basketball (API-Sports),
 *    activé dès que `BASKET_API_KEY` est défini.
 */
import { buildCustomFixture, getDayFixtures, getFixtureById, resolveMatchup, searchTeams, sportsDayKey } from "./fixtures";
import { generateH2H } from "./engine";
import { getTeamSheet } from "./sheets";
import { getTeam } from "./teams";
import type { AnalysisData, Fixture, LeagueId, Team } from "./types";
import type { MatchupResolution } from "./fixtures";

export type { MatchupResolution };

export interface BasketStatsProvider {
  readonly name: "mock" | "api-sports";
  /** Programme de la journée sportive courante, directs en tête. */
  getTodayFixtures(now?: Date, league?: LeagueId): Promise<Fixture[]>;
  getFixture(id: string, now?: Date): Promise<Fixture | undefined>;
  /** Fiches, confrontations et cotes nécessaires au moteur d'analyse. */
  getAnalysisData(fixture: Fixture): Promise<AnalysisData>;
  searchTeams(query: string, limit?: number): Promise<Team[]>;
  resolveMatchup(query: string, now?: Date): Promise<MatchupResolution>;
  buildMatchup(homeId: string, awayId: string, now?: Date): Promise<Fixture | undefined>;
}

export function mockAnalysisData(fixture: Fixture): AnalysisData {
  return {
    home: getTeamSheet(fixture.home, fixture.dateKey),
    away: getTeamSheet(fixture.away, fixture.dateKey),
    h2h: generateH2H(fixture),
    marketOdds: null,
    source: "mock",
    notes: ["Données de démonstration : programme, statistiques et cotes sont simulés."],
  };
}

export const mockProvider: BasketStatsProvider = {
  name: "mock",
  async getTodayFixtures(now = new Date(), league) {
    const all = getDayFixtures(now);
    return league ? all.filter((f) => f.league === league) : all;
  },
  async getFixture(id, now = new Date()) {
    return getFixtureById(id, now);
  },
  async getAnalysisData(fixture) {
    return mockAnalysisData(fixture);
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

export function isRealDataEnabled(): boolean {
  return Boolean(process.env.BASKET_API_KEY?.trim());
}

/** Fournisseur actif : réel si une clé est configurée, mock sinon. */
export async function getBasketApi(): Promise<BasketStatsProvider> {
  if (!isRealDataEnabled()) return mockProvider;
  const { apiSportsProvider } = await import("./providers/api-sports");
  return apiSportsProvider;
}
