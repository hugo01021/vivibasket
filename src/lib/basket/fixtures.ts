import { normalizeText, parisDateKey, parisTimeToDate } from "~/lib/utils";
import { createRng, hashString } from "./rng";
import { LEAGUES, LEAGUE_ORDER, TEAMS, getTeam, teamsOf } from "./teams";
import type { Fixture, LeagueId, LiveState, MatchStatus, Team } from "./types";

/** Créneaux horaires (heure de Paris) et volume de matchs par ligue et par journée. */
const SLOTS: Record<LeagueId, { times: string[]; dayOffset: number }> = {
  euroleague: { times: ["18:45", "20:00", "20:30", "20:45", "21:00"], dayOffset: 0 },
  betclic: { times: ["18:30", "20:00", "20:00", "20:30"], dayOffset: 0 },
  nba: { times: ["01:00", "01:30", "02:00", "02:00", "03:30", "04:00"], dayOffset: 1 },
};

/** Durée réelle approximative d'un match, en minutes. */
const REAL_DURATION: Record<LeagueId, number> = { nba: 135, euroleague: 105, betclic: 105 };

const CUSTOM_PREFIX = "custom";

/** La « journée sportive » commence à 6 h : les matchs NBA de la nuit appartiennent à la veille. */
export function sportsDayKey(now: Date = new Date()): string {
  return parisDateKey(new Date(now.getTime() - 6 * 3_600_000));
}

function seasonDay(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = Date.UTC(y, m - 1, d);
  const seasonStartYear = m >= 9 ? y : y - 1;
  const start = Date.UTC(seasonStartYear, 8, 28);
  return Math.max(0, Math.floor((date - start) / 86_400_000));
}

function phaseLabel(league: LeagueId, dateKey: string, rng: ReturnType<typeof createRng>): string {
  const day = seasonDay(dateKey);
  if (league === "nba") {
    if (day > 190) return "Playoffs";
    return rng.chance(0.2) ? "Saison régulière · Nuit NBA" : "Saison régulière";
  }
  const round = league === "euroleague" ? Math.min(34, Math.floor(day / 3.4) + 1) : Math.min(30, Math.floor(day / 6.5) + 1);
  return `Journée ${round}`;
}

export function fixtureId(league: LeagueId, dateKey: string, home: Team, away: Team): string {
  const short = (t: Team) => t.id.slice(league.length + 1);
  return `${league}_${dateKey}_${short(home)}_${short(away)}`;
}

