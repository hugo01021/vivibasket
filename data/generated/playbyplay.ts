import type { Competition, ID, Match, PlayByPlayEvent, PlayerBoxScoreLine, Team } from "@/types";
import { shortPlayerName } from "@/lib/format";
import type { PlayerSeed } from "../players";
import { Rng } from "./rng";
import { OVERTIME_MINUTES, PERIOD_MINUTES } from "./simulate";

export interface PlayByPlaySide {
  team: Team;
  box: PlayerBoxScoreLine[];
  players: Map<ID, PlayerSeed>;
}

type Pools = Record<
  "threeMade" | "twoMade" | "ftMade" | "threeMiss" | "twoMiss" | "ftMiss" | "orb" | "drb" | "tov" | "stl" | "blk" | "pf" | "ast",
  Map<ID, number>
>;

interface PendingEvent {
  type: PlayByPlayEvent["type"];
  teamId?: ID;
  playerId?: ID;
  assistPlayerId?: ID;
  description: string;
  points: number;
  side: "home" | "away" | undefined;
  /** Événements qui suivent immédiatement (rebond après un tir manqué, interception après une perte de balle). */
  followUps?: PendingEvent[];
}

const TWO_MADE_VERBS = ["marque un layup", "réussit un tir à mi-distance", "claque un dunk", "marque dans la raquette", "marque en pénétration", "score sur un floater"];
const TWO_MISS_VERBS = ["manque un layup", "manque un tir à mi-distance", "voit son tir dans la raquette refusé par le cercle", "manque en pénétration"];

function buildPools(box: PlayerBoxScoreLine[]): Pools {
  const make = (pick: (l: PlayerBoxScoreLine) => number) =>
    new Map(box.filter((l) => pick(l) > 0).map((l) => [l.playerId, pick(l)] as const));
  return {
    threeMade: make((l) => l.threePointers.made),
    twoMade: make((l) => l.fieldGoals.made - l.threePointers.made),
    ftMade: make((l) => l.freeThrows.made),
    threeMiss: make((l) => l.threePointers.attempted - l.threePointers.made),
    twoMiss: make((l) => l.fieldGoals.attempted - l.threePointers.attempted - (l.fieldGoals.made - l.threePointers.made)),
    ftMiss: make((l) => l.freeThrows.attempted - l.freeThrows.made),
    orb: make((l) => l.offensiveRebounds),
    drb: make((l) => l.defensiveRebounds),
    tov: make((l) => l.turnovers),
    stl: make((l) => l.steals),
    blk: make((l) => l.blocks),
    pf: make((l) => l.fouls),
    ast: make((l) => l.assists),
  };
}

function poolTotal(pool: Map<ID, number>): number {
  let total = 0;
  for (const v of pool.values()) total += v;
  return total;
}

/** Tire un joueur dans un pool (pondéré par le reste à attribuer) et décrémente. */
function takeFrom(pool: Map<ID, number>, rng: Rng, fallback: PlayerBoxScoreLine[]): ID {
  const entries = [...pool.entries()].filter(([, n]) => n > 0);
  if (entries.length === 0) {
    const eligible = fallback.filter((l) => l.minutes > 0);
    return rng.pick(eligible.length ? eligible : fallback).playerId;
  }
  const idx = rng.weightedIndex(entries.map(([, n]) => n));
  const [id, n] = entries[idx];
  if (n <= 1) pool.delete(id);
  else pool.set(id, n - 1);
  return id;
}

function ordinal(period: number, regulation: number): string {
  if (period > regulation) {
    const ot = period - regulation;
    return ot === 1 ? "la prolongation" : `la ${ot}e prolongation`;
  }
  return period === 1 ? "du 1er quart-temps" : `du ${period}e quart-temps`;
}

/**
 * Play-by-play déterministe reconstitué à partir des box scores : les paniers de chaque
 * période totalisent exactement le score de la période.
 */
