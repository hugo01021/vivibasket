import type { PlayerBoxScoreLine, Position, TeamBoxScore } from "@/types";
import type { PlayerSeed } from "../players";
import { distribute, Rng } from "./rng";

const STEAL_FACTOR: Record<Position, number> = { PG: 1.4, SG: 1.2, SF: 1.0, PF: 0.7, C: 0.5, G: 1.3, F: 0.85, "G-F": 1.1, "F-C": 0.6 };
const BLOCK_FACTOR: Record<Position, number> = { PG: 0.2, SG: 0.3, SF: 0.5, PF: 1.0, C: 1.8, G: 0.25, F: 0.75, "G-F": 0.4, "F-C": 1.4 };

/** Répartit les minutes de l'équipe entre les joueurs selon leur temps de jeu habituel. */
function distributeMinutes(roster: PlayerSeed[], elapsed: number, rng: Rng): number[] {
  const total = elapsed * 5;
  const weights = roster.map((p) => Math.max(0.2, p.profile.mpg * rng.float(0.85, 1.15)));
  const sum = weights.reduce((a, b) => a + b, 0);
  const minutes = weights.map((w) => Math.min(elapsed, (total * w) / sum));
  // Ajuste pour que la somme fasse exactement 5 × minutes écoulées
  for (let iteration = 0; iteration < 4; iteration++) {
    const current = minutes.reduce((a, b) => a + b, 0);
    const diff = total - current;
    if (Math.abs(diff) < 0.05) break;
    const room = minutes.map((m) => (diff > 0 ? elapsed - m : m));
    const roomSum = room.reduce((a, b) => a + b, 0);
    if (roomSum <= 0) break;
    for (let i = 0; i < minutes.length; i++) minutes[i] += (diff * room[i]) / roomSum;
  }
  return minutes.map((m) => Math.round(Math.max(0, m) * 10) / 10);
}

/**
 * Box score individuel dérivé des totaux d'équipe : les compteurs sont répartis
 * entre joueurs (les sommes correspondent exactement au box score d'équipe).
 */