function expectedPoints(team: Team, opponent: Team, league: LeagueId, isHome: boolean): number {
  const pace = (team.pace + opponent.pace) / 2;
  const base = (pace * (team.off + opponent.def)) / 200;
  return base + (isHome ? LEAGUES[league].homeAdvantage / 2 : -LEAGUES[league].homeAdvantage / 2);
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** État du direct déduit du temps écoulé depuis l'entre-deux. */
export function computeLiveState(fixture: Omit<Fixture, "status" | "live">, now: Date): { status: MatchStatus; live?: LiveState } {
  const tip = new Date(fixture.tipoff).getTime();
  const elapsedMin = (now.getTime() - tip) / 60_000;
  if (elapsedMin < 0) return { status: "upcoming" };
  const duration = REAL_DURATION[fixture.league];
  if (elapsedMin >= duration) return { status: "finished" };

  const minutes = LEAGUES[fixture.league].minutes;
  const quarter = minutes / 4;
  const halftimeStart = 0.5;
  const halftimeLen = 15 / duration;
  let progress: number;
  let label: string;
  const raw = elapsedMin / duration;
  if (raw >= halftimeStart && raw < halftimeStart + halftimeLen) {
    progress = 0.5;
    label = "Mi-temps";
  } else {
    // On retire la pause de la mi-temps pour répartir le temps de jeu.
    const playable = raw < halftimeStart ? raw / halftimeStart : (raw - halftimeStart - halftimeLen) / (1 - halftimeStart - halftimeLen);
    progress = raw < halftimeStart ? playable * 0.5 : 0.5 + playable * 0.5;
    progress = Math.min(0.999, Math.max(0, progress));
    const period = Math.min(4, Math.floor(progress * 4) + 1);
    const inPeriod = progress * 4 - (period - 1);
    const remaining = Math.max(0, (1 - inPeriod) * quarter * 60);
    label = `Q${period} · ${pad(Math.floor(remaining / 60))}:${pad(Math.floor(remaining % 60))}`;
  }
  const period = Math.min(4, Math.floor(progress * 4) + 1);

  const rng = createRng(`${fixture.id}:live`);
  const expHome = expectedPoints(fixture.home, fixture.away, fixture.league, true);
  const expAway = expectedPoints(fixture.away, fixture.home, fixture.league, false);
  const driftHome = rng.gauss(0, 5);
  const driftAway = rng.gauss(0, 5);
  const minuteJitter = createRng(`${fixture.id}:${Math.floor(elapsedMin)}`);
  const home = Math.max(0, Math.round(expHome * progress + driftHome * Math.sqrt(progress) + minuteJitter.int(-1, 1)));
  const away = Math.max(0, Math.round(expAway * progress + driftAway * Math.sqrt(progress) + minuteJitter.int(-1, 1)));
  return { status: "live", live: { period, label, home, away, progress } };
}

function withStatus(base: Omit<Fixture, "status" | "live">, now: Date): Fixture {
  const state = computeLiveState(base, now);
  return { ...base, status: state.status, live: state.live };
}

/** Programme fictif mais déterministe d'une journée sportive. */
export function getDayFixtures(now: Date = new Date()): Fixture[] {
  const dateKey = sportsDayKey(now);
  const fixtures: Fixture[] = [];
  for (const league of LEAGUE_ORDER) {
    const rng = createRng(`${dateKey}:${league}:schedule`);
    const teams = rng.shuffle(teamsOf(league));
    const slots = SLOTS[league];
    const count = Math.min(slots.times.length, Math.floor(teams.length / 2));
    for (let i = 0; i < count; i++) {
      const home = teams[i * 2];
      const away = teams[i * 2 + 1];
      const base: Omit<Fixture, "status" | "live"> = {
        id: fixtureId(league, dateKey, home, away),
        dateKey,
        league,
        home,
        away,
        tipoff: parisTimeToDate(dateKey, slots.times[i], slots.dayOffset).toISOString(),
        phase: phaseLabel(league, dateKey, rng),
        venue: `${home.arena}, ${home.city}`,
      };
      fixtures.push(withStatus(base, now));
    }
  }

  // Vitrine du direct : un match NBA et un match EuroLeague sont en cours à toute heure (données simulées).
  const hourSeed = `${dateKey}:${Math.floor(now.getTime() / 3_600_000)}`;
  for (const league of ["nba", "euroleague"] as LeagueId[]) {
    const index = fixtures.findIndex((f) => f.league === league);
    if (index === -1) continue;
    const rng = createRng(`${hourSeed}:${league}:live`);
    const startedMinutesAgo = rng.int(18, 85);
    const base = { ...fixtures[index], tipoff: new Date(now.getTime() - startedMinutesAgo * 60_000).toISOString() };
    const { status: _s, live: _l, ...rest } = base;
    fixtures[index] = withStatus(rest, now);
  }

  return fixtures.sort((a, b) => {
    if (a.status !== b.status) return a.status === "live" ? -1 : b.status === "live" ? 1 : 0;
    return new Date(a.tipoff).getTime() - new Date(b.tipoff).getTime();
  });
}

/** Confrontation à la demande (hors programme du jour). */
export function buildCustomFixture(home: Team, away: Team, dateKey: string, now: Date = new Date()): Fixture {
  const league = home.league === away.league ? home.league : "euroleague";
  const slots = SLOTS[league];
  const base: Omit<Fixture, "status" | "live"> = {
    id: `${CUSTOM_PREFIX}_${dateKey}_${home.id}_${away.id}`,
    dateKey,
    league,
    home,
    away,
    tipoff: parisTimeToDate(dateKey, slots.times[Math.min(2, slots.times.length - 1)], slots.dayOffset).toISOString(),
    phase: "Confrontation à la demande",
    venue: `${home.arena}, ${home.city}`,
  };
  return withStatus(base, now);
}

export function getFixtureById(id: string, now: Date = new Date()): Fixture | undefined {
  const parts = id.split("_");
  if (parts.length !== 4) return undefined;
  const [kind, dateKey] = parts;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return undefined;
  if (kind === CUSTOM_PREFIX) {
    const home = getTeam(parts[2]);
    const away = getTeam(parts[3]);
    if (!home || !away || home.id === away.id) return undefined;
    return buildCustomFixture(home, away, dateKey, now);
  }
  // Recalcule la journée demandée pour retrouver le match (déterministe).
  const dayNoon = parisTimeToDate(dateKey, "12:00");
  const scheduled = getDayFixtures(dayNoon).find((f) => f.id === id);
  if (!scheduled) return undefined;
  const { status: _s, live: _l, ...rest } = scheduled;
  // Si la journée est celle d'aujourd'hui, on reprend l'horaire « vitrine » éventuel.
  if (dateKey === sportsDayKey(now)) {
    const today = getDayFixtures(now).find((f) => f.id === id);
    if (today) return today;
  }
  return withStatus(rest, now);
}

/* ─── Recherche libre ─────────────────────────────────────────────────────── */

type TeamMatch = { team: Team; score: number };

function scoreTeam(team: Team, query: string): number {
  const q = normalizeText(query);
  if (!q) return 0;
  const name = normalizeText(team.name);
  const city = normalizeText(team.city);
  const short = normalizeText(team.short);
  const aliases = (team.aliases ?? []).map(normalizeText);
  if (name === q || aliases.includes(q) || short === q) return 100;
  if (name.startsWith(q) || aliases.some((a) => a.startsWith(q))) return 80;
  if (name.includes(q) || city === q || aliases.some((a) => a.includes(q))) return 60;
  const tokens = q.split(" ").filter((t) => t.length > 1);
  const hay = `${name} ${city} ${aliases.join(" ")}`;
  const hits = tokens.filter((t) => hay.includes(t)).length;
  return tokens.length > 0 && hits === tokens.length ? 40 + hits : hits > 0 ? 10 * hits : 0;
}

export function searchTeams(query: string, limit = 6): Team[] {
  const ranked: TeamMatch[] = TEAMS.map((team) => ({ team, score: scoreTeam(team, query) }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score || a.team.name.localeCompare(b.team.name));
  return ranked.slice(0, limit).map((m) => m.team);
}

const SEPARATOR = /\s+(?:vs\.?|v\.?|contre|face\s+(?:a|à)|@|chez|-|–|—)\s+/i;

export type MatchupResolution =
  | { ok: true; fixture: Fixture }
  | { ok: false; error: string; suggestions: string[] };

/** Interprète « Lakers vs Celtics », « Monaco - Paris », « Real Madrid contre Barcelone »… */
export function resolveMatchup(query: string, now: Date = new Date()): MatchupResolution {
  const cleaned = query.replace(/\s+/g, " ").trim();
  if (cleaned.length < 3) {
    return { ok: false, error: "Indiquez deux équipes, par exemple : Lakers vs Celtics.", suggestions: [] };
  }
  const parts = cleaned.split(SEPARATOR).map((p) => p.trim()).filter(Boolean);
  if (parts.length !== 2) {
    return {
      ok: false,
      error: "Séparez les deux équipes par « vs », « contre » ou un tiret (ex. : Real Madrid vs Barcelone).",
      suggestions: searchTeams(cleaned, 4).map((t) => t.name),
    };
  }
  const [homeQuery, awayQuery] = parts;
  const homeCandidates = searchTeams(homeQuery, 4);
  const awayCandidates = searchTeams(awayQuery, 4);
  if (homeCandidates.length === 0 || awayCandidates.length === 0) {
    const missing = homeCandidates.length === 0 ? homeQuery : awayQuery;
    return {
      ok: false,
      error: `Équipe inconnue : « ${missing} ». Rebond couvre la NBA, l'EuroLeague et la Betclic Élite.`,
      suggestions: searchTeams(missing, 4).map((t) => t.name),
    };
  }

  const today = getDayFixtures(now);
  // 1. Un match du jour oppose-t-il ces deux équipes ?
  for (const home of homeCandidates) {
    for (const away of awayCandidates) {
      const direct = today.find(
        (f) => (f.home.id === home.id && f.away.id === away.id) || (f.home.id === away.id && f.away.id === home.id),
      );
      if (direct) return { ok: true, fixture: direct };
    }
  }
  // 2. Même ligue de préférence, dans l'ordre des candidats.
  for (const home of homeCandidates) {
    const away = awayCandidates.find((a) => a.league === home.league && a.id !== home.id);
    if (away) return { ok: true, fixture: buildCustomFixture(home, away, sportsDayKey(now), now) };
  }
  const home = homeCandidates[0];
  const away = awayCandidates.find((a) => a.id !== home.id);
  if (!away) {
    return { ok: false, error: "Les deux équipes doivent être différentes.", suggestions: [] };
  }
  return { ok: true, fixture: buildCustomFixture(home, away, sportsDayKey(now), now) };
}

export function leagueLabel(league: LeagueId): string {
  return LEAGUES[league].name;
}

export function fixtureHash(fixture: Fixture): number {
  return hashString(fixture.id);
}
