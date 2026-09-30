import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Competition, Match, Team } from "@/types";
import { api } from "@/lib/api";
import { CalendarList } from "@/components/competition/CalendarList";
import { CompetitionTabs, type CompetitionTab } from "@/components/competition/CompetitionTabs";
import { LeadersCard } from "@/components/competition/LeadersCard";
import { StandingsTable } from "@/components/competition/StandingsTable";
import { TeamStatsTable } from "@/components/competition/TeamStatsTable";
import { MatchCard } from "@/components/match/MatchCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { LiveDot } from "@/components/ui/LiveDot";
import { SectionTitle } from "@/components/ui/SectionTitle";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ onglet?: string; tout?: string }>;

const TABS = [
  { value: "classement", label: "Classement" },
  { value: "calendrier", label: "Calendrier" },
  { value: "resultats", label: "Résultats" },
  { value: "stats", label: "Stats" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

/** Journées affichées par défaut dans le calendrier et les résultats. */
const DEFAULT_DAYS = 10;

function isTab(value: string | undefined): value is TabValue {
  return TABS.some((tab) => tab.value === value);
}

function tabHref(competition: Competition, tab: TabValue, all = false): string {
  const params = new URLSearchParams();
  if (tab !== "classement") params.set("onglet", tab);
  if (all) params.set("tout", "1");
  const query = params.toString();
  return `/competitions/${competition.slug}${query ? `?${query}` : ""}`;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const competition = await api.getCompetition(slug);
  if (!competition) return { title: "Compétition introuvable" };
  return {
    title: `${competition.name} ${competition.season}`,
    description: `${competition.fullName} (${competition.region}) : classement, calendrier, résultats et statistiques de la saison ${competition.season}.`,
  };
}

export default async function CompetitionPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ slug }, { onglet, tout }] = await Promise.all([params, searchParams]);
  const competition = await api.getCompetition(slug);
  if (!competition) notFound();
  const tab: TabValue = isTab(onglet) ? onglet : "classement";
  const showAll = tout === "1";

  const [standings, matches, teams] = await Promise.all([
    api.getStandings(competition.id),
    api.getMatches({ competitionId: competition.id }),
    api.getTeams(),
  ]);
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  const live: Match[] = matches.filter((m) => m.status === "live" || m.status === "halftime");
  const upcoming = matches.filter((m) => m.status === "scheduled" || m.status === "postponed");
  const results = matches.filter((m) => m.status === "finished").reverse();

  const tabs: CompetitionTab[] = TABS.map((t) => ({
    value: t.value,
    label: t.label,
    href: tabHref(competition, t.value),
    count: t.value === "calendrier" ? upcoming.length : t.value === "resultats" ? results.length : undefined,
  }));

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-card border border-border bg-surface p-4 pt-5 shadow-card sm:p-5 sm:pt-6">
        <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: competition.accentColor }} aria-hidden="true" />
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ backgroundImage: `radial-gradient(ellipse at top left, ${competition.accentColor}22, transparent 60%)` }}
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: competition.accentColor }} aria-hidden="true" />
              {competition.region} · {competition.season}
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{competition.name}</h1>
            <p className="text-sm text-fg-muted">{competition.fullName}</p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-fg-muted">
              <li>
                <span className="font-semibold text-fg">{competition.stage}</span>
              </li>
              <li>
                <span className="font-semibold text-fg tabular">{competition.teamCount}</span> équipes
              </li>
              <li>
                <span className="font-semibold text-fg tabular">{results.length}</span> matchs joués
              </li>
              <li>
                <span className="font-semibold text-fg tabular">{upcoming.length}</span> à venir
              </li>
              {live.length > 0 && (
                <li className="flex items-center gap-1.5 font-semibold text-live">
                  <LiveDot /> {live.length} en direct
                </li>
              )}
            </ul>
          </div>
          <FavoriteButton kind="competition" id={competition.id} label={competition.name} className="self-start" />
        </div>
      </header>

      {live.length > 0 && (
        <section aria-labelledby="titre-direct">
          <SectionTitle count={live.length}>
            <span id="titre-direct" className="flex items-center gap-2">
              <LiveDot /> En direct
            </span>
          </SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {live.map((match) => {
              const home = teamMap.get(match.homeTeamId);
              const away = teamMap.get(match.awayTeamId);
              if (!home || !away) return null;
              return <MatchCard key={match.id} match={match} competition={competition} homeTeam={home} awayTeam={away} />;
            })}
          </div>
        </section>
      )}

      <div className="space-y-5">
        <CompetitionTabs tabs={tabs} active={tab} />

        {tab === "classement" &&
          (standings.length === 0 ? (
            <EmptyState title="Classement indisponible">Le classement sera publié après les premiers matchs.</EmptyState>
          ) : (
            <StandingsTable competition={competition} rows={standings} teams={teamMap} />
          ))}

        {tab === "calendrier" && (
          <CalendarList
            matches={upcoming}
            teams={teamMap}
            emptyTitle="Aucun match à venir"
            emptyText="Le calendrier de la suite de la saison n’est pas encore publié."
            maxDays={showAll ? undefined : DEFAULT_DAYS}
            moreHref={tabHref(competition, "calendrier", true)}
          />
        )}

        {tab === "resultats" && (
          <CalendarList
            matches={results}
            teams={teamMap}
            emptyTitle="Aucun résultat"
            emptyText="Aucun match de cette compétition n’a encore été joué."
            maxDays={showAll ? undefined : DEFAULT_DAYS}
            moreHref={tabHref(competition, "resultats", true)}
          />
        )}

        {tab === "stats" && <StatsTab competition={competition} teams={teamMap} />}
      </div>
    </div>
  );
}

async function StatsTab({ competition, teams }: { competition: Competition; teams: Map<string, Team> }) {
  const [teamStats, points, rebounds, assists] = await Promise.all([
    api.getCompetitionTeamStats(competition.id),
    api.getLeaders({ competitionId: competition.id, stat: "pointsPerGame", limit: 5 }),
    api.getLeaders({ competitionId: competition.id, stat: "reboundsPerGame", limit: 5 }),
    api.getLeaders({ competitionId: competition.id, stat: "assistsPerGame", limit: 5 }),
  ]);
  const played = teamStats.filter((s) => s.gamesPlayed > 0);


  return (
    <div className="space-y-8">
      <section aria-labelledby="titre-leaders">
        <SectionTitle>
          <span id="titre-leaders">Leaders individuels</span>
        </SectionTitle>
        <div className="grid gap-3 md:grid-cols-3">
          <LeadersCard title="Points" unit="pts" leaders={points} value={(l) => l.stats.pointsPerGame} />
          <LeadersCard title="Rebonds" unit="reb" leaders={rebounds} value={(l) => l.stats.reboundsPerGame} />
          <LeadersCard title="Passes décisives" unit="pd" leaders={assists} value={(l) => l.stats.assistsPerGame} />
        </div>
      </section>

      <section aria-labelledby="titre-stats-equipes">
        <SectionTitle count={played.length}>
          <span id="titre-stats-equipes">Stats des équipes</span>
        </SectionTitle>
        {played.length === 0 ? (
          <EmptyState title="Pas encore de statistiques">Les statistiques d’équipes apparaîtront après les premiers matchs.</EmptyState>
        ) : (
          <>
            <TeamStatsTable stats={played} teams={teams} />
            <p className="mt-2 text-xs text-fg-subtle">
              Classées par net rating. ORTG / DRTG : points marqués / encaissés pour 100 possessions · Pace : possessions par match ·
              eFG% : adresse effective (3 pts pondérés) · Forme : indice sur 10.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
