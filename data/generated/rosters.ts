import type { ID, Position } from "@/types";
import { slugify } from "@/lib/utils";
import { featuredPlayers, type PlayerRole, type PlayerSeed } from "../players";
import { teamSeeds, type TeamSeed } from "../teams";
import { europeanImports, nbaImports, poolFor } from "./names";
import { Rng } from "./rng";

interface SlotPlan {
  size: number;
  minutes: number[];
  pointsPerMinute: number;
  positions: Position[];
}

const NBA_PLAN: SlotPlan = {
  size: 13,
  minutes: [35, 34, 32, 30, 28, 24, 20, 16, 10, 6, 3, 1, 1],
  pointsPerMinute: 0.48,
  positions: ["PG", "SG", "SF", "PF", "C", "PG", "SG", "SF", "PF", "C", "PG", "SF", "C"],
};

const FIBA_PLAN: SlotPlan = {
  size: 12,
  minutes: [30, 28, 26, 24, 22, 18, 16, 14, 12, 6, 3, 1],
  pointsPerMinute: 0.425,
  positions: ["PG", "SG", "SF", "PF", "C", "PG", "SG", "SF", "PF", "C", "SG", "PF"],
};

const REB_PER_MIN: Record<Position, number> = { PG: 0.1, SG: 0.12, SF: 0.16, PF: 0.22, C: 0.3, G: 0.11, F: 0.19, "G-F": 0.14, "F-C": 0.26 };
const AST_PER_MIN: Record<Position, number> = { PG: 0.22, SG: 0.12, SF: 0.1, PF: 0.08, C: 0.07, G: 0.17, F: 0.09, "G-F": 0.11, "F-C": 0.075 };
const THREE_RATE: Record<Position, [number, number]> = { PG: [0.35, 0.55], SG: [0.4, 0.65], SF: [0.35, 0.6], PF: [0.15, 0.5], C: [0, 0.25], G: [0.35, 0.6], F: [0.25, 0.55], "G-F": [0.35, 0.6], "F-C": [0.05, 0.35] };
const HEIGHT: Record<Position, [number, number]> = { PG: [183, 193], SG: [190, 200], SF: [198, 208], PF: [203, 211], C: [208, 221], G: [186, 196], F: [200, 208], "G-F": [196, 203], "F-C": [206, 213] };

function roleFor(mpg: number, ppg: number, isNba: boolean): PlayerRole {
  const scale = isNba ? 1 : 0.72;
  if (ppg >= 20 * scale) return "star";
  if (mpg >= 26 * scale) return "starter";
  if (mpg >= 14 * scale) return "rotation";
  return "bench";
}

function pickNationality(team: TeamSeed, isNba: boolean, rng: Rng): string {
  if (team.kind === "national") return team.country;
  if (isNba) return rng.chance(0.78) ? "USA" : rng.pick(nbaImports);
  const local = team.country === "MCO" ? "FRA" : team.country === "AND" ? "ESP" : team.country;
  const r = rng.next();
  if (r < 0.45) return local;
  if (r < 0.85) return "USA";
  return rng.pick(europeanImports);
}

function nextPosition(current: PlayerSeed[], plan: SlotPlan): Position {
  const counts = new Map<Position, number>();
  for (const p of current) counts.set(p.position, (counts.get(p.position) ?? 0) + 1);
  const wanted = new Map<Position, number>();
  for (const pos of plan.positions) wanted.set(pos, (wanted.get(pos) ?? 0) + 1);
  let best: Position = "SF";
  let bestDeficit = -Infinity;
  for (const [pos, want] of wanted) {
    const deficit = want - (counts.get(pos) ?? 0);
    if (deficit > bestDeficit) {
      bestDeficit = deficit;
      best = pos;
    }
  }
  return best;
}

/**
 * Sélection nationale : les joueurs saisis à la main de cette nationalité (meilleurs d'abord),
 * complétés par des joueurs générés rattachés à la sélection.
 */
function nationalCandidates(team: TeamSeed): PlayerSeed[] {
  return featuredPlayers
    .filter((p) => p.nationality === team.country && p.international)
    .sort((a, b) => b.profile.ppg - a.profile.ppg)
    .slice(0, 12);
}

