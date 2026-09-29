import type { AdvancedTeamStats, TeamBoxScore } from "@/types";

/** Estimation classique des possessions : FGA − ORB + TOV + 0,44 × FTA. */
export function estimatePossessions(box: TeamBoxScore): number {
  return (
    box.fieldGoals.attempted -
    box.offensiveRebounds +
    box.turnovers +
    0.44 * box.freeThrows.attempted
  );
}

export function effectiveFieldGoalPct(box: TeamBoxScore): number {
  if (box.fieldGoals.attempted === 0) return 0;
  return (box.fieldGoals.made + 0.5 * box.threePointers.made) / box.fieldGoals.attempted;
}

export function trueShootingPct(points: number, fga: number, fta: number): number {
  const denominator = 2 * (fga + 0.44 * fta);
  return denominator === 0 ? 0 : points / denominator;
}

export function safeRatio(num: number, den: number): number {
  return den === 0 ? 0 : num / den;
}

/**
 * Calcule les stats avancées des deux équipes d'un match.
 * @param elapsedMinutes minutes déjà jouées (durée réglementaire si le match est terminé)
 * @param gameMinutes durée réglementaire (48 NBA / 40 FIBA)
 */
export function computeAdvancedStats(
  home: TeamBoxScore,
  away: TeamBoxScore,
  elapsedMinutes: number,
  gameMinutes: number,
): { home: AdvancedTeamStats; away: AdvancedTeamStats } {
  const homePoss = estimatePossessions(home);
  const awayPoss = estimatePossessions(away);
  // Les deux équipes ont (presque) le même nombre de possessions : on lisse.
  const poss = Math.max(1, (homePoss + awayPoss) / 2);
  const minutes = Math.max(1, elapsedMinutes);

  const build = (own: TeamBoxScore, opp: TeamBoxScore): AdvancedTeamStats => {
    const ortg = (100 * own.points) / poss;
    const drtg = (100 * opp.points) / poss;
    return {
      teamId: own.teamId,
      possessions: round1(poss),
      pace: round1((poss * gameMinutes) / minutes),
      offensiveRating: round1(ortg),
      defensiveRating: round1(drtg),
      netRating: round1(ortg - drtg),
      effectiveFieldGoalPct: round3(effectiveFieldGoalPct(own)),
      trueShootingPct: round3(
        trueShootingPct(own.points, own.fieldGoals.attempted, own.freeThrows.attempted),
      ),
      turnoverPct: round1((100 * own.turnovers) / poss),
      offensiveReboundPct: round3(
        safeRatio(own.offensiveRebounds, own.offensiveRebounds + opp.defensiveRebounds),
      ),
      freeThrowRate: round3(safeRatio(own.freeThrows.attempted, own.fieldGoals.attempted)),
      assistPct: round3(safeRatio(own.assists, own.fieldGoals.made)),
      threePointRate: round3(safeRatio(own.threePointers.attempted, own.fieldGoals.attempted)),
    };
  };

  return { home: build(home, away), away: build(away, home) };
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
