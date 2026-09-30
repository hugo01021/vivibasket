import type { Team } from "@/types";
import { cn } from "@/lib/utils";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const SIZES: Record<Size, string> = {
  xs: "h-5 w-5 text-[9px]",
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-[11px]",
  lg: "h-11 w-11 text-sm",
  xl: "h-16 w-16 text-lg",
};

/**
 * Écusson abstrait : abréviation dans un carré monochrome (aucun logo officiel,
 * pas de couleurs d'équipe pour rester dans la charte noir / orange / gris).
 */
export function TeamBadge({
  team,
  size = "md",
  className,
}: {
  team: Pick<Team, "abbreviation" | "name">;
  size?: Size;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={team.name}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-[4px] border border-border bg-white/[0.04] font-display font-bold tracking-wide text-fg/90",
        SIZES[size],
        className,
      )}
    >
      {team.abbreviation}
    </span>
  );
}
