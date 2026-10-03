import "server-only";
import { cacheGet, cacheSet } from "~/server/db/cache";
import { normalizeText, parisDateKey, parisTimeToDate } from "~/lib/utils";
import { buildCustomFixture, getFixtureById, resolveMatchup, searchTeams, sportsDayKey } from "../fixtures";
import { getTeamSheet } from "../sheets";
import { LEAGUES, LEAGUE_ORDER, TEAMS, getTeam, teamsOf } from "../teams";
import type { Fixture, H2HGame, LeagueId, LiveState, MatchStatus, Team, TeamSheet } from "../types";
import type { BasketStatsProvider } from "../api";

/**
 * Fournisseur réel : api-basketball (API-Sports), https://api-sports.io
 *
 * Budget de requêtes (plan gratuit : 100 / jour) tenu grâce au cache en base :
 *  - programme du jour : 2 requêtes (jour J et J+1) toutes les 10 minutes ;
 *  - par équipe analysée : statistiques (12 h) + calendrier (6 h) ;
 *  - par match analysé : confrontations (24 h) + cotes (30 min) ;
 *  - référentiels (ligues, équipes) : 24 h à 7 jours.
 */
const BASE_URL = (process.env.BASKET_API_BASE_URL?.trim() || "https://v1.basketball.api-sports.io").replace(/\/+$/, "");
const TZ = "Europe/Paris";
const MIN = 60_000;
const HOUR = 60 * MIN;

type ApiTeamRef = { id: number; name: string; logo?: string };
type ApiGame = {
  id: number;
  date: string;
  timestamp: number;
  stage?: string | null;
  week?: string | number | null;
  status: { long?: string; short: string; timer?: string | null };
  league: { id: number; name: string; season?: string | number };
  country?: { name?: string };
  teams: { home: ApiTeamRef; away: ApiTeamRef };
  scores: { home: ApiScore; away: ApiScore };
};
type ApiScore = { total?: number | null; quarter_1?: number | null; quarter_2?: number | null; quarter_3?: number | null; quarter_4?: number | null; over_time?: number | null };
type ApiLeague = { id: number; name: string; type?: string; country?: { name?: string; code?: string }; seasons?: Array<{ season: string | number; current?: boolean }> };
type ApiStatistics = {
  games?: {
    played?: { home?: number; away?: number; all?: number };
    wins?: { home?: { total?: number }; away?: { total?: number }; all?: { total?: number } };
    loses?: { home?: { total?: number }; away?: { total?: number }; all?: { total?: number } };
  };
  points?: {
    for?: { average?: { home?: number | string; away?: number | string; all?: number | string } };
    against?: { average?: { home?: number | string; away?: number | string; all?: number | string } };
  };
};
type ApiOdds = { bookmakers?: Array<{ name?: string; bets?: Array<{ name?: string; values?: Array<{ value?: string; odd?: string | number }> }> }> };

let lastError: string | null = null;
export function getLastDataError(): string | null {
  return lastError;
}

/* ─── Appels HTTP avec cache ──────────────────────────────────────────────── */

async function apiGet<T>(path: string, params: Record<string, string | number | undefined>, ttlMs: number): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  const key = `as:${url.pathname}?${url.searchParams.toString()}`;
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const apiKey = process.env.BASKET_API_KEY?.trim();
  if (!apiKey) throw new Error("BASKET_API_KEY manquant");
  const res = await fetch(url, { headers: { "x-apisports-key": apiKey }, cache: "no-store" });
  if (!res.ok) throw new Error(`API-Sports ${res.status} sur ${url.pathname}`);
  const json = (await res.json()) as { errors?: unknown; response?: T };
  const errors = json.errors;
  if (errors && typeof errors === "object" && !Array.isArray(errors) && Object.keys(errors).length > 0) {
    throw new Error(`API-Sports : ${Object.values(errors as Record<string, string>).join(" ; ")}`);
  }
  const response = (json.response ?? []) as T;
  await cacheSet(key, response, ttlMs);
  return response;
}

/* ─── Ligues et saisons ───────────────────────────────────────────────────── */

type LeagueRef = { id: number; season: string };
const DEFAULT_LEAGUE_IDS: Record<LeagueId, number> = { nba: 12, euroleague: 120, betclic: 2 };

function defaultSeason(league: LeagueId, now = new Date()): string {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  const start = m >= 8 ? y : y - 1;
  return league === "nba" ? `${start}-${start + 1}` : `${start}-${start + 1}`;
}

