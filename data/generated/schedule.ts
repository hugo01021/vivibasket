import type { DayString, ID, ISODateString } from "@/types";
import { addDays, parisDateTime } from "@/lib/time";
import type { TeamSeed } from "../teams";
import { Rng } from "./rng";

export interface RoundSpec {
  /** Décalage en jours par rapport à la journée courante (0 = aujourd'hui). */
  offset: number;
  label: string;
}

export interface ScheduleSpec {
  competitionId: ID;
  /**
   * - `rounds` : journées où toutes les équipes jouent (ligues européennes)
   * - `daily`  : programme quotidien avec un sous-ensemble d'équipes (NBA)
   * - `groups` : round-robin dans chaque groupe (tournois FIBA, BCL)
   */
  mode: "rounds" | "daily" | "groups";
  stage: string;
  rounds?: RoundSpec[];
  /** Nombre de jours sur lesquels s'étale une journée (ex. jeudi + vendredi). */
  spreadDays?: number;
  daily?: { from: number; to: number; minGames: number; maxGames: number };
  /** Heures de coup d'envoi possibles (Paris). "25:30" = 01:30 le lendemain. */
  times: string[];
  /** Round-robin aller-retour (groups). */
  doubleLeg?: boolean;
}

/** Match imposé (scénarisé) qui prime sur le calendrier généré. */
export interface PinnedFixture {
  id: ID;
  competitionId: ID;
  homeTeamId: ID;
  awayTeamId: ID;
  dayOffset: number;
  time: string;
  round?: string;
}

export interface Fixture {
  id: ID;
  competitionId: ID;
  stage: string;
  round: string;
  dayOffset: number;
  day: DayString;
  date: ISODateString;
  homeTeamId: ID;
  awayTeamId: ID;
  pinned: boolean;
}

/** Convertit un jour + "HH:mm" (heures ≥ 24 = lendemain) en instant UTC. */
export function fixtureDate(day: DayString, time: string): ISODateString {
  const [h, m] = time.split(":").map(Number);
  const extraDays = Math.floor(h / 24);
  const hh = String(h % 24).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return parisDateTime(addDays(day, extraDays), `${hh}:${mm}`).toISOString();
}

class BusyCalendar {
  private busy = new Map<ID, Set<number>>();
  private lastPlayed = new Map<ID, number>();

  isFree(teamId: ID, dayOffset: number): boolean {
    return !this.busy.get(teamId)?.has(dayOffset);
  }

  book(teamId: ID, dayOffset: number): void {
    let set = this.busy.get(teamId);
    if (!set) {
      set = new Set();
      this.busy.set(teamId, set);
    }
    set.add(dayOffset);
    const last = this.lastPlayed.get(teamId);
    if (last === undefined || dayOffset > last) this.lastPlayed.set(teamId, dayOffset);
  }

  restDays(teamId: ID, dayOffset: number): number {
    let best = -Infinity;
    for (const d of this.busy.get(teamId) ?? []) if (d < dayOffset && d > best) best = d;
    return best === -Infinity ? 99 : dayOffset - best;
  }
}

function pairKey(a: ID, b: ID): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** Appariement aléatoire d'une journée en limitant les confrontations déjà vues. */
function pairTeams(
  teamIds: ID[],
  seen: Map<string, number>,
  homeCount: Map<ID, number>,
  rng: Rng,
): Array<[ID, ID]> {
  let best: Array<[ID, ID]> = [];
  let bestScore = Infinity;
  for (let attempt = 0; attempt < 10; attempt++) {
    const shuffled = rng.shuffle(teamIds);
    const pairs: Array<[ID, ID]> = [];
    let score = 0;
    for (let i = 0; i + 1 < shuffled.length; i += 2) {
      pairs.push([shuffled[i], shuffled[i + 1]]);
      score += seen.get(pairKey(shuffled[i], shuffled[i + 1])) ?? 0;
    }
    if (score < bestScore) {
      bestScore = score;
      best = pairs;
      if (score === 0) break;
    }
  }
  return best.map(([a, b]) => {
    const homeA = homeCount.get(a) ?? 0;
    const homeB = homeCount.get(b) ?? 0;
    const aHome = homeA === homeB ? rng.chance(0.5) : homeA < homeB;
    return aHome ? [a, b] : [b, a];
  });
}

