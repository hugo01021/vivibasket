import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ChipOption {
  /** Valeur du paramètre `?competition=` (chaîne vide = pas de filtre). */
  value: string;
  label: string;
}

/**
 * Sélecteur de compétition sous forme d'onglets soulignés (liens, fonctionne sans JavaScript).
 * Même rendu que `CompetitionTabs`, mais avec une liste d'options libre
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
    <nav aria-label={label} className="-mx-4 overflow-x-auto border-b border-border px-4 scrollbar-none sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-1">
        {options.map((option) => {
          const isActive = active === option.value;
          return (
            <li key={option.value || "toutes"}>
              <Link
                href={buildHref(option.value)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "-mb-px inline-flex h-10 items-center border-b-2 px-3 text-sm font-semibold whitespace-nowrap transition-colors",
                  isActive ? "border-accent text-fg" : "border-transparent text-fg-muted hover:text-fg",
                )}
              >
                {option.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