function matchesLeague(league: LeagueId, l: ApiLeague): boolean {
  const name = normalizeText(l.name);
  const country = normalizeText(l.country?.name ?? "");
  if (league === "nba") return name === "nba" && (country === "usa" || country === "united states" || country === "");
  if (league === "euroleague") return name.includes("euroleague") && !name.includes("women");
  return (country === "france" || country === "") && (name.includes("pro a") || name.includes("betclic") || name === "lnb");
}

async function resolveLeagues(now = new Date()): Promise<Record<LeagueId, LeagueRef>> {
  const refs = {} as Record<LeagueId, LeagueRef>;
  let leagues: ApiLeague[] = [];
  try {
    leagues = await apiGet<ApiLeague[]>("/leagues", {}, 24 * HOUR);
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
  }
  for (const league of LEAGUE_ORDER) {
    const found = leagues.find((l) => matchesLeague(league, l)) ?? leagues.find((l) => l.id === DEFAULT_LEAGUE_IDS[league]);
    const current = found?.seasons?.find((s) => s.current)?.season ?? found?.seasons?.at(-1)?.season;
    refs[league] = { id: found?.id ?? DEFAULT_LEAGUE_IDS[league], season: current !== undefined ? String(current) : defaultSeason(league, now) };
  }
  return refs;
}

/* ─── Équipes : rapprochement avec le référentiel interne ─────────────────── */

function tokens(value: string): string[] {
  return normalizeText(value)
    .split(" ")
    .filter((t) => t.length > 2 && !["basketball", "basket", "club", "the", "les", "des"].includes(t));
}

/** Retrouve l'équipe du référentiel correspondant à un nom fourni par l'API (pour salle, ville, code). */
function findRegistryTeam(name: string, league: LeagueId): Team | undefined {
  const n = normalizeText(name);
  const pool = teamsOf(league);
  const exact = pool.find((t) => normalizeText(t.name) === n || (t.aliases ?? []).some((a) => normalizeText(a) === n));
  if (exact) return exact;
  const apiTokens = tokens(name);
  let best: { team: Team; score: number; distinctive: boolean } | null = null;
  for (const team of pool) {
    const hay = new Set([...tokens(team.name), ...tokens(team.city), ...(team.aliases ?? []).flatMap(tokens)]);
    const hits = apiTokens.filter((t) => hay.has(t));
    const score = hits.length;
    // Un seul mot suffit s'il est distinctif (« olympiacos », « panathinaikos », « fenerbahce »…).
    const distinctive = hits.some((t) => t.length >= 6);
    if (score > 0 && (!best || score > best.score)) best = { team, score, distinctive };
  }
  if (!best) return undefined;
  return best.score >= 2 || best.distinctive ? best.team : undefined;
}

function shortCode(name: string): string {
  const parts = normalizeText(name).split(" ").filter(Boolean);
  const code = parts.length >= 3 ? parts.slice(0, 3).map((p) => p[0]).join("") : parts.length === 2 ? parts[0].slice(0, 2) + parts[1][0] : parts[0]?.slice(0, 3) ?? "???";
  return code.toUpperCase();
}

function toTeam(ref: ApiTeamRef, league: LeagueId): Team {
  const registry = findRegistryTeam(ref.name, league);
  if (registry) return { ...registry, externalId: ref.id };
  const lg = LEAGUES[league];
  return {
    id: `as-${ref.id}`,
    league,
    name: ref.name,
    short: shortCode(ref.name),
    city: "",
    arena: "",
    off: lg.avgRating,
    def: lg.avgRating,
    pace: lg.avgPace,
    externalId: ref.id,
  };
}

/** Identifiant API d'une équipe du référentiel (liste des équipes de la ligue, en cache 7 jours). */
async function resolveExternalId(team: Team, ref: LeagueRef): Promise<number | undefined> {
  if (team.externalId) return team.externalId;
  if (team.id.startsWith("as-")) return Number(team.id.slice(3));
  try {
    const list = await apiGet<ApiTeamRef[]>("/teams", { league: ref.id, season: ref.season }, 7 * 24 * HOUR);
    const wanted = new Set([normalizeText(team.name), ...(team.aliases ?? []).map(normalizeText)]);
    const exact = list.find((t) => wanted.has(normalizeText(t.name)));
    if (exact) return exact.id;
    const mine = new Set([...tokens(team.name), ...tokens(team.city), ...(team.aliases ?? []).flatMap(tokens)]);
    let best: { id: number; score: number } | null = null;
    for (const t of list) {
      const score = tokens(t.name).filter((x) => mine.has(x)).length;
      if (score > 0 && (!best || score > best.score)) best = { id: t.id, score };
    }
    return best?.id;
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
    return undefined;
  }
}