/** Round-robin par la méthode du cercle (n pair). */
function circleRounds(teamIds: ID[]): Array<Array<[ID, ID]>> {
  const ids = [...teamIds];
  if (ids.length % 2 === 1) ids.push("__bye__");
  const n = ids.length;
  const rounds: Array<Array<[ID, ID]>> = [];
  const rotation = [...ids];
  for (let r = 0; r < n - 1; r++) {
    const pairs: Array<[ID, ID]> = [];
    for (let i = 0; i < n / 2; i++) {
      const a = rotation[i];
      const b = rotation[n - 1 - i];
      if (a === "__bye__" || b === "__bye__") continue;
      pairs.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    rounds.push(pairs);
    rotation.splice(1, 0, rotation.pop() as ID);
  }
  return rounds;
}

function roundLabelFor(spec: ScheduleSpec, dayOffset: number): string {
  const spread = spec.spreadDays ?? 1;
  const round = spec.rounds?.find((r) => dayOffset >= r.offset && dayOffset < r.offset + spread);
  return round?.label ?? spec.stage;
}

/**
 * Construit le calendrier complet (matchs joués, en cours et à venir) de toutes les
 * compétitions, en respectant les matchs imposés et l'indisponibilité des équipes
 * engagées dans plusieurs compétitions.
 */
export function buildFixtures(
  referenceDay: DayString,
  specs: ScheduleSpec[],
  pinned: PinnedFixture[],
  teamsByCompetition: Map<ID, TeamSeed[]>,
): Fixture[] {
  const calendar = new BusyCalendar();
  const fixtures: Fixture[] = [];
  const specById = new Map(specs.map((s) => [s.competitionId, s]));

  // 1. Matchs imposés
  for (const pin of pinned) {
    const spec = specById.get(pin.competitionId);
    const day = addDays(referenceDay, pin.dayOffset);
    fixtures.push({
      id: pin.id,
      competitionId: pin.competitionId,
      stage: spec?.stage ?? "Saison régulière",
      round: pin.round ?? (spec ? roundLabelFor(spec, pin.dayOffset) : "Saison régulière"),
      dayOffset: pin.dayOffset,
      day,
      date: fixtureDate(day, pin.time),
      homeTeamId: pin.homeTeamId,
      awayTeamId: pin.awayTeamId,
      pinned: true,
    });
    calendar.book(pin.homeTeamId, pin.dayOffset);
    calendar.book(pin.awayTeamId, pin.dayOffset);
  }

  // 2. Calendrier généré, compétition par compétition
  for (const spec of specs) {
    const rng = new Rng(`schedule:${spec.competitionId}:${referenceDay}`);
    const teams = teamsByCompetition.get(spec.competitionId) ?? [];
    const teamIds = teams.map((t) => t.id);
    const seen = new Map<string, number>();
    const homeCount = new Map<ID, number>();
    const pinnedHere = pinned.filter((p) => p.competitionId === spec.competitionId);

    const push = (
      home: ID,
      away: ID,
      dayOffset: number,
      round: string,
      index: number,
    ) => {
      const day = addDays(referenceDay, dayOffset);
      fixtures.push({
        id: `${spec.competitionId}-${index}-${home}-${away}`,
        competitionId: spec.competitionId,
        stage: spec.stage,
        round,
        dayOffset,
        day,
        date: fixtureDate(day, rng.pick(spec.times)),
        homeTeamId: home,
        awayTeamId: away,
        pinned: false,
      });
      calendar.book(home, dayOffset);
      calendar.book(away, dayOffset);
      seen.set(pairKey(home, away), (seen.get(pairKey(home, away)) ?? 0) + 1);
      homeCount.set(home, (homeCount.get(home) ?? 0) + 1);
    };

    if (spec.mode === "rounds" && spec.rounds) {
      const spread = spec.spreadDays ?? 1;
      spec.rounds.forEach((round, roundIndex) => {
        const windowDays = Array.from({ length: spread }, (_, i) => round.offset + i);
        const pinnedTeams = new Set(
          pinnedHere
            .filter((p) => windowDays.includes(p.dayOffset))
            .flatMap((p) => [p.homeTeamId, p.awayTeamId]),
        );
        const free = teamIds.filter((id) => !pinnedTeams.has(id));
        const pairs = pairTeams(free, seen, homeCount, rng);
        pairs.forEach(([home, away], i) => {
          // Jours de la journée d'abord, puis les jours adjacents si une équipe est prise ailleurs
          const candidates = [
            ...rng.shuffle(windowDays),
            round.offset - 1,
            round.offset + spread,
            round.offset - 2,
            round.offset + spread + 1,
          ];
          const dayOffset =
            candidates.find((d) => calendar.isFree(home, d) && calendar.isFree(away, d)) ??
            candidates[0];
          push(home, away, dayOffset, round.label, roundIndex * 100 + i);
        });
      });
    }

    if (spec.mode === "daily" && spec.daily) {
      const { from, to, minGames, maxGames } = spec.daily;
      let index = 0;
      for (let dayOffset = from; dayOffset <= to; dayOffset++) {
        const pinnedToday = pinnedHere.filter((p) => p.dayOffset === dayOffset).length;
        const target = Math.max(0, rng.int(minGames, maxGames) - pinnedToday);
        const available = teamIds
          .filter((id) => calendar.isFree(id, dayOffset))
          .map((id) => ({ id, rest: calendar.restDays(id, dayOffset) + rng.float(0, 1.5) }))
          .sort((a, b) => b.rest - a.rest)
          .slice(0, target * 2)
          .map((t) => t.id);
        const pairs = pairTeams(available, seen, homeCount, rng);
        for (const [home, away] of pairs) push(home, away, dayOffset, spec.stage, index++);
      }
    }

    if (spec.mode === "groups" && spec.rounds) {
      const groups = new Map<string, ID[]>();
      for (const team of teams) {
        const group = team.groups?.[spec.competitionId] ?? "Groupe unique";
        groups.set(group, [...(groups.get(group) ?? []), team.id]);
      }
      let index = 0;
      for (const [group, ids] of groups) {
        const base = circleRounds(ids);
        const legs = spec.doubleLeg ? 2 : 1;
        spec.rounds.forEach((round, roundIndex) => {
          const leg = Math.floor(roundIndex / base.length);
          if (leg >= legs) return;
          const pairs = base[roundIndex % base.length];
          for (const [a, b] of pairs) {
            const [home, away] = leg === 0 ? [a, b] : [b, a];
            push(home, away, round.offset, `${round.label} · ${group}`, index++);
          }
        });
      }
    }
  }

  return fixtures.sort((a, b) => a.date.localeCompare(b.date));
}
