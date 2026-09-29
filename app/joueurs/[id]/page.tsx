import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { formatMinutes, formatNumber, formatPct, fullPlayerName } from "@/lib/format";
import { GameLogTable } from "@/components/player/GameLogTable";
import { PlayerHeader } from "@/components/player/PlayerHeader";
import { PlayerStatsTable } from "@/components/player/PlayerStatsTable";
import { POSITION_LABELS } from "@/components/player/labels";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatCard } from "@/components/ui/StatCard";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const player = await api.getPlayer(id);
  if (!player) return { title: "Joueur introuvable" };
  const team = await api.getTeam(player.teamId);
  const name = fullPlayerName(player);
  return {
    title: name,
    description: `${name} (${POSITION_LABELS[player.position]}${team ? `, ${team.name}` : ""}) : statistiques de la saison, derniers matchs et profil.`,
  };
}

export default async function PlayerPage({ params }: { params: Params }) {
  const { id } = await params;
  const player = await api.getPlayer(id);
  if (!player) notFound();

  const [team, seasonStats, logs, competitions, teams] = await Promise.all([
    api.getTeam(player.teamId),
    api.getPlayerSeasonStats(player.id),
    api.getPlayerGameLogs(player.id, 10),
    api.getCompetitions(),
    api.getTeams(),
  ]);
  const competitionMap = new Map(competitions.map((c) => [c.id, c]));
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  // Compétition principale = celle où il a joué le plus de matchs (tri du provider).
  const main = seasonStats[0];
  const mainCompetition = main ? competitionMap.get(main.competitionId) : undefined;

  return (
    <div className="space-y-8">
      <nav aria-label="Fil d’Ariane" className="text-sm text-fg-muted">
        <Link href="/joueurs" className="hover:text-accent">
          Joueurs
        </Link>
        <span aria-hidden="true" className="mx-1.5 text-fg-subtle">
          ›
        </span>
        <span className="text-fg">{fullPlayerName(player)}</span>
      </nav>

      <PlayerHeader player={player} team={team} />

      {main ? (
        <section aria-labelledby="titre-chiffres">
          <SectionTitle>
            <span id="titre-chiffres">
              Chiffres clés
              {mainCompetition && (
                <span className="ml-2 text-sm font-semibold text-fg-muted">
                  {mainCompetition.name} {main.season}
                </span>
              )}
            </span>
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Points" value={formatNumber(main.pointsPerGame)} hint={`Record : ${main.highs.points}`} />
            <StatCard label="Rebonds" value={formatNumber(main.reboundsPerGame)} hint={`Record : ${main.highs.rebounds}`} />
            <StatCard label="Passes" value={formatNumber(main.assistsPerGame)} hint={`Record : ${main.highs.assists}`} />
            <StatCard label="PIR" value={formatNumber(main.efficiency)} hint={`Usage ${formatNumber(main.usageRate)} %`} />
            <StatCard label="True shooting" value={formatPct(main.trueShootingPct)} hint={`3 pts : ${formatPct(main.threePointPct)}`} />
            <StatCard
              label="Minutes"
              value={formatMinutes(main.minutesPerGame)}
              hint={`${main.gamesPlayed} match${main.gamesPlayed > 1 ? "s" : ""} · ${main.gamesStarted} tit.`}
            />
          </div>
        </section>
      ) : null}

      <section aria-labelledby="titre-saison">
        <SectionTitle count={seasonStats.length}>
          <span id="titre-saison">Statistiques de la saison</span>
        </SectionTitle>
        {seasonStats.length === 0 ? (
          <EmptyState title="Aucune statistique cette saison">
            {fullPlayerName(player)} n’a pas encore disputé de match dans les compétitions suivies.
          </EmptyState>
        ) : (
          <PlayerStatsTable stats={seasonStats} competitions={competitionMap} />
        )}
      </section>

      <section aria-labelledby="titre-matchs">
        <SectionTitle count={logs.length}>
          <span id="titre-matchs">Derniers matchs</span>
        </SectionTitle>
        {logs.length === 0 ? (
          <EmptyState title="Aucun match joué">Le journal de matchs apparaîtra après sa première rencontre.</EmptyState>
        ) : (
          <GameLogTable logs={logs} teams={teamMap} competitions={competitionMap} />
        )}
      </section>
    </div>
  );
}