/* ─── Matchs ──────────────────────────────────────────────────────────────── */

const LIVE_SHORT: Record<string, { period: number; progress: number; label: string }> = {
  Q1: { period: 1, progress: 0.12, label: "Q1" },
  Q2: { period: 2, progress: 0.37, label: "Q2" },
  HT: { period: 2, progress: 0.5, label: "Mi-temps" },
  Q3: { period: 3, progress: 0.62, label: "Q3" },
  Q4: { period: 4, progress: 0.87, label: "Q4" },
  OT: { period: 5, progress: 0.98, label: "Prolongation" },
  BT: { period: 2, progress: 0.5, label: "Pause" },
};
const FINISHED_SHORT = new Set(["FT", "AOT", "POST", "CANC", "ABD", "AWD", "WO"]);

function translateStage(stage: string | null | undefined, week: string | number | null | undefined): string {
  const w = week !== null && week !== undefined ? String(week).trim() : "";
  if (/^\d+$/.test(w)) return `Journée ${w}`;
  const s = (stage ?? "").toLowerCase();
  if (s.includes("regular")) return "Saison régulière";
  if (s.includes("playoff") || s.includes("play-off")) return "Playoffs";
  if (s.includes("play-in")) return "Play-in";
  if (s.includes("final")) return "Phase finale";
  if (s.includes("pre")) return "Pré-saison";
  if (s.includes("cup")) return "Coupe";
  return stage ? stage : w ? w : "Saison";
}

function toFixture(game: ApiGame, league: LeagueId, now: Date): Fixture {
  const home = toTeam(game.teams.home, league);
  const away = toTeam(game.teams.away, league);
  const tipoff = new Date(game.timestamp ? game.timestamp * 1000 : game.date);
  const short = game.status?.short ?? "NS";
  let status: MatchStatus = "upcoming";
  let live: LiveState | undefined;
  if (FINISHED_SHORT.has(short)) status = "finished";
  else if (LIVE_SHORT[short]) {
    status = "live";
    const info = LIVE_SHORT[short];
    const timer = game.status?.timer ? ` · ${game.status.timer}` : "";
    live = { period: info.period, label: short === "HT" ? info.label : `${info.label}${timer}`, home: game.scores?.home?.total ?? 0, away: game.scores?.away?.total ?? 0, progress: info.progress };
  } else if (tipoff.getTime() < now.getTime() - 4 * HOUR) status = "finished";
  return {
    id: `as_${game.id}`,
    dateKey: sportsDayKey(tipoff),
    league,
    home,
    away,
    tipoff: tipoff.toISOString(),
    phase: translateStage(game.stage, game.week),
    venue: home.arena ? `${home.arena}, ${home.city}` : `Salle de ${home.name}`,
    status,
    live,
  };
}

function nextDay(dateKey: string): string {
  return parisDateKey(new Date(parisTimeToDate(dateKey, "12:00").getTime() + 24 * HOUR));
}

async function fetchDayGames(dateKey: string): Promise<ApiGame[]> {
  return apiGet<ApiGame[]>("/games", { date: dateKey, timezone: TZ }, 10 * MIN);
}

async function todayFixtures(now: Date): Promise<Fixture[]> {
  const dateKey = sportsDayKey(now);
  const refs = await resolveLeagues(now);
  const byLeague = new Map<number, LeagueId>(LEAGUE_ORDER.map((l) => [refs[l].id, l]));
  const start = parisTimeToDate(dateKey, "06:00").getTime();
  const end = start + 24 * HOUR;
  const games = [...(await fetchDayGames(dateKey)), ...(await fetchDayGames(nextDay(dateKey)))];
  const seen = new Set<number>();
  const fixtures: Fixture[] = [];
  for (const game of games) {
    const league = byLeague.get(game.league?.id);
    if (!league || seen.has(game.id)) continue;
    seen.add(game.id);
    const t = game.timestamp ? game.timestamp * 1000 : Date.parse(game.date);
    if (t < start || t >= end) continue;
    if (["CANC", "POST", "ABD"].includes(game.status?.short ?? "")) continue;
    fixtures.push(toFixture(game, league, now));
  }
  return fixtures.sort((a, b) => {
    if (a.status !== b.status) return a.status === "live" ? -1 : b.status === "live" ? 1 : a.status === "finished" ? 1 : b.status === "finished" ? -1 : 0;
    return new Date(a.tipoff).getTime() - new Date(b.tipoff).getTime();
  });
}

