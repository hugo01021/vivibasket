import Link from "next/link";
import type { Competition } from "@/types";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

/** Filtres rapides par compétition (liens, fonctionnent sans JavaScript). */
export function CompetitionFilter({
  competitions,
  active,
  buildHref,
}: {
  competitions: Competition[];
  active?: string;
  buildHref: (value?: string) => string;
}) {
  const featured = competitions.filter((c) => c.category !== "other");
  const options: FilterOption[] = [
    { value: "", label: "Toutes" },
    ...featured.map((c) => ({ value: c.slug, label: c.name })),
    { value: "autres", label: "Autres" },
  ];
  return (
    <nav aria-label="Filtrer par compétition" className="-mx-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-1.5 sm:flex-wrap">
        {options.map((option) => {
          const isActive = (active ?? "") === option.value;
          return (
            <li key={option.value}>
              <Link
                href={buildHref(option.value || undefined)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "inline-flex h-8 items-center rounded-[4px] border px-3 text-xs font-semibold whitespace-nowrap transition-colors",
                  isActive ? "border-accent text-accent" : "border-border text-fg-muted hover:border-border-strong hover:text-fg",
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
