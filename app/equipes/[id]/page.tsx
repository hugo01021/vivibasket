import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Competition } from "@/types";
import { api } from "@/lib/api";
import { formatLongDate, formatMatchDayLabel } from "@/lib/format";
import { matchDay } from "@/lib/time";
import { MatchCard } from "@/components/match/MatchCard";
import { RosterTable } from "@/components/team/RosterTable";
import { TeamHeader } from "@/components/team/TeamHeader";
import { TeamMatchList } from "@/components/team/TeamMatchList";
import { TeamSeasonStatsPanel } from "@/components/team/TeamSeasonStatsPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { LiveDot } from "@/components/ui/LiveDot";
import { SectionTitle } from "@/components/ui/SectionTitle";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const team = await api.getTeam(id);
  if (!team) return { title: "Équipe introuvable" };
  return {
    title: team.name,
    description: `${team.name} : effectif, derniers résultats, calendrier, statistiques avancées et forme de la saison.`,
  };
}

export default async function TeamPage({ params }: { params: Params }) {
  const { id } = await params;
  const team = await api.getTeam(id);
  if (!team) notFound();

  const [competitions, teams, seasonStats, roster, live, next, last, upcoming] = await Promise.all([
    api.getCompetitions(),
    api.getTeams(),
    api.getTeamSeasonStats(team.id),
    api.getTeamRoster(team.id),
    api.getTeamMatches(team.id, { status: ["live", "halftime"] }),
    api.getTeamMatches(team.id, { status: "scheduled", limit: 1 }),
    api.getTeamMatches(team.id, { status: "finished", order: "desc", limit: 10 }),
    api.getTeamMatches(team.id, { status: ["scheduled", "postponed"], limit: 6 }),
  ]);
  const competitionMap = new Map(competitions.map((c) => [c.id, c]));
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const teamCompetitions = team.competitionIds.flatMap((cid) => {
    const competition = competitionMap.get(cid);
    return competition ? [competition] : [];
  });
  const standings = await Promise.all(teamCompetitions.map((c) => api.getStandings(c.id)));
  const standingByCompetition = new Map(
    teamCompetitions.map((c, i) => [c.id, standings[i].find((row) => row.teamId === team.id)]),
  );

  // Carte mise en avant : match en direct, sinon prochain match
  const featured = live[0] ?? next[0];
  const featuredCompetition: Competition | undefined = featured ? competitionMap.get(featured.competitionId) : undefined;
  const featuredHome = featured ? teamMap.get(featured.homeTeamId) : undefined;
  const featuredAway = featured ? teamMap.get(featured.awayTeamId) : undefined;
  const isLive = Boolean(live[0]);
  const upcomingRest = upcoming.filter((m) => m.id !== featured?.id);

  return (
    <div className="space-y-8">
      <TeamHeader team={team} competitions={teamCompetitions} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section aria-labelledby="titre-a-la-une" className="lg:col-span-2">
          <SectionTitle
            action={
              featured && !isLive ? (
                <span className="text-sm text-fg-muted">
                  <span className="font-semibold text-fg">{formatMatchDayLabel(featured.date)}</span>
                  <span className="hidden sm:inline"> · {formatLongDate(`${matchDay(featured.date)}T12:00:00Z`)}</span>
                </span>
              ) : undefined
            }
          >
            <span id="titre-a-la-une" className="flex items-center gap-2">
              {isLive ? (
                <>
                  <LiveDot /> En direct
                </>
              ) : (
                "Prochain match"
              )}
            </span>
          </SectionTitle>
          {featured && featuredCompetition && featuredHome && featuredAway ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <MatchCard match={featured} competition={featuredCompetition} homeTeam={featuredHome} awayTeam={featuredAway} />
            </div>
          ) : (
            <EmptyState title="Aucun match programmé">Le prochain match de l’équipe n’est pas encore au calendrier.</EmptyState>
          )}
        </section>

        <section aria-labelledby="titre-derniers">
          <SectionTitle count={last.length}>
            <span id="titre-derniers">Derniers matchs</span>
          </SectionTitle>
          {last.length === 0 ? (
            <EmptyState title="Aucun match joué">La saison de l’équipe n’a pas encore commencé.</EmptyState>
          ) : (
            <TeamMatchList teamId={team.id} matches={last} teams={teamMap} competitions={competitionMap} />
          )}
        </section>

        <section aria-labelledby="titre-a-venir">
          <SectionTitle count={upcomingRest.length}>
            <span id="titre-a-venir">À venir</span>
          </SectionTitle>
          {upcomingRest.length === 0 ? (
            <EmptyState title="Aucun autre match programmé" />
          ) : (
            <TeamMatchList teamId={team.id} matches={upcomingRest} teams={teamMap} competitions={competitionMap} />
          )}
        </section>
      </div>

      <section aria-labelledby="titre-saison" className="space-y-6">
        <SectionTitle className="mb-0">
          <span id="titre-saison">Statistiques de la saison</span>
        </SectionTitle>
        {teamCompetitions.length === 0 ? (
          <EmptyState title="Aucune compétition en cours" />
        ) : (
          teamCompetitions.map((competition) => (
            <TeamSeasonStatsPanel
              key={competition.id}
              competition={competition}
              stats={seasonStats.find((s) => s.competitionId === competition.id)}
              standing={standingByCompetition.get(competition.id)}
            />
          ))
        )}
      </section>

      <section aria-labelledby="titre-effectif">
        <SectionTitle
          count={roster.length}
          action={
            <Link href="/joueurs" className="text-sm font-semibold text-fg-muted hover:text-accent">
              Tous les joueurs ›
            </Link>
          }
        >
          <span id="titre-effectif">Effectif</span>
        </SectionTitle>
        {roster.length === 0 ? <EmptyState title="Effectif non disponible" /> : <RosterTable players={roster} />}
      </section>
    </div>
  );
}
