import type { Competition, MatchClock, PeriodScore, TeamBoxScore } from "@/types";
import { Rng } from "./rng";

export const PERIOD_MINUTES = { 48: 12, 40: 10 } as const;
export const OVERTIME_MINUTES = 5;

export function periodLabel(period: number, regulation: number): string {
  if (period <= regulation) return `Q${period}`;
  const ot = period - regulation;
  return ot === 1 ? "OT" : `OT${ot}`;
}

/** Score final complet (par période) simulé à partir des indices de force. */
export function simulatePeriods(
  competition: Competition,
  homeStrength: number,
  awayStrength: number,
  rng: Rng,
): PeriodScore[] {
  const isNba = competition.gameMinutes === 48;
  const basePoints = isNba ? 113 : 82;
  const homeAdvantage = isNba ? 2.5 : 3.5;
  const expectedMargin = (homeStrength - awayStrength) * 0.38 + homeAdvantage;
  const margin = rng.normal(expectedMargin, isNba ? 12 : 10);
  const total = rng.normal(basePoints * 2, isNba ? 16 : 12);
  let home = Math.round((total + margin) / 2);
  let away = Math.round(total - home);
  home = Math.max(isNba ? 85 : 55, home);
  away = Math.max(isNba ? 85 : 55, away);

  const regulation = competition.periods;
  const periods: PeriodScore[] = [];
  const splitPoints = (points: number): number[] => {
    const weights = Array.from({ length: regulation }, () => Math.max(0.6, 1 + rng.normal(0, 0.14)));
    const sum = weights.reduce((a, b) => a + b, 0);
    const parts = weights.map((w) => Math.round((points * w) / sum));
    const diff = points - parts.reduce((a, b) => a + b, 0);
    parts[parts.length - 1] += diff;
    return parts;
  };
  const homeParts = splitPoints(home);
  const awayParts = splitPoints(away);
  for (let p = 0; p < regulation; p++) {
    periods.push({ period: p + 1, label: periodLabel(p + 1, regulation), home: homeParts[p], away: awayParts[p] });
  }

  // Prolongation(s) en cas d'égalité
  let period = regulation;
  while (home === away) {
    period += 1;
    const otHome = rng.int(6, 15);
    let otAway = rng.int(6, 15);
    if (otHome === otAway) otAway += rng.chance(0.5) ? 1 : -1;
    periods.push({ period, label: periodLabel(period, regulation), home: otHome, away: otAway });
    home += otHome;
    away += otAway;
  }
  return periods;
}

/** Tronque un score complet à l'état d'un match en cours (période + chrono). */
export function truncatePeriods(
  periods: PeriodScore[],
  competition: Competition,
  clock: Pick<MatchClock, "period" | "timeRemaining">,
): PeriodScore[] {
  const regulation = competition.periods;
  const periodMinutes = PERIOD_MINUTES[competition.gameMinutes];
  const [mm, ss] = clock.timeRemaining.split(":").map(Number);
  const result: PeriodScore[] = [];
  for (const p of periods) {
    if (p.period < clock.period) {
      result.push(p);
    } else if (p.period === clock.period) {
      const length = p.period <= regulation ? periodMinutes : OVERTIME_MINUTES;
      const remaining = mm + ss / 60;
      const share = Math.min(1, Math.max(0, (length - remaining) / length));
      result.push({ ...p, home: Math.round(p.home * share), away: Math.round(p.away * share) });
    }
  }
  return result;
}

/** Minutes de jeu écoulées pour un chrono donné. */
export function elapsedMinutes(
  competition: Competition,
  clock: Pick<MatchClock, "period" | "timeRemaining"> | undefined,
  periodsPlayed: number,
): number {
  const regulation = competition.periods;
  const periodMinutes = PERIOD_MINUTES[competition.gameMinutes];
  if (!clock) {
    const overtime = Math.max(0, periodsPlayed - regulation);
    return competition.gameMinutes + overtime * OVERTIME_MINUTES;
  }
  const [mm, ss] = clock.timeRemaining.split(":").map(Number);
  let elapsed = 0;
  for (let p = 1; p < clock.period; p++) elapsed += p <= regulation ? periodMinutes : OVERTIME_MINUTES;
  const length = clock.period <= regulation ? periodMinutes : OVERTIME_MINUTES;
  elapsed += length - (mm + ss / 60);
  return Math.max(1, elapsed);
}

export function sumPeriods(periods: PeriodScore[]): { home: number; away: number } {
  return periods.reduce(
    (acc, p) => ({ home: acc.home + p.home, away: acc.away + p.away }),
    { home: 0, away: 0 },
  );
}

interface RawTeamShooting {
  points: number;
  threeMade: number;
  threeAttempted: number;
  twoMade: number;
  twoAttempted: number;
  ftMade: number;
  ftAttempted: number;
  possessions: number;
}

