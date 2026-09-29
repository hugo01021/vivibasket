import type { DayString, ISODateString, Player } from "@/types";
import { APP_TIMEZONE, currentMatchDay, diffDays, matchDay } from "./time";

const LOCALE = "fr-FR";

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: APP_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
});

const shortDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: APP_TIMEZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
});

const longDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: APP_TIMEZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** "20:45" (heure de Paris). */
export function formatTime(iso: ISODateString): string {
  return timeFormatter.format(new Date(iso));
}

/** "lun. 28 sept." */
export function formatShortDate(iso: ISODateString): string {
  return shortDateFormatter.format(new Date(iso));
}

/** "lundi 28 septembre 2026" */
export function formatLongDate(iso: ISODateString): string {
  return longDateFormatter.format(new Date(iso));
}

/** Libellé relatif d'une journée : "Aujourd'hui", "Hier", "Demain" ou la date courte. */
export function formatDayLabel(day: DayString, now: Date = new Date()): string {
  const delta = diffDays(currentMatchDay(now), day);
  if (delta === 0) return "Aujourd'hui";
  if (delta === -1) return "Hier";
  if (delta === 1) return "Demain";
  return shortDateFormatter.format(new Date(`${day}T12:00:00Z`));
}

/** Libellé d'un coup d'envoi selon la journée sportive du match. */
export function formatMatchDayLabel(iso: ISODateString, now: Date = new Date()): string {
  return formatDayLabel(matchDay(iso), now);
}

/** 0.453 → "45,3 %" */
export function formatPct(ratio: number, digits = 1): string {
  return `${(ratio * 100).toLocaleString(LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} %`;
}

export function formatNumber(value: number, digits = 1): string {
  return value.toLocaleString(LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** +5,3 / −2,1 */
export function formatSigned(value: number, digits = 1): string {
  const formatted = formatNumber(Math.abs(value), digits);
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `−${formatted}`;
  return formatted;
}

/** 34.5 → "34:30" */
export function formatMinutes(minutes: number): string {
  const whole = Math.floor(minutes);
  const seconds = Math.round((minutes - whole) * 60);
  return `${whole}:${String(seconds).padStart(2, "0")}`;
}

/** "J. Tatum" */
export function shortPlayerName(player: Pick<Player, "firstName" | "lastName">): string {
  return `${player.firstName.charAt(0)}. ${player.lastName}`;
}

export function fullPlayerName(player: Pick<Player, "firstName" | "lastName">): string {
  return `${player.firstName} ${player.lastName}`;
}

/** 203 → "2,03 m" */
export function formatHeight(cm: number): string {
  return `${(cm / 100).toLocaleString(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`;
}

export function ageFromBirthDate(birthDate: string, now: Date = new Date()): number {
  const birth = new Date(birthDate);
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < birth.getUTCMonth() ||
    (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}
