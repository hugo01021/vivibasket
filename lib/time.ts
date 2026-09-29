import type { DayString, ISODateString } from "@/types";

/** Fuseau de référence de l'app : toutes les heures affichées sont en heure de Paris. */
export const APP_TIMEZONE = "Europe/Paris";

/** Les matchs disputés avant 06:00 (NBA en nocturne) sont rattachés à la journée précédente. */
const SPORT_DAY_SHIFT_MS = 6 * 60 * 60 * 1000;

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIMEZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Jour calendaire (heure de Paris) d'un instant, au format "YYYY-MM-DD". */
export function toDayString(date: Date | string): DayString {
  const d = typeof date === "string" ? new Date(date) : date;
  return dayFormatter.format(d);
}

/** Décalage Paris/UTC (ms) à un instant donné (gère l'heure d'été). */
function parisOffsetMs(utcMs: number): number {
  const parts = partsFormatter.formatToParts(new Date(utcMs));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return asUtc - utcMs;
}

/** Instant UTC correspondant à une date + heure locale Paris ("2026-09-28", "20:45"). */
export function parisDateTime(day: DayString, time = "00:00"): Date {
  const [y, m, d] = day.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const firstPass = guess - parisOffsetMs(guess);
  return new Date(guess - parisOffsetMs(firstPass));
}

/** Ajoute (ou retire) des jours à un jour calendaire. */
export function addDays(day: DayString, n: number): DayString {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Nombre de jours entre deux jours calendaires (b − a). */
export function diffDays(a: DayString, b: DayString): number {
  const toMs = (day: DayString) => {
    const [y, m, d] = day.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toMs(b) - toMs(a)) / 86_400_000);
}

/** Journée « sportive » d'un coup d'envoi (les matchs de nuit restent sur la veille). */
export function matchDay(iso: ISODateString): DayString {
  return toDayString(new Date(new Date(iso).getTime() - SPORT_DAY_SHIFT_MS));
}

/** Journée « sportive » courante. */
export function currentMatchDay(now: Date = new Date()): DayString {
  return matchDay(now.toISOString());
}

export function isValidDay(day: string): day is DayString {
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && !Number.isNaN(Date.parse(day));
}
