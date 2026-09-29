import type { PlayByPlayEvent } from "@/types";
import { elapsedMinute, periodMinutes, periodShortLabel, periodStartMinute, REGULATION_PERIODS } from "@/components/match/periods";

export interface ScorePoint {
  /** Minute de jeu écoulée. */
  minute: number;
  home: number;
  away: number;
  /** "Q3 · 05:42" */
  label: string;
}

export interface PeriodMark {
  period: number;
  label: string;
  start: number;
  end: number;
}

export interface ScoreProgression {
  points: ScorePoint[];
  periods: PeriodMark[];
  totalMinutes: number;
}

/**
 * Évolution du score reconstituée depuis les scores courants du play-by-play.
 * Données sérialisables : calculées côté serveur, passées au graphique client.
 */
export function buildScoreProgression(events: PlayByPlayEvent[], gameMinutes: number): ScoreProgression {
  const sorted = events.slice().sort((a, b) => a.sequence - b.sequence);
  const points: ScorePoint[] = [{ minute: 0, home: 0, away: 0, label: "Coup d’envoi" }];
  let lastHome = 0;
  let lastAway = 0;
  for (const event of sorted) {
    if (event.homeScore === lastHome && event.awayScore === lastAway) continue;
    lastHome = event.homeScore;
    lastAway = event.awayScore;
    points.push({
      minute: Math.round(elapsedMinute(event.period, event.clock, gameMinutes) * 100) / 100,
      home: event.homeScore,
      away: event.awayScore,
      label: `${periodShortLabel(event.period)} · ${event.clock}`,
    });
  }

  const lastPeriod = Math.max(REGULATION_PERIODS, ...sorted.map((e) => e.period));
  const periods: PeriodMark[] = [];
  for (let p = 1; p <= lastPeriod; p++) {
    const start = periodStartMinute(p, gameMinutes);
    periods.push({ period: p, label: periodShortLabel(p), start, end: start + periodMinutes(p, gameMinutes) });
  }
  const totalMinutes = periods[periods.length - 1]?.end ?? gameMinutes;
  return { points, periods, totalMinutes };
}
