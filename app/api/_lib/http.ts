/** Réponse d'erreur JSON homogène pour les route handlers. */
export function jsonError(status: number, error: string): Response {
  return Response.json({ error }, { status });
}

/** Identifiant plausible (slug) : lettres, chiffres, tirets, underscores. */
const ID_PATTERN = /^[A-Za-z0-9_-]{1,120}$/;

export function isValidId(value: string): boolean {
  return ID_PATTERN.test(value);
}

/**
 * Liste d'identifiants séparés par des virgules (`?teams=a,b`).
 * Retourne `null` si un identifiant est invalide ou si la liste dépasse `max`.
 */
export function parseIdList(raw: string | null, max: number): string[] | null {
  if (raw === null || raw.trim() === "") return [];
  const ids = [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))];
  if (ids.length > max || !ids.every(isValidId)) return null;
  return ids;
}

/** Entier strictement compris dans [min, max], sinon `null`. */
export function parseIntInRange(raw: string, min: number, max: number): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const value = Number(raw);
  return value >= min && value <= max ? value : null;
}
