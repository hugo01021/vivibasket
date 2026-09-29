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

/** Onglets de la page match : liens rendus côté serveur (fonctionnent sans JavaScript). */
export function MatchTabs({
  matchId,
  active,
  counts,
}: {
  matchId: string;
  active: MatchTabKey;
  /** Pastille optionnelle par onglet (nombre d'actions…). */
  counts?: Partial<Record<MatchTabKey, number>>;
}) {
  return (
    <nav aria-label="Sections du match" className="-mx-4 border-b border-border px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-1 overflow-x-auto scrollbar-none">
        {MATCH_TABS.map((tab) => {
          const current = tab.key === active;
          const count = counts?.[tab.key];
          return (
            <li key={tab.key} className="shrink-0">
              <Link
                href={matchTabHref(matchId, tab.key)}
                scroll={false}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-3 text-sm font-bold transition-colors",
                  current ? "text-fg" : "text-fg-muted hover:text-fg",
                )}
              >
                {tab.label}
                {typeof count === "number" && count > 0 && (
                  <span className="rounded-full bg-surface-3 px-1.5 py-0.5 text-[10px] font-semibold text-fg-muted tabular">{count}</span>
                )}
                {current && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" aria-hidden="true" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