/* ─── Fiches d'équipe ─────────────────────────────────────────────────────── */

function num(v: number | string | undefined | null, fallback: number): number {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

function finished(games: ApiGame[]): ApiGame[] {
  return games.filter((g) => FINISHED_SHORT.has(g.status?.short ?? "") && g.scores?.home?.total != null && g.scores?.away?.total != null);
}

function winnerIs(game: ApiGame, teamId: number): boolean {
  const h = game.scores.home.total ?? 0;
  const a = game.scores.away.total ?? 0;
  return game.teams.home.id === teamId ? h > a : a > h;
}

async function buildSheet(team: Team, league: LeagueId, ref: LeagueRef, tipoff: Date, notes: string[]): Promise<TeamSheet> {
  const base = getTeamSheet(team, sportsDayKey(tipoff)); // valeurs de repli (estimations)
  const externalId = await resolveExternalId(team, ref);
  if (!externalId) {
    notes.push(`${team.name} : équipe introuvable chez le fournisseur, statistiques estimées.`);
    return base;
  }
  const lg = LEAGUES[league];
  let sheet: TeamSheet = { ...base, injuries: [] };

  try {
    const raw = await apiGet<ApiStatistics | ApiStatistics[]>("/statistics", { league: ref.id, season: ref.season, team: externalId }, 12 * HOUR);
    const stats = Array.isArray(raw) ? raw[0] : raw;
    const avgFor = num(stats?.points?.for?.average?.all, 0);
    const avgAgainst = num(stats?.points?.against?.average?.all, 0);
    const played = num(stats?.games?.played?.all, 0);
    if (played > 0 && avgFor > 0 && avgAgainst > 0) {
      const leagueTotal = (2 * lg.avgRating * lg.avgPace) / 100;
      const pace = Math.round(lg.avgPace * ((avgFor + avgAgainst) / leagueTotal) * 10) / 10;
      const off = Math.round(((avgFor / pace) * 100) * 10) / 10;
      const def = Math.round(((avgAgainst / pace) * 100) * 10) / 10;
      const strength = off - def;
      sheet = {
        ...sheet,
        off,
        def,
        pace,
        homeRecord: { wins: num(stats?.games?.wins?.home?.total, base.homeRecord.wins), losses: num(stats?.games?.loses?.home?.total, base.homeRecord.losses) },
        awayRecord: { wins: num(stats?.games?.wins?.away?.total, base.awayRecord.wins), losses: num(stats?.games?.loses?.away?.total, base.awayRecord.losses) },
        efg: Math.round((0.54 + (off - lg.avgRating) / 400) * 1000) / 1000,
        tov: Math.round((0.13 - (off - lg.avgRating) / 900) * 1000) / 1000,
        threePct: Math.round((0.355 + (off - lg.avgRating) / 500) * 1000) / 1000,
        clutchNet: Math.round((strength / 2) * 10) / 10,
      };
    } else {
      notes.push(`${team.name} : pas encore de statistiques de saison, valeurs estimées.`);
    }
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
    notes.push(`${team.name} : statistiques indisponibles (${lastError}).`);
  }

  try {
    const games = await apiGet<ApiGame[]>("/games", { league: ref.id, season: ref.season, team: externalId, timezone: TZ }, 6 * HOUR);
    const past = finished(games)
      .filter((g) => (g.timestamp ? g.timestamp * 1000 : Date.parse(g.date)) < tipoff.getTime())
      .sort((a, b) => b.timestamp - a.timestamp);
    if (past.length > 0) {
      const form = past.slice(0, 5).map((g) => (winnerIs(g, externalId) ? "V" : "D")) as Array<"V" | "D">;
      const lastAt = past[0].timestamp * 1000;
      const restDays = Math.max(0, Math.round((tipoff.getTime() - lastAt) / (24 * HOUR)));
      sheet = { ...sheet, form: form.length === 5 ? form : [...form, ...base.form].slice(0, 5) as Array<"V" | "D">, restDays, backToBack: restDays <= 1 };
    }
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
    notes.push(`${team.name} : calendrier indisponible, forme estimée.`);
  }
  return sheet;
}

async function fetchH2H(fixture: Fixture, homeExt: number | undefined, awayExt: number | undefined, notes: string[]): Promise<H2HGame[]> {
  if (!homeExt || !awayExt) return [];
  try {
    const games = await apiGet<ApiGame[]>("/games", { h2h: `${homeExt}-${awayExt}`, timezone: TZ }, 24 * HOUR);
    return finished(games)
      .filter((g) => g.timestamp * 1000 < new Date(fixture.tipoff).getTime())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5)
      .map((g) => ({
        date: new Date(g.timestamp * 1000).toISOString(),
        homeTeamId: g.teams.home.id === homeExt ? fixture.home.id : fixture.away.id,
        awayTeamId: g.teams.away.id === awayExt ? fixture.away.id : fixture.home.id,
        homeScore: g.scores.home.total ?? 0,
        awayScore: g.scores.away.total ?? 0,
      }));
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
    notes.push("Confrontations directes indisponibles.");
    return [];
  }
}