function shooting(points: number, isNba: boolean, share: number, rng: Rng): RawTeamShooting {
  const possessions = (isNba ? 99 : 71) * share * rng.float(0.94, 1.06);
  let ftAttempted = Math.round(points * rng.float(0.2, 0.28));
  let ftMade = Math.round(ftAttempted * rng.float(0.7, 0.85));
  const threeAttempted = Math.max(1, Math.round(possessions * (isNba ? rng.float(0.3, 0.42) : rng.float(0.28, 0.38))));
  let threeMade = Math.round(threeAttempted * rng.float(0.28, 0.44));

  let remaining = points - ftMade - 3 * threeMade;
  while (remaining < 0 && threeMade > 0) {
    threeMade -= 1;
    remaining += 3;
  }
  while (remaining < 0 && ftMade > 0) {
    ftMade -= 1;
    remaining += 1;
  }
  if (remaining % 2 === 1) {
    ftMade += 1;
    remaining -= 1;
  }
  if (remaining < 0) remaining = 0;
  ftAttempted = Math.max(ftAttempted, ftMade);
  const twoMade = remaining / 2;
  const twoAttempted = Math.max(twoMade, Math.round(twoMade / rng.float(0.48, 0.58)));
  return { points, threeMade, threeAttempted, twoMade, twoAttempted, ftMade, ftAttempted, possessions };
}

/** Totaux d'équipe cohérents pour les deux équipes d'un match (score exact garanti). */
export function buildTeamBoxes(
  homeTeamId: string,
  awayTeamId: string,
  periods: PeriodScore[],
  competition: Competition,
  elapsed: number,
  rng: Rng,
): { home: TeamBoxScore; away: TeamBoxScore } {
  const isNba = competition.gameMinutes === 48;
  const share = Math.min(1.4, elapsed / competition.gameMinutes);
  const { home: homePts, away: awayPts } = sumPeriods(periods);
  const h = shooting(homePts, isNba, share, rng);
  const a = shooting(awayPts, isNba, share, rng);

  const misses = (s: RawTeamShooting) => s.threeAttempted - s.threeMade + (s.twoAttempted - s.twoMade);
  const homeOrb = Math.round(misses(h) * rng.float(0.2, 0.32));
  const awayOrb = Math.round(misses(a) * rng.float(0.2, 0.32));
  const homeDrb = Math.max(0, Math.round(misses(a) * rng.float(0.68, 0.78)) + Math.round((a.ftAttempted - a.ftMade) * 0.3));
  const awayDrb = Math.max(0, Math.round(misses(h) * rng.float(0.68, 0.78)) + Math.round((h.ftAttempted - h.ftMade) * 0.3));
  const homeTov = Math.round(h.possessions * rng.float(0.1, 0.16));
  const awayTov = Math.round(a.possessions * rng.float(0.1, 0.16));

  let maxHomeLead = 0;
  let maxAwayLead = 0;
  let runningHome = 0;
  let runningAway = 0;
  for (const p of periods) {
    runningHome += p.home;
    runningAway += p.away;
    maxHomeLead = Math.max(maxHomeLead, runningHome - runningAway);
    maxAwayLead = Math.max(maxAwayLead, runningAway - runningHome);
  }

  const build = (
    teamId: string,
    s: RawTeamShooting,
    orb: number,
    drb: number,
    tov: number,
    oppTov: number,
    maxLead: number,
  ): TeamBoxScore => ({
    teamId,
    points: s.points,
    fieldGoals: { made: s.twoMade + s.threeMade, attempted: s.twoAttempted + s.threeAttempted },
    threePointers: { made: s.threeMade, attempted: s.threeAttempted },
    freeThrows: { made: s.ftMade, attempted: s.ftAttempted },
    rebounds: orb + drb,
    offensiveRebounds: orb,
    defensiveRebounds: drb,
    assists: Math.round((s.twoMade + s.threeMade) * rng.float(0.52, 0.68)),
    steals: Math.min(oppTov, Math.round(share * rng.float(5, 10))),
    blocks: Math.round(share * rng.float(2.5, 6.5)),
    turnovers: tov,
    fouls: Math.round(share * rng.float(16, 22)),
    pointsInPaint: 2 * Math.round(s.twoMade * rng.float(0.55, 0.75)),
    fastBreakPoints: Math.round(s.points * rng.float(0.08, 0.16)),
    secondChancePoints: Math.round(orb * rng.float(0.9, 1.3)),
    benchPoints: 0, // renseigné après la répartition par joueur
    pointsOffTurnovers: Math.round(oppTov * rng.float(1.0, 1.4)),
    biggestLead: Math.max(0, maxLead + (maxLead > 0 ? rng.int(0, 5) : 0)),
    timeoutsRemaining: rng.int(0, isNba ? 6 : 3),
  });

  return {
    home: build(homeTeamId, h, homeOrb, homeDrb, homeTov, awayTov, maxHomeLead),
    away: build(awayTeamId, a, awayOrb, awayDrb, awayTov, homeTov, maxAwayLead),
  };
}
