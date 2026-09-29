import type {
  AdvancedTeamStats,
  Competition,
  DayString,
  FormResult,
  ID,
  Match,
  MatchClock,
  PeriodScore,
  PlayerBoxScoreLine,
  PlayerGameLog,
  PlayerSeasonStats,
  StandingRow,
  Streak,
  TeamBoxScore,
  TeamSeasonStats,
  WinLoss,
} from "@/types";
import { computeAdvancedStats, round1, round3, safeRatio } from "@/lib/stats";
import { currentMatchDay, matchDay } from "@/lib/time";
import { clamp } from "@/lib/utils";
import { competitionById } from "../competitions";
import { featuredMatchById, featuredMatches } from "../featured-matches";
import type { PlayerSeed } from "../players";
import { scheduleSpecs } from "../schedule-specs";
import { teamById, teamSeeds, teamStrength, type TeamSeed } from "../teams";
import { buildPlayerBoxes } from "./boxscore";
import { Rng } from "./rng";
import { buildAllRosters } from "./rosters";
import { buildFixtures, type Fixture, type PinnedFixture } from "./schedule";
import {
  OVERTIME_MINUTES,
  PERIOD_MINUTES,
  buildTeamBoxes,
  elapsedMinutes,
  periodLabel,
  simulatePeriods,
  sumPeriods,
  truncatePeriods,
} from "./simulate";

export interface MatchStatsBundle {
  teamStats: { home: TeamBoxScore; away: TeamBoxScore };
  advanced: { home: AdvancedTeamStats; away: AdvancedTeamStats };
  boxScore: { home: PlayerBoxScoreLine[]; away: PlayerBoxScoreLine[] };
  elapsed: number;
}

export interface Dataset {
  referenceDay: DayString;
  builtAt: number;
  players: PlayerSeed[];
  playerById: Map<ID, PlayerSeed>;
  rosterByTeam: Map<ID, PlayerSeed[]>;
  matches: Match[];
  matchById: Map<ID, Match>;
  matchIdsByTeam: Map<ID, ID[]>;
  matchIdsByCompetition: Map<ID, ID[]>;
  matchIdsByDay: Map<DayString, ID[]>;
  stats: Map<ID, MatchStatsBundle>;
  standings: Map<ID, StandingRow[]>;
  /** clé `${teamId}:${competitionId}` */
  teamSeasonStats: Map<string, TeamSeasonStats>;
  /** clé `${playerId}:${competitionId}` */
  playerSeasonStats: Map<string, PlayerSeasonStats>;
  playerGameLogs: Map<ID, PlayerGameLog[]>;
}

export const statsKey = (a: ID, b: ID): string => `${a}:${b}`;

/** Durée réelle approximative d'un match (minutes), pour déduire l'état d'un match généré. */
const REAL_DURATION_MINUTES: Record<48 | 40, number> = { 48: 140, 40: 110 };
const DATASET_TTL_MS = 60_000;

