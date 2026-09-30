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
  const [results, competitions, teams] = await Promise.all([
    query.length >= 2 ? api.search(query, 40) : Promise.resolve<SearchResult[]>([]),
    api.getCompetitions(),
    api.getTeams(),
  ]);
  const competitionMap = new Map(competitions.map((c) => [c.id, c]));
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  // Écusson du club pour les joueurs trouvés.
  const playerTeams = new Map(
    await Promise.all(
      results
        .filter((r) => r.type === "player")
        .map(async (r) => [r.id, (await api.getPlayer(r.id))?.teamId] as const),
    ),
  );

  function visualFor(result: SearchResult): ReactNode {
    if (result.type === "competition") {
      const competition = competitionMap.get(result.id);
      return (
        <span
          aria-hidden="true"
          className="h-8 w-8 shrink-0 rounded-full border border-border-strong"
          style={{ backgroundColor: competition?.accentColor }}
        />
      );
    }
    const team = teamMap.get(result.type === "team" ? result.id : (playerTeams.get(result.id) ?? ""));
    return team ? (
      <TeamBadge team={team} size="md" />
    ) : (
      <span aria-hidden="true" className="h-8 w-8 shrink-0 rounded-full bg-surface-3" />
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Recherche</h1>
        <form action="/recherche" method="get" role="search" className="flex max-w-2xl gap-2">
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
            className="h-11 min-w-0 flex-1 rounded-full border border-border bg-surface px-4 text-base text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            className="h-11 shrink-0 rounded-full bg-accent px-5 text-sm font-bold text-accent-ink transition-colors hover:bg-accent-hover"
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
            <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((result) => (
                <li key={`${result.type}-${result.id}`}>
                  <Link
                    href={result.href}
                    className="flex items-center gap-3 rounded-card border border-border bg-surface px-3 py-2.5 shadow-card transition-colors hover:border-border-strong hover:bg-surface-2"
                  >
                    {visualFor(result)}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{result.label}</span>
                      {result.sublabel && <span className="block truncate text-xs text-fg-muted">{result.sublabel}</span>}
                    </span>
                    <span aria-hidden="true" className="text-fg-subtle">
                      ›
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
