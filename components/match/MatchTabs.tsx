import Link from "next/link";
import { cn } from "@/lib/utils";

export const MATCH_TABS = [
  { key: "resume", label: "Résumé" },
  { key: "stats", label: "Stats" },
  { key: "joueurs", label: "Joueurs" },
  { key: "analyse", label: "Analyse" },
  { key: "play-by-play", label: "Play-by-play" },
] as const;

export type MatchTabKey = (typeof MATCH_TABS)[number]["key"];

export const DEFAULT_MATCH_TAB: MatchTabKey = "resume";

/** Lit `?onglet=` (valeur inconnue ou absente → Résumé). */
export function parseMatchTab(value: string | string[] | undefined): MatchTabKey {
  const raw = Array.isArray(value) ? value[0] : value;
  return MATCH_TABS.find((tab) => tab.key === raw)?.key ?? DEFAULT_MATCH_TAB;
}

export function matchTabHref(matchId: string, tab: MatchTabKey): string {
  return tab === DEFAULT_MATCH_TAB ? `/match/${matchId}` : `/match/${matchId}?onglet=${tab}`;
}

/** Onglets de la page match : liens rendus côté serveur (fonctionnent sans JavaScript), soulignement orange sur l'onglet actif. */
export function MatchTabs({
  matchId,
  active,
  counts,
}: {
  matchId: string;
  active: MatchTabKey;
  /** Compteur optionnel par onglet (nombre d'actions…). */
  counts?: Partial<Record<MatchTabKey, number>>;
}) {
  return (
    <nav aria-label="Sections du match" className="-mx-4 overflow-x-auto border-b border-border px-4 scrollbar-none sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-1">
        {MATCH_TABS.map((tab) => {
          const current = tab.key === active;
          const count = counts?.[tab.key];
          return (
            <li key={tab.key}>
              <Link
                href={matchTabHref(matchId, tab.key)}
                scroll={false}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex h-11 items-center gap-1.5 border-b-2 px-3 text-sm font-semibold whitespace-nowrap transition-colors",
                  current ? "border-accent text-fg" : "border-transparent text-fg-muted hover:text-fg",
                )}
              >
                {tab.label}
                {typeof count === "number" && count > 0 && (
                  <span className={cn("text-[11px] font-semibold tabular", current ? "text-accent" : "text-fg-subtle")}>{count}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
