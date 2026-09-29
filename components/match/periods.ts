/** Utilitaires de périodes (quart-temps réglementaires + prolongations de 5 minutes). */

export const REGULATION_PERIODS = 4;
export const OVERTIME_MINUTES = 5;

/** "1er quart-temps", "4e quart-temps", "Prolongation", "2e prolongation". */
export function periodName(period: number): string {
  if (period <= REGULATION_PERIODS) return `${period}${period === 1 ? "er" : "e"} quart-temps`;
  const ot = period - REGULATION_PERIODS;
  return ot === 1 ? "Prolongation" : `${ot}e prolongation`;
}

/** "Q1"…"Q4", "OT", "OT2"… */
export function periodShortLabel(period: number): string {
  if (period <= REGULATION_PERIODS) return `Q${period}`;
  const ot = period - REGULATION_PERIODS;
  return ot === 1 ? "OT" : `OT${ot}`;
}

export function periodMinutes(period: number, gameMinutes: number): number {
  return period <= REGULATION_PERIODS ? gameMinutes / REGULATION_PERIODS : OVERTIME_MINUTES;
}

/** Minute de jeu écoulée au début d'une période. */
export function periodStartMinute(period: number, gameMinutes: number): number {
  let total = 0;
  for (let p = 1; p < period; p++) total += periodMinutes(p, gameMinutes);
  return total;
}

/** "mm:ss" → minutes décimales. */
export function clockToMinutes(clock: string): number {
  const [mm, ss] = clock.split(":").map(Number);
  return (Number.isFinite(mm) ? mm : 0) + (Number.isFinite(ss) ? ss : 0) / 60;
}

/** Minute de jeu écoulée pour un chrono restant dans une période. */
export function elapsedMinute(period: number, clock: string, gameMinutes: number): number {
  const length = periodMinutes(period, gameMinutes);
  const remaining = Math.min(length, Math.max(0, clockToMinutes(clock)));
  return periodStartMinute(period, gameMinutes) + (length - remaining);
}
