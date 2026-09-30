import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import type { SearchResult, SearchResultType } from "@/types";
import { api } from "@/lib/api";
import { TeamBadge } from "@/components/team/TeamBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionTitle } from "@/components/ui/SectionTitle";

type SearchParams = Promise<{ q?: string | string[] }>;

const MAX_QUERY_LENGTH = 100;

const GROUPS: Array<{ type: SearchResultType; title: string }> = [
  { type: "competition", title: "Compétitions" },
  { type: "team", title: "Équipes" },
  { type: "player", title: "Joueurs" },
];

function readQuery(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (value ?? "").trim().slice(0, MAX_QUERY_LENGTH);
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const query = readQuery((await searchParams).q);
  return {
    title: query ? `Recherche « ${query} »` : "Recherche",
    robots: { index: false },
  };
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const query = readQuery((await searchParams).q);
  const tooShort = query.length > 0 && query.length < 2;
  const [results, teams] = await Promise.all([
    query.length >= 2 ? api.search(query, 40) : Promise.resolve<SearchResult[]>([]),
    api.getTeams(),
  ]);
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  // Écusson du club pour les joueurs trouvés.
  const playerTeams = new Map(
    await Promise.all(
      results
        .filter((r) => r.type === "player")
        .map(async (r) => [r.id, (await api.getPlayer(r.id))?.teamId] as const),
    ),
  );

  /** Écusson monochrome (équipes, joueurs) ; rien pour les compétitions (pas de pastille de couleur). */
  function visualFor(result: SearchResult): ReactNode {
    if (result.type === "competition") return null;
    const team = teamMap.get(result.type === "team" ? result.id : (playerTeams.get(result.id) ?? ""));
    return team ? (
      <TeamBadge team={team} size="md" />
    ) : (
      <span aria-hidden="true" className="h-8 w-8 shrink-0 rounded-[4px] border border-border bg-surface-2" />
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="font-display text-4xl font-bold uppercase leading-none sm:text-5xl">Recherche</h1>
        <form action="/recherche" method="get" role="search" className="flex max-w-2xl flex-col gap-2 sm:flex-row">
          <label htmlFor="recherche-page" className="sr-only">
            Rechercher une compétition, une équipe ou un joueur
          </label>
          <input
            id="recherche-page"
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Compétition, équipe, joueur…"
            autoComplete="off"
            autoFocus={query === ""}
            maxLength={MAX_QUERY_LENGTH}
            className="h-11 min-w-0 flex-1 rounded-md border border-border bg-surface px-3.5 text-[15px] text-fg placeholder:text-fg-muted transition-colors hover:border-border-strong focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            className="h-11 shrink-0 rounded-md bg-accent px-4 text-sm font-bold text-bg transition-colors hover:bg-accent-hover"
          >
            Rechercher
          </button>
        </form>
        {results.length > 0 && (
          <p className="text-sm text-fg-muted" role="status">
            {results.length} résultat{results.length > 1 ? "s" : ""} pour « {query} »
          </p>
        )}
      </div>

      {query === "" && (
        <EmptyState title="Que cherchez-vous ?">
          Tapez le nom d’une compétition (EuroLeague), d’une équipe (Celtics, Monaco) ou d’un joueur (Wembanyama).
        </EmptyState>
      )}

      {tooShort && <EmptyState title="Recherche trop courte">Saisissez au moins 2 caractères.</EmptyState>}

      {query.length >= 2 && results.length === 0 && (
        <EmptyState title={`Aucun résultat pour « ${query} »`}>Vérifiez l’orthographe ou essayez un nom plus court.</EmptyState>
      )}

      {GROUPS.map(({ type, title }) => {
        const items = results.filter((r) => r.type === type);
        if (items.length === 0) return null;
        return (
          <section key={type} aria-labelledby={`titre-recherche-${type}`}>
            <SectionTitle count={items.length}>
              <span id={`titre-recherche-${type}`}>{title}</span>
            </SectionTitle>
            <ul className="divide-y divide-border border-b border-border">
              {items.map((result) => (
                <li key={`${result.type}-${result.id}`}>
                  <Link
                    href={result.href}
                    className="flex items-center gap-3 py-2.5 text-sm transition-colors hover:bg-surface-2 sm:px-2"
                  >
                    {visualFor(result)}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-fg">{result.label}</span>
                      {result.sublabel && <span className="block truncate text-xs text-fg-muted">{result.sublabel}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