const mmss = (minutes: number): string => {
  const total = Math.max(0, Math.round(minutes * 60));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

function deriveClock(competition: Competition, realElapsedMinutes: number): Pick<MatchClock, "period" | "timeRemaining"> {
  const fraction = clamp(realElapsedMinutes / REAL_DURATION_MINUTES[competition.gameMinutes], 0, 0.999);
  const gameElapsed = fraction * competition.gameMinutes;
  const periodMinutes = PERIOD_MINUTES[competition.gameMinutes];
  const period = Math.min(competition.periods, Math.floor(gameElapsed / periodMinutes) + 1);
  const remaining = Math.max(0, periodMinutes - (gameElapsed - (period - 1) * periodMinutes));
  return { period, timeRemaining: mmss(remaining) };
}

function toPeriodScores(pairs: Array<[number, number]>, competition: Competition): PeriodScore[] {
  return pairs.map(([home, away], i) => ({
    period: i + 1,
    label: periodLabel(i + 1, competition.periods),
    home,
    away,
  }));
}

function attendanceFor(competition: Competition, rng: Rng): number {
  if (competition.id === "nba") return rng.int(15200, 20500);
  if (competition.id === "euroleague") return rng.int(5500, 15500);
  return rng.int(3000, 9000);
}

function buildMatch(fixture: Fixture, now: Date, homeSeed: TeamSeed): Match {
  const competition = competitionById.get(fixture.competitionId);
  if (!competition) throw new Error(`Compétition inconnue : ${fixture.competitionId}`);
  const rng = new Rng(`match:${fixture.id}`);
  const featured = featuredMatchById.get(fixture.id);
  const base: Match = {
    id: fixture.id,
    competitionId: competition.id,
    season: competition.season,
    stage: fixture.stage,
    round: fixture.round,
    date: fixture.date,
    status: "scheduled",
    homeTeamId: fixture.homeTeamId,
    awayTeamId: fixture.awayTeamId,
    homeScore: 0,
    awayScore: 0,
    periods: [],
    venue: homeSeed.arena,
    broadcast: featured?.broadcast,
  };

  if (featured) {
    if (featured.status === "scheduled") return base;
    const periods = toPeriodScores(featured.periods ?? [], competition);
    const { home, away } = sumPeriods(periods);
    const attendance = featured.attendance ?? attendanceFor(competition, rng);
    if (featured.status === "finished") {
      return { ...base, status: "finished", periods, homeScore: home, awayScore: away, attendance };
    }
    const clock = featured.clock ?? { period: periods.length, timeRemaining: "05:00" };
    return {
      ...base,
      status: "live",
      periods,
      homeScore: home,
      awayScore: away,
      attendance,
      clock: { ...clock, periodLabel: periodLabel(clock.period, competition.periods), running: true },
    };
  }

  const minutesSinceTipOff = (now.getTime() - new Date(fixture.date).getTime()) / 60_000;
  if (minutesSinceTipOff < 0) return base;

  const full = simulatePeriods(
    competition,
    teamStrength[fixture.homeTeamId] ?? 65,
    teamStrength[fixture.awayTeamId] ?? 65,
    rng.child("score"),
  );
  const attendance = attendanceFor(competition, rng.child("attendance"));

  if (minutesSinceTipOff >= REAL_DURATION_MINUTES[competition.gameMinutes]) {
    const { home, away } = sumPeriods(full);
    return { ...base, status: "finished", periods: full, homeScore: home, awayScore: away, attendance };
  }

  const clock = deriveClock(competition, minutesSinceTipOff);
  const periodMinutes = PERIOD_MINUTES[competition.gameMinutes];
  const halftime = clock.period === competition.periods / 2 + 1 && clock.timeRemaining === mmss(periodMinutes);
  const effectiveClock = halftime ? { period: competition.periods / 2, timeRemaining: "00:00" } : clock;
  const periods = truncatePeriods(full, competition, effectiveClock);
  const { home, away } = sumPeriods(periods);
  return {
    ...base,
    status: halftime ? "halftime" : "live",
    periods,
    homeScore: home,
    awayScore: away,
    attendance,
    clock: {
      ...effectiveClock,
      periodLabel: periodLabel(effectiveClock.period, competition.periods),
      running: !halftime,
    },
  };
}

function buildStatsBundle(match: Match, rosterByTeam: Map<ID, PlayerSeed[]>): MatchStatsBundle {
  const competition = competitionById.get(match.competitionId)!;
  const rng = new Rng(`stats:${match.id}:${match.homeScore}:${match.awayScore}:${match.periods.length}`);
  const elapsed = elapsedMinutes(competition, match.clock, match.periods.length);
  const isNba = competition.gameMinutes === 48;
  const live = match.status === "live" || match.status === "halftime";
  const teamStats = buildTeamBoxes(match.homeTeamId, match.awayTeamId, match.periods, competition, elapsed, rng.child("teams"));
  const margin = match.homeScore - match.awayScore;
  const boxScore = {
    home: buildPlayerBoxes(teamStats.home, rosterByTeam.get(match.homeTeamId) ?? [], elapsed, margin, isNba, live, rng.child("home")),
    away: buildPlayerBoxes(teamStats.away, rosterByTeam.get(match.awayTeamId) ?? [], elapsed, -margin, isNba, live, rng.child("away")),
  };
  const advanced = computeAdvancedStats(teamStats.home, teamStats.away, elapsed, competition.gameMinutes);
  return { teamStats, advanced, boxScore, elapsed };
}

function streakOf(results: FormResult[]): Streak {
  if (results.length === 0) return { type: "W", count: 0 };
  const last = results[results.length - 1];
  let count = 0;
  for (let i = results.length - 1; i >= 0 && results[i] === last; i--) count++;
  return { type: last, count };
}

function formScore(results: FormResult[], margins: number[]): number {
  if (results.length === 0) return 5;
  const last = results.slice(-5);
  const lastMargins = margins.slice(-5);
  const winRate = last.filter((r) => r === "W").length / last.length;
  const avgMargin = lastMargins.reduce((a, b) => a + b, 0) / lastMargins.length;
  const score = 6 * winRate + 2 + 2 * clamp(avgMargin / 15, -1, 1);
  return Math.round(clamp(score, 0, 10) * 10) / 10;
}

interface TeamAccumulator {
  results: FormResult[];
  margins: number[];
  home: WinLoss;
  away: WinLoss;
  pointsFor: number;
  pointsAgainst: number;
  ortg: number[];
  drtg: number[];
  pace: number[];
  fgm: number; fga: number; tpm: number; tpa: number; ftm: number; fta: number;
  reb: number; ast: number; tov: number; stl: number; blk: number;
}

function newAccumulator(): TeamAccumulator {
  return {
    results: [], margins: [], home: { wins: 0, losses: 0 }, away: { wins: 0, losses: 0 },
    pointsFor: 0, pointsAgainst: 0, ortg: [], drtg: [], pace: [],
    fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, reb: 0, ast: 0, tov: 0, stl: 0, blk: 0,
  };
}

function buildDataset(now: Date): Dataset {
  const referenceDay = currentMatchDay(now);
  const rosterByTeam = buildAllRosters();
  const playerById = new Map<ID, PlayerSeed>();
  for (const roster of rosterByTeam.values()) for (const p of roster) playerById.set(p.id, p);
  const players = [...playerById.values()];

  const teamsByCompetition = new Map<ID, TeamSeed[]>();
  for (const team of teamSeeds) {
    for (const competitionId of team.competitionIds) {
      teamsByCompetition.set(competitionId, [...(teamsByCompetition.get(competitionId) ?? []), team]);
    }
  }
  const pinned: PinnedFixture[] = featuredMatches.map((f) => ({
    id: f.id,
    competitionId: f.competitionId,
    homeTeamId: f.homeTeamId,
    awayTeamId: f.awayTeamId,
    dayOffset: f.dayOffset,
    time: f.time,
    round: f.round,
  }));
  const fixtures = buildFixtures(referenceDay, scheduleSpecs, pinned, teamsByCompetition);

  const seedById = new Map(teamSeeds.map((t) => [t.id, t]));
  const matches = fixtures.map((f) => buildMatch(f, now, seedById.get(f.homeTeamId)!));
  const matchById = new Map(matches.map((m) => [m.id, m]));

  const matchIdsByTeam = new Map<ID, ID[]>();
  const matchIdsByCompetition = new Map<ID, ID[]>();
  const matchIdsByDay = new Map<DayString, ID[]>();
  const push = (map: Map<string, ID[]>, key: string, id: ID) => map.set(key, [...(map.get(key) ?? []), id]);
  for (const m of matches) {
    push(matchIdsByTeam, m.homeTeamId, m.id);
    push(matchIdsByTeam, m.awayTeamId, m.id);
    push(matchIdsByCompetition, m.competitionId, m.id);
    push(matchIdsByDay, matchDay(m.date), m.id);
  }

  const stats = new Map<ID, MatchStatsBundle>();
  for (const m of matches) {
    if (m.status === "scheduled") continue;
    stats.set(m.id, buildStatsBundle(m, rosterByTeam));
  }

  // --- Classements et stats saison des équipes
  const standings = new Map<ID, StandingRow[]>();
  const teamSeasonStats = new Map<string, TeamSeasonStats>();
  for (const [competitionId, teams] of teamsByCompetition) {
    const competition = competitionById.get(competitionId)!;
    const finished = (matchIdsByCompetition.get(competitionId) ?? [])
      .map((id) => matchById.get(id)!)
      .filter((m) => m.status === "finished")
      .sort((a, b) => a.date.localeCompare(b.date));

    const acc = new Map<ID, TeamAccumulator>(teams.map((t) => [t.id, newAccumulator()]));
    for (const m of finished) {
      const bundle = stats.get(m.id)!;
      const sides = [
        { id: m.homeTeamId, pts: m.homeScore, opp: m.awayScore, box: bundle.teamStats.home, adv: bundle.advanced.home, isHome: true },
        { id: m.awayTeamId, pts: m.awayScore, opp: m.homeScore, box: bundle.teamStats.away, adv: bundle.advanced.away, isHome: false },
      ];
      for (const s of sides) {
        const a = acc.get(s.id);
        if (!a) continue;
        const won = s.pts > s.opp;
        a.results.push(won ? "W" : "L");
        a.margins.push(s.pts - s.opp);
        const record = s.isHome ? a.home : a.away;
        if (won) record.wins++;
        else record.losses++;
        a.pointsFor += s.pts;
        a.pointsAgainst += s.opp;
        a.ortg.push(s.adv.offensiveRating);
        a.drtg.push(s.adv.defensiveRating);
        a.pace.push(s.adv.pace);
        a.fgm += s.box.fieldGoals.made; a.fga += s.box.fieldGoals.attempted;
        a.tpm += s.box.threePointers.made; a.tpa += s.box.threePointers.attempted;
        a.ftm += s.box.freeThrows.made; a.fta += s.box.freeThrows.attempted;
        a.reb += s.box.rebounds; a.ast += s.box.assists; a.tov += s.box.turnovers;
        a.stl += s.box.steals; a.blk += s.box.blocks;
      }
    }

    const rows: StandingRow[] = [];
    for (const team of teams) {
      const a = acc.get(team.id)!;
      const gp = a.results.length;
      const wins = a.results.filter((r) => r === "W").length;
      const losses = gp - wins;
      const avg = (values: number[]) => (values.length ? values.reduce((x, y) => x + y, 0) / values.length : 0);
      const ortg = round1(avg(a.ortg));
      const drtg = round1(avg(a.drtg));
      teamSeasonStats.set(statsKey(team.id, competitionId), {
        teamId: team.id,
        competitionId,
        season: competition.season,
        gamesPlayed: gp,
        wins,
        losses,
        pointsPerGame: round1(gp ? a.pointsFor / gp : 0),
        pointsAllowedPerGame: round1(gp ? a.pointsAgainst / gp : 0),
        offensiveRating: ortg,
        defensiveRating: drtg,
        netRating: round1(ortg - drtg),
        pace: round1(avg(a.pace)),
        fieldGoalPct: round3(safeRatio(a.fgm, a.fga)),
        threePointPct: round3(safeRatio(a.tpm, a.tpa)),
        freeThrowPct: round3(safeRatio(a.ftm, a.fta)),
        effectiveFieldGoalPct: round3(safeRatio(a.fgm + 0.5 * a.tpm, a.fga)),
        trueShootingPct: round3(safeRatio(a.pointsFor, 2 * (a.fga + 0.44 * a.fta))),
        reboundsPerGame: round1(gp ? a.reb / gp : 0),
        assistsPerGame: round1(gp ? a.ast / gp : 0),
        turnoversPerGame: round1(gp ? a.tov / gp : 0),
        stealsPerGame: round1(gp ? a.stl / gp : 0),
        blocksPerGame: round1(gp ? a.blk / gp : 0),
        form: a.results.slice(-5),
        formScore: formScore(a.results, a.margins),
        homeRecord: a.home,
        awayRecord: a.away,
        streak: streakOf(a.results),
      });
      rows.push({
        competitionId,
        teamId: team.id,
        group: team.groups?.[competitionId],
        rank: 0,
        played: gp,
        wins,
        losses,
        winPct: round3(gp ? wins / gp : 0),
        pointsFor: a.pointsFor,
        pointsAgainst: a.pointsAgainst,
        pointDiff: a.pointsFor - a.pointsAgainst,
        gamesBehind: 0,
        streak: streakOf(a.results),
        last5: a.results.slice(-5),
        home: a.home,
        away: a.away,
      });
    }

    const byGroup = new Map<string, StandingRow[]>();
    for (const row of rows) byGroup.set(row.group ?? "", [...(byGroup.get(row.group ?? "") ?? []), row]);
    const ordered: StandingRow[] = [];
    for (const [, groupRows] of byGroup) {
      groupRows.sort(
        (x, y) =>
          y.winPct - x.winPct ||
          y.pointDiff - x.pointDiff ||
          (teamById.get(x.teamId)?.name ?? "").localeCompare(teamById.get(y.teamId)?.name ?? ""),
      );
      const leader = groupRows[0];
      groupRows.forEach((row, i) => {
        row.rank = i + 1;
        row.gamesBehind = leader ? Math.max(0, (leader.wins - row.wins + (row.losses - leader.losses)) / 2) : 0;
      });
      ordered.push(...groupRows);
    }
    standings.set(competitionId, ordered);
  }

  // --- Journal et stats saison des joueurs
  const playerGameLogs = new Map<ID, PlayerGameLog[]>();
  const playerSeasonStats = new Map<string, PlayerSeasonStats>();
  for (const m of matches) {
    if (m.status !== "finished") continue;
    const bundle = stats.get(m.id)!;
    const sides = [
      { lines: bundle.boxScore.home, teamScore: m.homeScore, oppScore: m.awayScore, opp: m.awayTeamId, isHome: true },
      { lines: bundle.boxScore.away, teamScore: m.awayScore, oppScore: m.homeScore, opp: m.homeTeamId, isHome: false },
    ];
    for (const s of sides) {
      for (const line of s.lines) {
        const log: PlayerGameLog = {
          ...line,
          matchId: m.id,
          competitionId: m.competitionId,
          date: m.date,
          opponentTeamId: s.opp,
          isHome: s.isHome,
          result: s.teamScore > s.oppScore ? "W" : "L",
          teamScore: s.teamScore,
          opponentScore: s.oppScore,
        };
        playerGameLogs.set(line.playerId, [...(playerGameLogs.get(line.playerId) ?? []), log]);
      }
    }
  }
  for (const [playerId, logs] of playerGameLogs) {
    logs.sort((a, b) => b.date.localeCompare(a.date));
    const byCompetition = new Map<ID, PlayerGameLog[]>();
    for (const log of logs) byCompetition.set(log.competitionId, [...(byCompetition.get(log.competitionId) ?? []), log]);
    for (const [competitionId, compLogs] of byCompetition) {
      const played = compLogs.filter((l) => l.minutes > 0);
      const gp = played.length;
      const sum = (pick: (l: PlayerGameLog) => number) => played.reduce((acc, l) => acc + pick(l), 0);
      const per = (pick: (l: PlayerGameLog) => number) => round1(gp ? sum(pick) / gp : 0);
      const fga = sum((l) => l.fieldGoals.attempted);
      const fta = sum((l) => l.freeThrows.attempted);
      const pts = sum((l) => l.points);
      const usage = gp
        ? played.reduce((acc, l) => {
            const bundle = stats.get(l.matchId)!;
            const team = l.teamId === bundle.teamStats.home.teamId ? bundle.teamStats.home : bundle.teamStats.away;
            const teamPoss = team.fieldGoals.attempted + 0.44 * team.freeThrows.attempted + team.turnovers;
            const own = l.fieldGoals.attempted + 0.44 * l.freeThrows.attempted + l.turnovers;
            return acc + (100 * own * bundle.elapsed) / Math.max(1, l.minutes * teamPoss);
          }, 0) / gp
        : 0;
      const competition = competitionById.get(competitionId)!;
      playerSeasonStats.set(statsKey(playerId, competitionId), {
        playerId,
        // Équipe alignée dans cette compétition (sélection nationale en FIBA/JO, club ailleurs)
        teamId: compLogs[0].teamId,
        competitionId,
        season: competition.season,
        gamesPlayed: gp,
        gamesStarted: played.filter((l) => l.starter).length,
        minutesPerGame: per((l) => l.minutes),
        pointsPerGame: per((l) => l.points),
        reboundsPerGame: per((l) => l.rebounds),
        assistsPerGame: per((l) => l.assists),
        stealsPerGame: per((l) => l.steals),
        blocksPerGame: per((l) => l.blocks),
        turnoversPerGame: per((l) => l.turnovers),
        foulsPerGame: per((l) => l.fouls),
        fieldGoalPct: round3(safeRatio(sum((l) => l.fieldGoals.made), fga)),
        threePointPct: round3(safeRatio(sum((l) => l.threePointers.made), sum((l) => l.threePointers.attempted))),
        freeThrowPct: round3(safeRatio(sum((l) => l.freeThrows.made), fta)),
        fieldGoalAttemptsPerGame: per((l) => l.fieldGoals.attempted),
        threePointAttemptsPerGame: per((l) => l.threePointers.attempted),
        freeThrowAttemptsPerGame: per((l) => l.freeThrows.attempted),
        plusMinus: per((l) => l.plusMinus),
        efficiency: per((l) => l.efficiency),
        usageRate: round1(usage),
        trueShootingPct: round3(safeRatio(pts, 2 * (fga + 0.44 * fta))),
        highs: {
          points: Math.max(0, ...played.map((l) => l.points)),
          rebounds: Math.max(0, ...played.map((l) => l.rebounds)),
          assists: Math.max(0, ...played.map((l) => l.assists)),
        },
      });
    }
  }

  return {
    referenceDay,
    builtAt: now.getTime(),
    players,
    playerById,
    rosterByTeam,
    matches,
    matchById,
    matchIdsByTeam,
    matchIdsByCompetition,
    matchIdsByDay,
    stats,
    standings,
    teamSeasonStats,
    playerSeasonStats,
    playerGameLogs,
  };
}

let cache: Dataset | null = null;

/** Dataset mock complet, reconstruit au plus une fois par minute (et à chaque changement de journée). */
export function getDataset(now: Date = new Date()): Dataset {
  if (
    cache &&
    now.getTime() - cache.builtAt < DATASET_TTL_MS &&
    cache.referenceDay === currentMatchDay(now)
  ) {
    return cache;
  }
  cache = buildDataset(now);
  return cache;
}

export { OVERTIME_MINUTES };
