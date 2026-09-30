import { Rng } from "@/data/generated/rng";
import { HOME_TEAMS, TODAY_MATCHES, type HomeCompetitionId, type HomeTeam } from "@/data/matches";
import { normalizeForSearch } from "@/lib/utils";

/**
 * Analyse fictive d'une affiche pour l'accueil. Déterministe : la même affiche
 * donne toujours le même résultat (pas d'écart entre deux clics ni entre serveur et client).
 * À remplacer par l'appel à la vraie API d'analyse.
 */

export type Result = "V" | "D";

export interface HeadToHeadGame {
  date: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
}

export interface InjuredPlayer {
  name: string;
  position: string;
  injury: string;
  status: "Absent" | "Incertain";
}

export interface TeamAnalysis {
  team: HomeTeam;
  winProb: number;
  /** 5 derniers matchs, du plus ancien au plus récent. */
  form: Result[];
  /** Bilan à domicile pour l'équipe qui reçoit, à l'extérieur pour l'autre. */
  venueRecord: { wins: number; losses: number };
  pointsFor: number;
  pointsAgainst: number;
  injuries: InjuredPlayer[];
}

export interface MatchAnalysis {
  competition: HomeCompetitionId;
  home: TeamAnalysis;
  away: TeamAnalysis;
  headToHead: HeadToHeadGame[];
}

export function findTeam(name: string): HomeTeam | undefined {
  const key = normalizeForSearch(name.trim());
  return HOME_TEAMS.find((t) => normalizeForSearch(t.name) === key);
}

/** Compétition commune aux deux équipes, sinon celle de l'équipe qui reçoit. */
function sharedCompetition(home: HomeTeam, away: HomeTeam): HomeCompetitionId {
  return home.competitions.find((c) => away.competitions.includes(c)) ?? home.competitions[0];
}

const FIRST_INITIALS = ["J.", "M.", "T.", "A.", "K.", "D.", "L.", "S.", "N.", "R."];
const LAST_NAMES = ["Moreau", "Diallo", "Petrović", "Johnson", "Okafor", "Lindqvist", "Ruiz", "Bertrand", "Kovač", "Mensah", "Walker", "Fontaine"];
const POSITIONS = ["Meneur", "Arrière", "Ailier", "Ailier fort", "Pivot"];
const INJURIES = ["Genou", "Cheville", "Ischio-jambiers", "Dos", "Mollet", "Épaule", "Commotion"];

function injuries(rng: Rng): InjuredPlayer[] {
  const count = rng.pick([0, 1, 1, 1, 2, 2, 3]);
  return Array.from({ length: count }, () => ({
    name: `${rng.pick(FIRST_INITIALS)} ${rng.pick(LAST_NAMES)}`,
    position: rng.pick(POSITIONS),
    injury: rng.pick(INJURIES),
    status: rng.chance(0.55) ? "Absent" : "Incertain",
  }));
}

function form(rng: Rng, strength: number): Result[] {
  return Array.from({ length: 5 }, () => (rng.chance(strength) ? "V" : "D"));
}

function isoDaysAgo(days: number): string {
  const d = new Date(Date.UTC(2026, 8, 30));
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export function analyzeMatch(homeTeam: HomeTeam, awayTeam: HomeTeam): MatchAnalysis {
  const competition = sharedCompetition(homeTeam, awayTeam);
  const rng = new Rng(`${homeTeam.name}|${awayTeam.name}`);

  // Probabilité : celle du programme du jour si l'affiche y figure, sinon tirée (avantage du terrain).
  const scheduled = TODAY_MATCHES.find((m) => m.home === homeTeam.name && m.away === awayTeam.name);
  const homeWinProb = scheduled?.homeWinProb ?? Math.round(Math.min(82, Math.max(22, rng.normal(55, 13))));
  const p = homeWinProb / 100;

  const base = competition === "nba" ? 114 : 82;
  const spread = competition === "nba" ? 5 : 4;
  const edge = (p - 0.5) * (competition === "nba" ? 14 : 10);
  const round1 = (x: number) => Math.round(x * 10) / 10;

  const venueGames = rng.int(8, 16);
  const homeVenueWins = Math.round(venueGames * Math.min(0.9, Math.max(0.15, p + 0.08 + rng.float(-0.1, 0.1))));
  const awayVenueGames = rng.int(8, 16);
  const awayVenueWins = Math.round(awayVenueGames * Math.min(0.85, Math.max(0.1, 1 - p - 0.08 + rng.float(-0.1, 0.1))));

  const headToHead: HeadToHeadGame[] = Array.from({ length: 5 }, (_, i) => {
    const atHome = i % 2 === 0;
    const hostWins = rng.chance(atHome ? p + 0.05 : 1 - p + 0.05);
    const winner = Math.round(rng.normal(base + 4, spread));
    const loser = winner - rng.int(1, competition === "nba" ? 18 : 14);
    return {
      date: isoDaysAgo(40 + i * rng.int(90, 150)),
      home: atHome ? homeTeam.name : awayTeam.name,
      away: atHome ? awayTeam.name : homeTeam.name,
      homeScore: hostWins ? winner : loser,
      awayScore: hostWins ? loser : winner,
    };
  });

  return {
    competition,
    home: {
      team: homeTeam,
      winProb: homeWinProb,
      form: form(rng, Math.min(0.85, p + 0.05)),
      venueRecord: { wins: homeVenueWins, losses: venueGames - homeVenueWins },
      pointsFor: round1(base + edge + rng.normal(0, spread / 2)),
      pointsAgainst: round1(base - edge + rng.normal(0, spread / 2)),
      injuries: injuries(rng),
    },
    away: {
      team: awayTeam,
      winProb: 100 - homeWinProb,
      form: form(rng, Math.min(0.85, 1 - p + 0.05)),
      venueRecord: { wins: awayVenueWins, losses: awayVenueGames - awayVenueWins },
      pointsFor: round1(base - edge + rng.normal(0, spread / 2)),
      pointsAgainst: round1(base + edge + rng.normal(0, spread / 2)),
      injuries: injuries(rng),
    },
    headToHead,
  };
}
