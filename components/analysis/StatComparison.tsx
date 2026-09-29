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
  const barClass = (side: "home" | "away") =>
    winner === side ? "bg-accent" : winner === "none" ? "bg-fg-subtle" : "bg-border-strong";
  const valueClass = (side: "home" | "away") =>
    winner === side ? "font-extrabold text-fg" : winner === "none" || winner === "even" ? "font-semibold text-fg" : "font-semibold text-fg-muted";

  return (
    <div className="py-2">
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
        <span className={cn("tabular", valueClass("home"))}>{homeDisplay ?? home}</span>
        <span className="min-w-0 text-center text-xs font-semibold text-fg-muted">
          {label}
          {hint && <span className="ml-1 font-normal text-fg-subtle">({hint})</span>}
        </span>
        <span className={cn("tabular", valueClass("away"))}>{awayDisplay ?? away}</span>
      </div>
      <div className="grid grid-cols-2 gap-[2px]" aria-hidden="true">
        <div className="flex h-1.5 justify-end overflow-hidden rounded-l-full bg-surface-3">
          <div className={cn("h-full rounded-l-full", barClass("home"))} style={{ width: `${width(home)}%` }} />
        </div>
        <div className="flex h-1.5 overflow-hidden rounded-r-full bg-surface-3">
          <div className={cn("h-full rounded-r-full", barClass("away"))} style={{ width: `${width(away)}%` }} />
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
    <section className={cn("rounded-card border border-border bg-surface p-4 shadow-card", className)}>
      <header className="mb-2 flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 text-sm font-bold">
          <TeamBadge team={homeTeam} size="sm" />
          <span className="truncate">{homeTeam.shortName}</span>
        </span>
        <h3 className="shrink-0 text-xs font-bold uppercase tracking-wide text-fg-subtle">{title}</h3>
        <span className="flex min-w-0 items-center justify-end gap-2 text-sm font-bold">
          <span className="truncate text-right">{awayTeam.shortName}</span>
          <TeamBadge team={awayTeam} size="sm" />
        </span>
      </header>
      <div className="divide-y divide-border/60">{children}</div>
      {footer && <div className="mt-3 border-t border-border pt-3 text-xs text-fg-subtle">{footer}</div>}
    </section>
  );
}
