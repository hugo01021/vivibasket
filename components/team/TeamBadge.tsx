import type { Team } from "@/types";
import { cn } from "@/lib/utils";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const SIZES: Record<Size, string> = {
  xs: "h-5 w-5 text-[8px]",
  sm: "h-6 w-6 text-[9px]",
  md: "h-8 w-8 text-[11px]",
  lg: "h-11 w-11 text-sm",
  xl: "h-16 w-16 text-lg",
};

function luminance(hex: string): number {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.split("").map((c) => c + c).join("") : value;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * Écusson abstrait généré à partir des couleurs de l'équipe (aucun logo officiel).
 */
export function TeamBadge({
  team,
  size = "md",
  className,
}: {
  team: Pick<Team, "abbreviation" | "colors" | "name">;
  size?: Size;
  className?: string;
}) {
  const dark = luminance(team.colors.primary) < 0.4;
  return (
    <span
      role="img"
      aria-label={team.name}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-extrabold tracking-tight",
        SIZES[size],
        className,
      )}
      style={{
        backgroundColor: team.colors.primary,
        color: dark ? "#f4f1ec" : "#0b0b0d",
        boxShadow: `inset 0 0 0 2px ${team.colors.secondary}55, 0 0 0 1px rgba(255,255,255,0.06)`,
      }}
    >
      {team.abbreviation}
    </span>
  );
}
