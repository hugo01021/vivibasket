"use client";

import type { FavoriteKind, ID } from "@/types";
import { useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

/** Étoile d'ajout / retrait des favoris (stockés dans le navigateur). */
export function FavoriteButton({
  kind,
  id,
  label,
  className,
}: {
  kind: FavoriteKind;
  id: ID;
  /** Nom de l'élément, pour le libellé accessible. */
  label: string;
  className?: string;
}) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(kind, id);
  return (
    <button
      type="button"
      onClick={() => toggle(kind, id)}
      aria-pressed={active}
      aria-label={active ? `Retirer ${label} des favoris` : `Ajouter ${label} aux favoris`}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-[4px] border px-3 text-xs font-semibold transition-colors sm:h-8",
        active ? "border-accent text-accent" : "border-border text-fg-muted hover:border-border-strong hover:text-fg",
        className,
      )}
    >
      <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        <path d="m10 2.5 2.3 4.8 5.2.7-3.8 3.6.9 5.2L10 14.3l-4.6 2.5.9-5.2-3.8-3.6 5.2-.7Z" />
      </svg>
      <span>{active ? "Favori" : "Suivre"}</span>
    </button>
  );
}
