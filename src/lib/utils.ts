/** Concatène des classes CSS en ignorant les valeurs falsy. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Supprime accents et casse pour les comparaisons de texte. */
export function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function slugify(input: string): string {
  return normalizeText(input).replace(/\s+/g, "-");
}

const TZ = "Europe/Paris";

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function formatTime(date: Date | number | string): string {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(
    new Date(date),
  );
}

export function formatDateLong(date: Date | number | string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TZ,
  }).format(new Date(date));
}

export function formatDateShort(date: Date | number | string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ }).format(
    new Date(date),
  );
}

export function formatDateTime(date: Date | number | string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(date));
}

/** "2026-10-01" dans le fuseau Europe/Paris. */
export function parisDateKey(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("fr-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TZ,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Date UTC correspondant à `HH:MM` (heure de Paris) le jour `dateKey`. */
export function parisTimeToDate(dateKey: string, hhmm: string, dayOffset = 0): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [hh, mm] = hhmm.split(":").map(Number);
  // Première estimation en UTC puis correction par le décalage réel du fuseau.
  const guess = new Date(Date.UTC(y, m - 1, d + dayOffset, hh, mm));
  const offsetMinutes = parisOffsetMinutes(guess);
  return new Date(guess.getTime() - offsetMinutes * 60_000);
}

function parisOffsetMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"));
  return Math.round((asUtc - date.getTime()) / 60_000);
}

export function percent(value: number, digits = 0): string {
  return `${value.toFixed(digits).replace(".", ",")} %`;
}

export function safeInternalPath(candidate: string | null | undefined, fallback: string): string {
  if (!candidate) return fallback;
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) return fallback;
  return candidate;
}
