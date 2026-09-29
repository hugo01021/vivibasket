import type { Metadata } from "next";
import Link from "next/link";
import type { Team } from "@/types";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { TeamCard } from "@/components/team/TeamCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionTitle } from "@/components/ui/SectionTitle";

export const metadata: Metadata = {
  title: "Équipes",
  description: "Toutes les équipes : franchises NBA, clubs d’EuroLeague et européens, sélections nationales.",
};

type SearchParams = Promise<{ type?: string; q?: string }>;

const TYPES = [
  { value: "nba", label: "NBA", match: (t: Team) => t.kind === "club" && t.competitionIds.includes("nba") },
  { value: "euroleague", label: "EuroLeague", match: (t: Team) => t.kind === "club" && t.competitionIds.includes("euroleague") },
  {
    value: "europe",
    label: "Clubs européens",
    match: (t: Team) => t.kind === "club" && !t.competitionIds.includes("nba") && !t.competitionIds.includes("euroleague"),
  },
  { value: "national", label: "Sélections nationales", match: (t: Team) => t.kind === "national" },
] as const;

type TypeValue = (typeof TYPES)[number]["value"];

function isType(value: string | undefined): value is TypeValue {
  return TYPES.some((t) => t.value === value);
}

function buildHref(type?: string, q?: string): string {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (q) params.set("q", q);
  const query = params.toString();
  return query ? `/equipes?${query}` : "/equipes";
}

export default async function TeamsPage({ searchParams }: { searchParams: SearchParams }) {
  const { type: rawType, q: rawQuery } = await searchParams;
  const type = isType(rawType) ? rawType : undefined;
  const q = typeof rawQuery === "string" ? rawQuery.trim().slice(0, 60) : "";

  const [teams, competitions] = await Promise.all([api.getTeams(q ? { query: q } : undefined), api.getCompetitions()]);
  const competitionMap = new Map(competitions.map((c) => [c.id, c]));
  const sections = TYPES.filter((t) => !type || t.value === type)
    .map((t) => ({ ...t, teams: teams.filter(t.match) }))
    .filter((section) => section.teams.length > 0);
  const total = sections.reduce((acc, s) => acc + s.teams.length, 0);

  const filters = [{ value: "", label: "Toutes" }, ...TYPES.map((t) => ({ value: t.value, label: t.label }))];

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Équipes</h1>
            <p className="text-sm text-fg-muted">
              {total} équipe{total > 1 ? "s" : ""}
              {q && (
                <>
                  {" "}
                  pour « <span className="font-semibold text-fg">{q}</span> »
                </>
              )}
            </p>
          </div>
          <form action="/equipes" method="get" role="search" className="flex w-full gap-2 sm:w-auto">
            {type && <input type="hidden" name="type" value={type} />}
            <label htmlFor="recherche-equipe" className="sr-only">
              Rechercher une équipe
            </label>
            <input
              id="recherche-equipe"
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Nom, ville, trigramme…"
              autoComplete="off"
              className="h-9 min-w-0 flex-1 rounded-full border border-border bg-surface px-4 text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none sm:w-64"
            />
            <button
              type="submit"
              className="inline-flex h-9 shrink-0 items-center rounded-full bg-accent px-4 text-sm font-bold text-accent-ink hover:bg-accent-hover"
            >
              Rechercher
            </button>
          </form>
        </div>

        <nav aria-label="Filtrer par type d’équipe" className="-mx-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
          <ul className="flex w-max gap-1.5 sm:flex-wrap">
            {filters.map((option) => {
              const isActive = (type ?? "") === option.value;
              return (
                <li key={option.value}>
                  <Link
                    href={buildHref(option.value || undefined, q || undefined)}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "inline-flex h-8 items-center rounded-chip border px-3 text-xs font-semibold whitespace-nowrap transition-colors",
                      isActive
                        ? "border-accent bg-accent text-accent-ink"
                        : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg",
                    )}
                  >
                    {option.label}
                  </Link>
                </li>
              );
            })}
            {q && (
              <li>
                <Link
                  href={buildHref(type)}
                  className="inline-flex h-8 items-center gap-1 rounded-chip border border-dashed border-border px-3 text-xs font-semibold whitespace-nowrap text-fg-muted hover:text-fg"
                >
                  <span aria-hidden="true">×</span> Effacer la recherche
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>

      {sections.length === 0 ? (
        <EmptyState title="Aucune équipe trouvée">
          {q ? "Vérifiez l’orthographe ou élargissez le filtre." : "Aucune équipe dans cette catégorie."}
        </EmptyState>
      ) : (
        sections.map((section) => (
          <section key={section.value} aria-labelledby={`type-${section.value}`}>
            <SectionTitle count={section.teams.length}>
              <span id={`type-${section.value}`}>{section.label}</span>
            </SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {section.teams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  competitions={team.competitionIds.flatMap((id) => {
                    const competition = competitionMap.get(id);
                    return competition ? [competition] : [];
                  })}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
