"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Favorite, FavoriteKind, ID } from "@/types";
import { readFavorites, subscribeFavorites, toggleFavorite } from "@/lib/favorites";

const EMPTY: Favorite[] = [];
let cachedRaw: string | null = null;
let cachedValue: Favorite[] = EMPTY;

/** Instantané stable tant que le contenu ne change pas (exigé par useSyncExternalStore). */
function getSnapshot(): Favorite[] {
  const value = readFavorites();
  const raw = JSON.stringify(value);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedValue = value;
  }
  return cachedValue;
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribeFavorites, getSnapshot, () => EMPTY);
  const isFavorite = useCallback(
    (kind: FavoriteKind, id: ID) => favorites.some((f) => f.kind === kind && f.id === id),
    [favorites],
  );
  return { favorites, isFavorite, toggle: toggleFavorite };
}
