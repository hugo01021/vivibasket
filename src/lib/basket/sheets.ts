import { createRng } from "./rng";
import { LEAGUES } from "./teams";
import type { Injury, Team, TeamSheet } from "./types";

const ROLES = ["Meneur titulaire", "Arrière titulaire", "Ailier titulaire", "Ailier fort titulaire", "Pivot titulaire", "Sixième homme", "Meneur remplaçant", "Intérieur remplaçant"];
const ISSUES: Array<[string, Injury["status"], Injury["impact"]]> = [
  ["entorse de la cheville", "incertain", "modéré"],
  ["gêne aux ischio-jambiers", "absent", "modéré"],
  ["gestion de la charge", "ménagé", "faible"],
  ["commotion (protocole)", "absent", "fort"],
  ["douleur au genou", "incertain", "modéré"],
  ["fracture d'un doigt", "absent", "modéré"],
  ["maladie", "incertain", "faible"],
  ["lombalgie", "ménagé", "faible"],
  ["opération du ménisque", "absent", "fort"],
];

/** Semaine ISO approximative pour stabiliser les fiches sur plusieurs jours. */
function weekKey(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d);
  return `${y}-w${Math.floor(t / (7 * 86_400_000))}`;
}

function seasonGames(dateKey: string, league: Team["league"]): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = Date.UTC(y, m - 1, d);
  const seasonStartYear = m >= 9 ? y : y - 1;
  const start = Date.UTC(seasonStartYear, 9, 10);
  const days = Math.max(0, Math.floor((date - start) / 86_400_000));
  const perWeek = league === "nba" ? 3.4 : league === "euroleague" ? 2 : 1;
  return Math.max(4, Math.min(league === "nba" ? 82 : 34, Math.round((days / 7) * perWeek) + 4));
}

/** Fiche de forme fictive mais déterministe d'une équipe pour une journée donnée. */
export function getTeamSheet(team: Team, dateKey: string): TeamSheet {
  const league = LEAGUES[team.league];
  const rng = createRng(`${team.id}:${weekKey(dateKey)}:sheet`);
  const strength = team.off - team.def; // net rating
  const winProb = Math.min(0.85, Math.max(0.15, 0.5 + strength / 28));

  const form: Array<"V" | "D"> = Array.from({ length: 5 }, () => (rng.chance(winProb) ? "V" : "D"));

  const games = seasonGames(dateKey, team.league);
  const homeGames = Math.round(games / 2);
  const awayGames = games - homeGames;
  const homeWins = Math.round(homeGames * Math.min(0.92, winProb + 0.08) + rng.gauss(0, 0.6));
  const awayWins = Math.round(awayGames * Math.max(0.08, winProb - 0.08) + rng.gauss(0, 0.6));

  const restDays = team.league === "nba" ? rng.pick([1, 1, 2, 2, 3, 4]) : rng.pick([2, 3, 3, 4, 5, 7]);
  const backToBack = restDays === 1;

  const injuryCount = rng.pick([0, 0, 0, 1, 1, 2]);
  const roles = rng.shuffle(ROLES);
  const injuries: Injury[] = Array.from({ length: injuryCount }, (_, i) => {
    const [issue, status, impact] = rng.pick(ISSUES);
    return { role: roles[i], issue, status, impact };
  });

  const noise = () => rng.gauss(0, 1);
  const efg = 0.54 + (team.off - league.avgRating) / 400 + noise() * 0.008;
  return {
    teamId: team.id,
    form,
    homeRecord: { wins: clampInt(homeWins, 0, homeGames), losses: clampInt(homeGames - homeWins, 0, homeGames) },
    awayRecord: { wins: clampInt(awayWins, 0, awayGames), losses: clampInt(awayGames - awayWins, 0, awayGames) },
    restDays,
    backToBack,
    injuries,
    off: round1(team.off + noise() * 0.6),
    def: round1(team.def + noise() * 0.6),
    pace: round1(team.pace + noise() * 0.4),
    efg: round3(efg),
    tov: round3(0.13 - (team.off - league.avgRating) / 900 + noise() * 0.004),
    orb: round3(0.27 + (team.def < league.avgRating ? 0.01 : -0.01) + noise() * 0.01),
    ftr: round3(0.24 + noise() * 0.02),
    threePct: round3(0.355 + (team.off - league.avgRating) / 500 + noise() * 0.008),
    benchPoints: round1(team.league === "nba" ? 34 + noise() * 4 : 24 + noise() * 3),
    clutchNet: round1(strength / 2 + noise() * 3),
  };
}

function clampInt(v: number, min: number, max: number): number {
  return Math.round(Math.min(max, Math.max(min, v)));
}
function round1(v: number): number {
  return Math.round(v * 10) / 10;
}
function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}