export function buildPlayByPlay(
  match: Match,
  competition: Competition,
  home: PlayByPlaySide,
  away: PlayByPlaySide,
  rng: Rng,
): PlayByPlayEvent[] {
  const regulation = competition.periods;
  const periodMinutes = PERIOD_MINUTES[competition.gameMinutes];
  const pools = { home: buildPools(home.box), away: buildPools(away.box) };
  const sides = { home, away };
  const periodsRemainingFrom = (index: number) => Math.max(1, match.periods.length - index);

  const events: PlayByPlayEvent[] = [];
  let sequence = 0;
  let homeScore = 0;
  let awayScore = 0;

  const name = (side: "home" | "away", id: ID) => {
    const p = sides[side].players.get(id);
    return p ? shortPlayerName(p) : "Joueur";
  };

  const emit = (period: number, clock: string, e: PendingEvent) => {
    if (e.side === "home") homeScore += e.points;
    if (e.side === "away") awayScore += e.points;
    events.push({
      id: `${match.id}-${sequence}`,
      sequence,
      period,
      clock,
      type: e.type,
      teamId: e.teamId,
      playerId: e.playerId,
      assistPlayerId: e.assistPlayerId,
      description: e.description,
      homeScore,
      awayScore,
      isScoring: e.points > 0,
    });
    sequence += 1;
  };

  match.periods.forEach((periodScore, periodIndex) => {
    const period = periodScore.period;
    const length = period <= regulation ? periodMinutes : OVERTIME_MINUTES;
    const isCurrent = match.clock?.period === period && match.status !== "finished";
    const [cm, cs] = (isCurrent && match.clock ? match.clock.timeRemaining : "00:00").split(":").map(Number);
    const endSeconds = cm * 60 + cs;
    const remainingPeriods = periodsRemainingFrom(periodIndex);

    const pending: PendingEvent[] = [];

    // --- Paniers (le total par période est exact)
    for (const side of ["home", "away"] as const) {
      const sidePools = pools[side];
      const team = sides[side].team;
      let pointsLeft = periodScore[side];
      let guard = 0;
      while (pointsLeft > 0 && guard < 200) {
        guard++;
        const options: Array<{ kind: "three" | "two" | "ft"; weight: number }> = [];
        if (pointsLeft >= 3 && poolTotal(sidePools.threeMade) > 0) options.push({ kind: "three", weight: poolTotal(sidePools.threeMade) });
        if (pointsLeft >= 2 && poolTotal(sidePools.twoMade) > 0) options.push({ kind: "two", weight: poolTotal(sidePools.twoMade) * 1.3 });
        if (poolTotal(sidePools.ftMade) > 0) options.push({ kind: "ft", weight: poolTotal(sidePools.ftMade) * 0.8 });
        const kind = options.length
          ? options[rng.weightedIndex(options.map((o) => o.weight))].kind
          : pointsLeft >= 2
            ? "two"
            : "ft";

        if (kind === "three" || kind === "two") {
          const shooter = takeFrom(kind === "three" ? sidePools.threeMade : sidePools.twoMade, rng, sides[side].box);
          let assist: ID | undefined;
          if (poolTotal(sidePools.ast) > 0 && rng.chance(0.62)) {
            const passer = takeFrom(sidePools.ast, rng, sides[side].box);
            if (passer !== shooter) assist = passer;
            else sidePools.ast.set(passer, (sidePools.ast.get(passer) ?? 0) + 1);
          }
          const verb = kind === "three" ? "réussit un tir à 3 pts" : rng.pick(TWO_MADE_VERBS);
          pending.push({
            type: kind === "three" ? "three_made" : "two_made",
            teamId: team.id,
            playerId: shooter,
            assistPlayerId: assist,
            description: `${name(side, shooter)} ${verb}${assist ? ` (passe ${name(side, assist)})` : ""}`,
            points: kind === "three" ? 3 : 2,
            side,
          });
          pointsLeft -= kind === "three" ? 3 : 2;
        } else {
          const shooter = takeFrom(sidePools.ftMade, rng, sides[side].box);
          const double = pointsLeft >= 2 && (sidePools.ftMade.get(shooter) ?? 0) > 0 && rng.chance(0.7);
          if (double) {
            sidePools.ftMade.set(shooter, (sidePools.ftMade.get(shooter) ?? 1) - 1);
            if ((sidePools.ftMade.get(shooter) ?? 0) <= 0) sidePools.ftMade.delete(shooter);
          }
          const first: PendingEvent = {
            type: "free_throw_made",
            teamId: team.id,
            playerId: shooter,
            description: `${name(side, shooter)} réussit son lancer franc (1/${double ? 2 : 1})`,
            points: 1,
            side,
          };
          if (double) {
            first.followUps = [{
              type: "free_throw_made",
              teamId: team.id,
              playerId: shooter,
              description: `${name(side, shooter)} réussit son lancer franc (2/2)`,
              points: 1,
              side,
            }];
          }
          pending.push(first);
          pointsLeft -= double ? 2 : 1;
        }
      }
    }

    // --- Actions non marquantes réparties sur les périodes restantes
    for (const side of ["home", "away"] as const) {
      const sidePools = pools[side];
      const opp = side === "home" ? "away" : "home";
      const team = sides[side].team;
      const oppTeam = sides[opp].team;
      const take = (pool: Map<ID, number>) => Math.round(poolTotal(pool) / remainingPeriods * rng.float(0.8, 1.2));

      const threeMisses = take(sidePools.threeMiss);
      for (let i = 0; i < threeMisses && poolTotal(sidePools.threeMiss) > 0; i++) {
        const shooter = takeFrom(sidePools.threeMiss, rng, sides[side].box);
        pending.push(withRebound({
          type: "three_missed", teamId: team.id, playerId: shooter,
          description: `${name(side, shooter)} manque un tir à 3 pts`, points: 0, side,
        }, side));
      }
      const twoMisses = take(sidePools.twoMiss);
      for (let i = 0; i < twoMisses && poolTotal(sidePools.twoMiss) > 0; i++) {
        const shooter = takeFrom(sidePools.twoMiss, rng, sides[side].box);
        const blocked = poolTotal(pools[opp].blk) > 0 && rng.chance(0.5);
        const event: PendingEvent = {
          type: "two_missed", teamId: team.id, playerId: shooter,
          description: `${name(side, shooter)} ${rng.pick(TWO_MISS_VERBS)}`, points: 0, side,
        };
        if (blocked) {
          const blocker = takeFrom(pools[opp].blk, rng, sides[opp].box);
          event.followUps = [{
            type: "block", teamId: oppTeam.id, playerId: blocker,
            description: `${name(opp, blocker)} contre le tir de ${name(side, shooter)}`, points: 0, side: undefined,
          }];
        }
        pending.push(withRebound(event, side));
      }
      const ftMisses = take(sidePools.ftMiss);
      for (let i = 0; i < ftMisses && poolTotal(sidePools.ftMiss) > 0; i++) {
        const shooter = takeFrom(sidePools.ftMiss, rng, sides[side].box);
        pending.push(withRebound({
          type: "free_throw_missed", teamId: team.id, playerId: shooter,
          description: `${name(side, shooter)} manque son lancer franc`, points: 0, side,
        }, side));
      }
      const turnovers = take(sidePools.tov);
      for (let i = 0; i < turnovers && poolTotal(sidePools.tov) > 0; i++) {
        const culprit = takeFrom(sidePools.tov, rng, sides[side].box);
        const event: PendingEvent = {
          type: "turnover", teamId: team.id, playerId: culprit,
          description: `Perte de balle de ${name(side, culprit)}`, points: 0, side,
        };
        if (poolTotal(pools[opp].stl) > 0 && rng.chance(0.6)) {
          const thief = takeFrom(pools[opp].stl, rng, sides[opp].box);
          event.followUps = [{
            type: "steal", teamId: oppTeam.id, playerId: thief,
            description: `Interception de ${name(opp, thief)}`, points: 0, side: undefined,
          }];
        }
        pending.push(event);
      }
      const fouls = take(sidePools.pf);
      for (let i = 0; i < fouls && poolTotal(sidePools.pf) > 0; i++) {
        const player = takeFrom(sidePools.pf, rng, sides[side].box);
        pending.push({
          type: "foul", teamId: team.id, playerId: player,
          description: `Faute ${rng.chance(0.15) ? "offensive" : "personnelle"} de ${name(side, player)}`, points: 0, side,
        });
      }
      if (rng.chance(0.7)) {
        pending.push({ type: "timeout", teamId: team.id, description: `Temps mort ${team.shortName}`, points: 0, side });
      }
      const subs = rng.int(1, 3);
      const bench = sides[side].box.filter((l) => l.minutes > 0 && !l.starter);
      const starters = sides[side].box.filter((l) => l.starter);
      for (let i = 0; i < subs && bench.length && starters.length; i++) {
        const inn = rng.pick(bench).playerId;
        const out = rng.pick(starters).playerId;
        pending.push({
          type: "substitution", teamId: team.id, playerId: inn,
          description: `${team.shortName} : ${name(side, inn)} remplace ${name(side, out)}`, points: 0, side,
        });
      }
    }

    function withRebound(event: PendingEvent, side: "home" | "away"): PendingEvent {
      const opp = side === "home" ? "away" : "home";
      const offensive = poolTotal(pools[side].orb) > 0 && rng.chance(0.28);
      const pool = offensive ? pools[side].orb : pools[opp].drb;
      const rebSide = offensive ? side : opp;
      if (poolTotal(pool) === 0) return event;
      const rebounder = takeFrom(pool, rng, sides[rebSide].box);
      const follow: PendingEvent = {
        type: offensive ? "rebound_off" : "rebound_def",
        teamId: sides[rebSide].team.id,
        playerId: rebounder,
        description: `Rebond ${offensive ? "offensif" : "défensif"} de ${name(rebSide, rebounder)}`,
        points: 0,
        side: undefined,
      };
      event.followUps = [...(event.followUps ?? []), follow];
      return event;
    }

    // --- Ordre chronologique et horodatage
    const ordered = rng.shuffle(pending);
    const startSeconds = length * 60;
    const span = startSeconds - endSeconds;
    const flat: PendingEvent[] = [];
    for (const e of ordered) {
      const { followUps, ...rest } = e;
      flat.push(rest);
      if (followUps) flat.push(...followUps);
    }
    const clockFor = (seconds: number) =>
      `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

    emit(period, clockFor(startSeconds), {
      type: period === 1 ? "jump_ball" : "period_start",
      description: period === 1 ? "Entre-deux : début du match" : `Début ${ordinal(period, regulation)}`,
      points: 0,
      side: undefined,
    });

    const gaps = flat.map(() => rng.float(0.5, 1.5));
    const gapSum = gaps.reduce((a, b) => a + b, 0) || 1;
    let cursor = startSeconds;
    flat.forEach((e, i) => {
      cursor -= (span * gaps[i]) / gapSum;
      emit(period, clockFor(Math.max(endSeconds, cursor)), e);
    });

    if (!isCurrent) {
      emit(period, "00:00", {
        type: "period_end",
        description: `Fin ${ordinal(period, regulation)}${period === regulation / 2 ? " — mi-temps" : ""}`,
        points: 0,
        side: undefined,
      });
    }
  });

  return events;
}
