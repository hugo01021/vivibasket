import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ChipOption {
  /** Valeur du paramètre `?competition=` (chaîne vide = pas de filtre). */
  value: string;
  label: string;
  color?: string;
}

/**
 * Sélecteur de compétition sous forme de liens (fonctionne sans JavaScript).
 * Même rendu que `CompetitionFilter`, mais avec une liste d'options libre
 * (pas d'entrée « Autres » : chaque option correspond à une seule compétition).
 */
export function CompetitionChips({
  options,
  active,
  buildHref,
  label = "Choisir une compétition",
}: {
  options: ChipOption[];
  active: string;
  buildHref: (value: string) => string;
  label?: string;
}) {
  return (
    <nav aria-label={label} className="-mx-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-1.5 sm:w-auto sm:flex-wrap">
        {options.map((option) => {
          const isActive = active === option.value;
          return (
            <li key={option.value || "toutes"}>
              <Link
                href={buildHref(option.value)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-chip border px-3 text-xs font-semibold transition-colors",
                  isActive
                    ? "border-accent bg-accent text-accent-ink"
                    : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg",
                )}
              >
                {option.color && !isActive && (
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: option.color }} aria-hidden="true" />
                )}
                {option.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
