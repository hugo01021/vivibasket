import type { Favorite, FavoriteKind, ID } from "@/types";

const STORAGE_KEY = "basket-analytics:favorites";
const EVENT = "basket-analytics:favorites-change";

function isFavorite(value: unknown): value is Favorite {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (v.kind === "team" || v.kind === "competition" || v.kind === "player") && typeof v.id === "string";
}

/** Lit les favoris (tableau vide côté serveur ou si le stockage est indisponible). */
export function readFavorites(): Favorite[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isFavorite) : [];
  } catch {
    return [];
  }
}

function writeFavorites(favorites: Favorite[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // stockage plein ou bloqué : on garde l'état en mémoire seulement
  }
  window.dispatchEvent(new Event(EVENT));
}

export function toggleFavorite(kind: FavoriteKind, id: ID): void {
  const current = readFavorites();
  const exists = current.some((f) => f.kind === kind && f.id === id);
  writeFavorites(
    exists
      ? current.filter((f) => !(f.kind === kind && f.id === id))
      : [...current, { kind, id, addedAt: new Date().toISOString() }],
  );
}

/** Abonnement aux changements (même onglet et autres onglets). */
export function subscribeFavorites(callback: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}
