import Link from "next/link";
import { cn } from "@/lib/utils";

export interface CompetitionTab {
  value: string;
  label: string;
  href: string;
  count?: number;
}

/** Onglets d'une page compétition (liens `?onglet=`, rendus côté serveur, sans JavaScript). */
export function CompetitionTabs({ tabs, active }: { tabs: CompetitionTab[]; active: string }) {
  return (
    <nav aria-label="Sections de la compétition" className="-mx-4 overflow-x-auto border-b border-border px-4 scrollbar-none sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-1">
        {tabs.map((tab) => {
          const isActive = tab.value === active;
          return (
            <li key={tab.value}>
              <Link
                href={tab.href}
                scroll={false}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex h-11 items-center gap-1.5 border-b-2 px-3 text-sm font-semibold whitespace-nowrap transition-colors",
                  isActive ? "border-accent text-fg" : "border-transparent text-fg-muted hover:text-fg",
                )}
              >
                {tab.label}
                {typeof tab.count === "number" && (
                  <span className={cn("text-[11px] font-semibold tabular", isActive ? "text-accent" : "text-fg-subtle")}>{tab.count}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