async function fetchOdds(fixture: Fixture): Promise<{ home: number; away: number } | null> {
  if (!fixture.id.startsWith("as_")) return null;
  try {
    const raw = await apiGet<ApiOdds[]>("/odds", { game: fixture.id.slice(3) }, 30 * MIN);
    const homes: number[] = [];
    const aways: number[] = [];
    for (const entry of raw) {
      for (const bk of entry.bookmakers ?? []) {
        const bet = (bk.bets ?? []).find((b) => /^(home\/away|moneyline|winner)$/i.test(b.name ?? ""));
        if (!bet) continue;
        const h = Number(bet.values?.find((v) => /^home$/i.test(v.value ?? ""))?.odd);
        const a = Number(bet.values?.find((v) => /^away$/i.test(v.value ?? ""))?.odd);
        if (h > 1 && a > 1) {
          homes.push(h);
          aways.push(a);
        }
      }
    }
    if (homes.length === 0) return null;
    const avg = (xs: number[]) => Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 100) / 100;
    return { home: avg(homes), away: avg(aways) };
  } catch {
    return null;
  }
}

/* ─── Fournisseur ─────────────────────────────────────────────────────────── */

export const apiSportsProvider: BasketStatsProvider = {
  name: "api-sports",

  async getTodayFixtures(now = new Date(), league) {
    try {
      const all = await todayFixtures(now);
      lastError = null;
      return league ? all.filter((f) => f.league === league) : all;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.error("[api-sports] programme du jour indisponible :", lastError);
      return [];
    }
  },

  async getFixture(id, now = new Date()) {
    if (id.startsWith("as_")) {
      try {
        const games = await apiGet<ApiGame[]>("/games", { id: id.slice(3), timezone: TZ }, 5 * MIN);
        const game = games[0];
        if (!game) return undefined;
        const refs = await resolveLeagues(now);
        const league = LEAGUE_ORDER.find((l) => refs[l].id === game.league?.id);
        return league ? toFixture(game, league, now) : undefined;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        return undefined;
      }
    }
    return getFixtureById(id, now);
  },

  async getAnalysisData(fixture) {
    const notes: string[] = [];
    const refs = await resolveLeagues();
    const ref = refs[fixture.league];
    const tipoff = new Date(fixture.tipoff);
    const [home, away] = await Promise.all([buildSheet(fixture.home, fixture.league, ref, tipoff, notes), buildSheet(fixture.away, fixture.league, ref, tipoff, notes)]);
    const [homeExt, awayExt] = await Promise.all([resolveExternalId(fixture.home, ref), resolveExternalId(fixture.away, ref)]);
    const [h2h, marketOdds] = await Promise.all([fetchH2H(fixture, homeExt, awayExt, notes), fetchOdds(fixture)]);
    notes.push("Blessures : non fournies par la source de données, facteur neutre.");
    if (!marketOdds) notes.push("Cotes du marché indisponibles pour ce match : marché simulé.");
    return { home, away, h2h, marketOdds, source: "api-sports", notes };
  },

  async searchTeams(query, limit) {
    return searchTeams(query, limit);
  },

  async resolveMatchup(query, now = new Date()) {
    const today = await this.getTodayFixtures(now);
    return resolveMatchup(query, now, today);
  },

  async buildMatchup(homeId, awayId, now = new Date()) {
    const home = getTeam(homeId) ?? TEAMS.find((t) => t.id === homeId);
    const away = getTeam(awayId);
    if (!home || !away || home.id === away.id) return undefined;
    return buildCustomFixture(home, away, sportsDayKey(now), now);
  },
};