function generatePlayer(
  team: TeamSeed,
  plan: SlotPlan,
  rank: number,
  existing: PlayerSeed[],
  usedIds: Set<string>,
  usedNumbers: Set<number>,
  rng: Rng,
  isNba: boolean,
): PlayerSeed {
  const position = nextPosition(existing, plan);
  const nationality = pickNationality(team, isNba, rng);
  const pool = poolFor(nationality);
  let firstName = rng.pick(pool.first);
  let lastName = rng.pick(pool.last);
  let id = `${slugify(`${firstName} ${lastName}`)}-${team.id}`;
  let guard = 0;
  while (usedIds.has(id) && guard < 20) {
    firstName = rng.pick(pool.first);
    lastName = rng.pick(pool.last);
    id = `${slugify(`${firstName} ${lastName}`)}-${team.id}${guard > 5 ? `-${guard}` : ""}`;
    guard++;
  }
  usedIds.add(id);

  let jerseyNumber = rng.int(0, 45);
  while (usedNumbers.has(jerseyNumber)) jerseyNumber = rng.int(0, 99);
  usedNumbers.add(jerseyNumber);

  const strengthFactor = 0.85 + ((team.strength - 50) / 50) * 0.3;
  const baseMinutes = plan.minutes[Math.min(rank, plan.minutes.length - 1)];
  const mpg = Math.max(1, Math.round(baseMinutes * rng.float(0.9, 1.1) * 10) / 10);
  const ppg = Math.round(mpg * plan.pointsPerMinute * strengthFactor * rng.float(0.75, 1.25) * 10) / 10;
  const rpg = Math.round(mpg * REB_PER_MIN[position] * rng.float(0.8, 1.2) * 10) / 10;
  const apg = Math.round(mpg * AST_PER_MIN[position] * rng.float(0.8, 1.2) * 10) / 10;
  const [threeMin, threeMax] = THREE_RATE[position];
  const [hMin, hMax] = HEIGHT[position];
  const heightCm = rng.int(hMin, hMax);
  const weightKg = Math.round(heightCm * 0.52 - 10 + rng.int(-6, 8));
  const birthYear = rng.int(1994, 2005);
  const birthDate = `${birthYear}-${String(rng.int(1, 12)).padStart(2, "0")}-${String(rng.int(1, 28)).padStart(2, "0")}`;

  return {
    id,
    firstName,
    lastName,
    teamId: team.id,
    jerseyNumber,
    position,
    heightCm,
    weightKg,
    birthDate,
    nationality,
    international: team.kind === "national" ? true : rng.chance(0.5),
    isFeatured: false,
    profile: {
      role: roleFor(mpg, ppg, isNba),
      ppg,
      rpg,
      apg,
      mpg,
      threeRate: Math.round(rng.float(threeMin, threeMax) * 100) / 100,
    },
  };
}

/** Effectif complet d'une équipe : joueurs saisis à la main + compléments générés. */
export function buildRoster(team: TeamSeed): PlayerSeed[] {
  const isNba = team.competitionIds.includes("nba");
  const plan = isNba ? NBA_PLAN : FIBA_PLAN;
  const rng = new Rng(`roster:${team.id}`);

  const base =
    team.kind === "national"
      ? nationalCandidates(team)
      : featuredPlayers.filter((p) => p.teamId === team.id);
  const roster: PlayerSeed[] = [...base].sort((a, b) => b.profile.mpg - a.profile.mpg);

  const usedIds = new Set(roster.map((p) => p.id));
  const usedNumbers = new Set(roster.map((p) => p.jerseyNumber));

  while (roster.length < plan.size) {
    roster.push(generatePlayer(team, plan, roster.length, roster, usedIds, usedNumbers, rng, isNba));
  }
  return roster.sort((a, b) => b.profile.mpg - a.profile.mpg);
}

/** Effectifs de toutes les équipes, indexés par identifiant d'équipe. */
export function buildAllRosters(): Map<ID, PlayerSeed[]> {
  const map = new Map<ID, PlayerSeed[]>();
  for (const team of teamSeeds) map.set(team.id, buildRoster(team));
  return map;
}