export function buildPlayerBoxes(
  teamBox: TeamBoxScore,
  roster: PlayerSeed[],
  elapsed: number,
  margin: number,
  isNba: boolean,
  live: boolean,
  rng: Rng,
): PlayerBoxScoreLine[] {
  const minutes = distributeMinutes(roster, elapsed, rng);
  const starters = roster
    .map((p, i) => ({ i, mpg: p.profile.mpg }))
    .sort((a, b) => b.mpg - a.mpg)
    .slice(0, 5)
    .map((s) => s.i);
  const starterSet = new Set(starters);

  const usage = roster.map((p, i) => (p.profile.ppg / Math.max(1, p.profile.mpg)) * minutes[i]);
  const threeWeights = roster.map((p, i) => usage[i] * p.profile.threeRate);
  const twoWeights = roster.map((p, i) => usage[i] * (1 - p.profile.threeRate));
  const ftWeights = roster.map((p, i) => usage[i] * (1 - 0.5 * p.profile.threeRate));
  const rebWeights = roster.map((p, i) => (p.profile.rpg / Math.max(1, p.profile.mpg)) * minutes[i]);
  const astWeights = roster.map((p, i) => (p.profile.apg / Math.max(1, p.profile.mpg)) * minutes[i]);
  const stlWeights = roster.map((p, i) => STEAL_FACTOR[p.position] * minutes[i]);
  const blkWeights = roster.map((p, i) => BLOCK_FACTOR[p.position] * minutes[i]);
  const tovWeights = roster.map((p, i) => usage[i] * 0.7 + astWeights[i] * 0.5);
  const foulWeights = roster.map((p, i) => minutes[i] * (BLOCK_FACTOR[p.position] * 0.3 + 0.7));

  const twoMadeTotal = teamBox.fieldGoals.made - teamBox.threePointers.made;
  const twoAttTotal = teamBox.fieldGoals.attempted - teamBox.threePointers.attempted;

  const threeMade = distribute(teamBox.threePointers.made, threeWeights, rng);
  const threeMiss = distribute(teamBox.threePointers.attempted - teamBox.threePointers.made, threeWeights, rng);
  const twoMade = distribute(twoMadeTotal, twoWeights, rng);
  const twoMiss = distribute(twoAttTotal - twoMadeTotal, twoWeights, rng);
  const ftMade = distribute(teamBox.freeThrows.made, ftWeights, rng);
  const ftMiss = distribute(teamBox.freeThrows.attempted - teamBox.freeThrows.made, ftWeights, rng);
  const orb = distribute(teamBox.offensiveRebounds, rebWeights, rng, 0.4);
  const drb = distribute(teamBox.defensiveRebounds, rebWeights, rng, 0.3);
  const ast = distribute(teamBox.assists, astWeights, rng, 0.3);
  const stl = distribute(teamBox.steals, stlWeights, rng, 0.5);
  const blk = distribute(teamBox.blocks, blkWeights, rng, 0.5);
  const tov = distribute(teamBox.turnovers, tovWeights, rng, 0.4);
  const fouls = distribute(teamBox.fouls, foulWeights, rng, 0.4);

  // Plafond de fautes (5 FIBA / 6 NBA) : l'excédent est reporté sur d'autres joueurs
  const foulCap = isNba ? 6 : 5;
  for (let i = 0; i < fouls.length; i++) {
    while (fouls[i] > foulCap) {
      fouls[i] -= 1;
      const j = rng.weightedIndex(fouls.map((f, k) => (f < foulCap && minutes[k] > 0 ? 1 : 0)));
      if (fouls[j] < foulCap) fouls[j] += 1;
      else break;
    }
  }

  const lines: PlayerBoxScoreLine[] = roster.map((player, i) => {
    const played = minutes[i] > 0;
    const points = 2 * twoMade[i] + 3 * threeMade[i] + ftMade[i];
    const fga = twoMade[i] + twoMiss[i] + threeMade[i] + threeMiss[i];
    const fgm = twoMade[i] + threeMade[i];
    const fta = ftMade[i] + ftMiss[i];
    const rebounds = orb[i] + drb[i];
    const efficiency =
      points + rebounds + ast[i] + stl[i] + blk[i] + Math.round(fta / 2) -
      (fga - fgm + fta - ftMade[i] + tov[i] + fouls[i]);
    return {
      playerId: player.id,
      teamId: teamBox.teamId,
      starter: starterSet.has(i),
      minutes: minutes[i],
      points,
      rebounds,
      offensiveRebounds: orb[i],
      defensiveRebounds: drb[i],
      assists: ast[i],
      steals: stl[i],
      blocks: blk[i],
      turnovers: tov[i],
      fouls: fouls[i],
      fieldGoals: { made: fgm, attempted: fga },
      threePointers: { made: threeMade[i], attempted: threeMade[i] + threeMiss[i] },
      freeThrows: { made: ftMade[i], attempted: fta },
      plusMinus: played ? Math.round((margin * minutes[i]) / elapsed + rng.normal(0, 4)) : 0,
      efficiency: played ? efficiency : 0,
      onCourt: live ? starterSet.has(i) : undefined,
    };
  });

  // Un ou deux remplaçants sur le terrain pendant un direct
  if (live) {
    const onCourt = lines.filter((l) => l.onCourt);
    const bench = lines.filter((l) => !l.onCourt && l.minutes > 0);
    const swaps = Math.min(rng.int(0, 2), onCourt.length, bench.length);
    for (let s = 0; s < swaps; s++) {
      const out = onCourt[rng.int(0, onCourt.length - 1)];
      const inn = bench[rng.int(0, bench.length - 1)];
      if (out.onCourt && !inn.onCourt) {
        out.onCourt = false;
        inn.onCourt = true;
      }
    }
  }

  teamBox.benchPoints = lines.filter((l) => !l.starter).reduce((acc, l) => acc + l.points, 0);
  return lines.sort((a, b) => Number(b.starter) - Number(a.starter) || b.minutes - a.minutes);
}
