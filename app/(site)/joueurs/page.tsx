import type { Metadata } from "next";
import Link from "next/link";
import { api, type LeaderStat } from "@/lib/api";
import { formatNumber, formatPct, fullPlayerName } from "@/lib/format";
import { TeamBadge } from "@/components/team/TeamBadge";
import { LeaderBoard } from "@/components/player/LeaderBoard";
import { POSITION_LABELS } from "@/components/player/labels";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { CompetitionChips, type ChipOption } from "@/components/competition/CompetitionChips";

export const metadata: Metadata = {
  title: "Joueurs",
  description: "Meilleurs marqueurs, rebondeurs, passeurs et joueurs les plus efficaces, par compétition.",
};

type SearchParams = Promise<{ q?: string | string[]; competition?: string | string[] }>;

const BOARDS: Array<{ stat: LeaderStat; title: string; unit: string; hint?: string; format: (v: number) => string }> = [
  { stat: "pointsPerGame", title: "Points", unit: "pts / match", format: (v) => formatNumber(v) },
  { stat: "reboundsPerGame", title: "Rebonds", unit: "reb. / match", format: (v) => formatNumber(v) },
  { stat: "assistsPerGame", title: "Passes décisives", unit: "pd / match", format: (v) => formatNumber(v) },
  { stat: "efficiency", title: "Efficacité", unit: "PIR / match", format: (v) => formatNumber(v) },
  {
    stat: "threePointPct",
    title: "Adresse à 3 points",
    unit: "%",
    hint: "min. 3 tentatives / match",
    format: (v) => formatPct(v),
  },
];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function SearchForm({ query }: { query: string }) {
  return (
    <form action="/joueurs" method="get" role="search" className="flex max-w-xl flex-col gap-2 sm:flex-row">
      <label htmlFor="recherche-joueur" className="sr-only">
        Rechercher un joueur
      </label>
      <input
        id="recherche-joueur"
        type="search"
        name="q"
        defaultValue={query}
        placeholder="Nom d’un joueur…"
        autoComplete="off"
        className="h-10 min-w-0 flex-1 rounded-md border border-border bg-surface px-3.5 text-sm text-fg placeholder:text-fg-muted transition-colors hover:border-border-strong focus:border-accent focus:outline-none"
      />
      <button
        type="submit"
        className="h-10 shrink-0 rounded-md bg-accent px-4 text-sm font-bold text-bg transition-colors hover:bg-accent-hover"
      >
        Rechercher
      </button>
    </form>
  );
}

async function SearchResults({ query }: { query: string }) {
  const [players, teams] = await Promise.all([api.getPlayers({ query, limit: 30 }), api.getTeams()]);
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  return (
    <section aria-labelledby="titre-resultats">
      <SectionTitle
        count={players.length}
        action={
          <Link href="/joueurs" className="inline-flex min-h-10 items-center text-sm text-fg-muted transition-colors hover:text-fg">
            ← Leaders
          </Link>
        }
      >
        <span id="titre-resultats">Résultats pour « {query} »</span>
      </SectionTitle>
      {players.length === 0 ? (
        <EmptyState title="Aucun joueur trouvé">Vérifiez l’orthographe ou essayez avec le nom de famille seul.</EmptyState>
      ) : (
        <ul className="divide-y divide-border border-b border-border">
          {players.map((player) => {
            const team = teamMap.get(player.teamId);
            return (
              <li key={player.id}>
                <Link
                  href={`/joueurs/${player.id}`}
                  className="flex items-center gap-3 py-2.5 text-sm transition-colors hover:bg-surface-2 sm:px-2"
                >
                  {team ? (
                    <TeamBadge team={team} size="md" />
                  ) : (
                    <span aria-hidden="true" className="h-8 w-8 shrink-0 rounded-[4px] border border-border bg-surface-2" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-fg">{fullPlayerName(player)}</span>
                    <span className="block truncate text-xs text-fg-muted">
                      {team?.name ?? "Sans club"} · {POSITION_LABELS[player.position]}
                    </span>
                  </span>
                  <span className="text-xs text-fg-muted tabular">#{player.jerseyNumber}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

async function Leaders({ competitionSlug }: { competitionSlug?: string }) {
  const [competitions, requested] = await Promise.all([
    api.getCompetitions(),
    competitionSlug ? api.getCompetition(competitionSlug) : Promise.resolve(null),
  ]);
  const competitionId = requested?.id;
  const boards = await Promise.all(
    BOARDS.map(async (board) => {
      const leaders = await api.getLeaders({ competitionId, stat: board.stat, limit: 10 });
      return { ...board, leaders: leaders.map((l) => ({ ...l, value: l.stats[board.stat] })) };
    }),
  );
  const competitionNames = new Map(competitions.map((c) => [c.id, c.name]));
  const options: ChipOption[] = [
    { value: "", label: "Toutes" },
    ...competitions.map((c) => ({ value: c.slug, label: c.name })),
  ];
  const empty = boards.every((b) => b.leaders.length === 0);

  return (
    <section aria-labelledby="titre-leaders" className="space-y-4">
      <div>
        <h2 id="titre-leaders" className="mb-3 font-display text-2xl font-bold uppercase leading-none">
          Leaders statistiques{requested ? ` · ${requested.name}` : ""}
        </h2>
        <CompetitionChips
          options={options}
          active={requested?.slug ?? ""}
          buildHref={(value) => (value ? `/joueurs?competition=${value}` : "/joueurs")}
        />
        <p className="mt-2 text-xs text-fg-muted">Moyennes par match · minimum 3 matchs joués.</p>
      </div>
      {empty ? (
        <EmptyState title="Pas encore de statistiques">
          {requested ? `${requested.name} n’a pas encore débuté cette saison.` : "Aucun match joué pour le moment."}
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {boards.map((board) => (
            <LeaderBoard
              key={board.stat}
              title={board.title}
              unit={board.unit}
              hint={board.hint}
              leaders={board.leaders}
              formatValue={board.format}
              competitionNames={requested ? undefined : competitionNames}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function PlayersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = (first(params.q) ?? "").trim().slice(0, 80);
  const competition = first(params.competition);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-4xl font-bold uppercase leading-none sm:text-5xl">Joueurs</h1>
          <p className="mt-2 text-sm text-fg-muted">Leaders de la saison et recherche parmi tous les effectifs.</p>
        </div>
        <SearchForm query={query} />
      </div>
      {query ? <SearchResults query={query} /> : <Leaders competitionSlug={competition} />}
    </div>
  );
}
