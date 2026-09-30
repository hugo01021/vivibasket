import type { ReactNode } from "react";
import type { Team } from "@/types";
import { cn } from "@/lib/utils";
import { TeamBadge } from "@/components/team/TeamBadge";

type Winner = "home" | "away" | "even" | "none";

function winnerOf(home: number, away: number, lowerIsBetter: boolean, neutral: boolean): Winner {
  if (neutral) return "none";
  if (home === away) return "even";
  const homeBetter = lowerIsBetter ? home < away : home > away;
  return homeBetter ? "home" : "away";
}

/**
 * Ligne de comparaison domicile / extérieur : valeurs aux extrémités, libellé au centre,
 * deux barres qui partent du centre. La meilleure valeur est mise en avant (accent).
 */
export function StatComparison({
  label,
  home,
  away,
  homeDisplay,
  awayDisplay,
  lowerIsBetter = false,
  neutral = false,
  max,
  hint,
}: {
  label: string;
  home: number;
  away: number;
  /** Valeur affichée (par défaut : la valeur brute). */
  homeDisplay?: ReactNode;
  awayDisplay?: ReactNode;
  /** Pertes, fautes, DRTG… : la plus petite valeur l'emporte. */
  lowerIsBetter?: boolean;
  /** Aucune mise en avant (rythme, possessions). */
  neutral?: boolean;
  /** Échelle des barres (par défaut : la plus grande des deux valeurs). */
  max?: number;
  hint?: string;
}) {
  const winner = winnerOf(home, away, lowerIsBetter, neutral);
  const scale = max ?? Math.max(Math.abs(home), Math.abs(away));
  const width = (value: number) => (scale <= 0 ? 0 : Math.min(100, (Math.abs(value) / scale) * 100));
  // Barre de la meilleure valeur aux couleurs de son équipe (domicile orange, extérieur bleu), l'autre en gris
  const barClass = (side: "home" | "away") => (winner === side ? (side === "home" ? "bg-accent" : "bg-info") : "bg-border-strong");
  const valueClass = (side: "home" | "away") =>
    winner === side ? "font-semibold text-fg" : winner === "none" || winner === "even" ? "text-fg" : "text-fg-muted";

  return (
    <div className="py-2">
      <div className="mb-1.5 grid grid-cols-[1fr_auto_1fr] items-baseline gap-3 text-sm tabular">
        <span className={valueClass("home")}>{homeDisplay ?? home}</span>
        <span className="min-w-0 text-center text-[11px] uppercase tracking-[0.06em] text-fg-muted">
          {label}
          {hint && <span className="ml-1 normal-case tracking-normal text-fg-subtle">({hint})</span>}
        </span>
        <span className={cn("text-right", valueClass("away"))}>{awayDisplay ?? away}</span>
      </div>
      <div className="grid grid-cols-2 gap-px" aria-hidden="true">
        <div className="flex h-1.5 justify-end overflow-hidden rounded-l-[2px] bg-surface-3">
          <div className={cn("h-full", barClass("home"))} style={{ width: `${width(home)}%` }} />
        </div>
        <div className="flex h-1.5 overflow-hidden rounded-r-[2px] bg-surface-3">
          <div className={cn("h-full", barClass("away"))} style={{ width: `${width(away)}%` }} />
        </div>
      </div>
    </div>
  );
}

/** Carte regroupant plusieurs lignes de comparaison, avec les deux équipes en en-tête. */
export function StatComparisonGroup({
  title,
  homeTeam,
  awayTeam,
  children,
  footer,
  className,
}: {
  title: string;
  homeTeam: Team;
  awayTeam: Team;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-md border border-border bg-surface p-4", className)}>
      {/* Écussons masqués sur mobile pour laisser toute la place aux noms */}
      <header className="mb-1 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <span className="hidden sm:block">
            <TeamBadge team={homeTeam} size="sm" />
          </span>
          <span className="truncate font-display text-base font-bold uppercase leading-none sm:text-lg">{homeTeam.shortName}</span>
        </span>
        <h3 className="text-center text-[11px] uppercase tracking-[0.08em] text-fg-muted">{title}</h3>
        <span className="flex min-w-0 items-center justify-end gap-2">
          <span className="truncate text-right font-display text-base font-bold uppercase leading-none sm:text-lg">{awayTeam.shortName}</span>
          <span className="hidden sm:block">
            <TeamBadge team={awayTeam} size="sm" />
          </span>
        </span>
      </header>
      <div className="divide-y divide-border">{children}</div>
      {footer && <div className="mt-3 border-t border-border pt-3 text-xs text-fg-muted">{footer}</div>}
    </section>
  );
}
