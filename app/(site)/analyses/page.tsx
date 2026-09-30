import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import type { TeamSeasonStats } from "@/types";
import { api } from "@/lib/api";
import { formatNumber, formatSigned } from "@/lib/format";
import { FormIndicator } from "@/components/team/FormIndicator";
import { TeamBadge } from "@/components/team/TeamBadge";
import { LiveDot } from "@/components/ui/LiveDot";
import { loadFeaturedAnalyses } from "./_lib/featured";

export const metadata: Metadata = {
  title: "Analyses",
  description: "Forme des équipes, stats avancées (ORTG, DRTG, pace, TS%) et analyse IA des matchs du jour.",
};

/** Nombre minimal de matchs pour figurer dans les aperçus toutes compétitions. */
const MIN_GAMES = 3;

function HubCard({
  href,
  title,
  description,
  eyebrow,
  children,
}: {
  href: string;
  title: string;
  description: string;
  eyebrow: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-card border border-border bg-surface shadow-card transition-colors hover:border-border-strong hover:bg-surface-2"
    >
      <div className="border-b border-border p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">{eyebrow}</p>
        <h2 className="mt-1 text-lg font-extrabold tracking-tight group-hover:text-accent">{title}</h2>
        <p className="mt-1 text-sm text-fg-muted">{description}</p>
      </div>
      <div className="flex-1 p-4">{children}</div>
      <span className="px-4 pb-4 text-sm font-semibold text-accent">
        Explorer <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}

export default async function AnalysesHubPage() {
  const [competitions, teams, featured] = await Promise.all([
    api.getCompetitions(),
    api.getTeams(),
    loadFeaturedAnalyses(),
  ]);
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const competitionMap = new Map(competitions.map((c) => [c.id, c]));
  const allStats: TeamSeasonStats[] = (
    await Promise.all(competitions.map((c) => api.getCompetitionTeamStats(c.id)))
  )
    .flat()
    .filter((s) => s.gamesPlayed >= MIN_GAMES);

  const inForm = [...allStats].sort((a, b) => b.formScore - a.formScore || b.netRating - a.netRating).slice(0, 4);
  const bestNet = [...allStats].sort((a, b) => b.netRating - a.netRating).slice(0, 4);
  const liveCount = featured.filter((f) => f.match.status === "live" || f.match.status === "halftime").length;
  const spotlight = featured[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Analyses</h1>
        <p className="max-w-3xl text-sm text-fg-muted">
          Au-delà du score : la dynamique des équipes, leur efficacité pour 100 possessions et une lecture automatique des
          matchs du jour.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <HubCard
          href="/analyses/forme"
          eyebrow="Forme"
          title="Forme des équipes"
          description="Indice de forme /10, 5 derniers matchs, séries en cours."
        >
          <p className="mb-2 text-xs font-semibold text-fg-subtle">Les plus en forme · toutes compétitions</p>
          <ol className="space-y-2">
            {inForm.map((s) => {
              const team = teamMap.get(s.teamId);
              if (!team) return null;
              return (
                <li key={`${s.teamId}-${s.competitionId}`} className="flex items-center gap-2 text-sm">
                  <TeamBadge team={team} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{team.shortName}</span>
                    <span className="block truncate text-xs text-fg-subtle">{competitionMap.get(s.competitionId)?.name}</span>
                  </span>
                  <FormIndicator form={s.form} className="hidden sm:inline-flex lg:hidden xl:inline-flex" />
                  <span className="w-8 text-right font-extrabold text-win tabular">{formatNumber(s.formScore)}</span>
                </li>
              );
            })}
          </ol>
        </HubCard>

        <HubCard
          href="/analyses/stats-avancees"
          eyebrow="Stats avancées"
          title="Ratings, pace et adresse"
          description="ORTG, DRTG, net rating, pace, eFG% et TS% — avec le nuage attaque/défense."
        >
          <p className="mb-2 text-xs font-semibold text-fg-subtle">Meilleurs net ratings · toutes compétitions</p>
          <ol className="space-y-2">
            {bestNet.map((s) => {
              const team = teamMap.get(s.teamId);
              if (!team) return null;
              return (
                <li key={`${s.teamId}-${s.competitionId}`} className="flex items-center gap-2 text-sm">
                  <TeamBadge team={team} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{team.shortName}</span>
                    <span className="block truncate text-xs text-fg-subtle">{competitionMap.get(s.competitionId)?.name}</span>
                  </span>
                  <span className="text-right text-xs text-fg-muted tabular">
                    {formatNumber(s.offensiveRating)} / {formatNumber(s.defensiveRating)}
                  </span>
                  <span className="w-12 text-right font-extrabold text-win tabular">{formatSigned(s.netRating)}</span>
                </li>
              );
            })}
          </ol>
        </HubCard>

        <HubCard
          href="/analyses/ia"
          eyebrow={
            <span className="inline-flex items-center gap-1.5">
              Analyse IA
              {liveCount > 0 && (
                <span className="inline-flex items-center gap-1 text-live">
                  · <LiveDot /> {liveCount} en direct
                </span>
              )}
            </span>
          }
          title="Les matchs du jour décryptés"
          description={`${featured.length} match${featured.length > 1 ? "s" : ""} analysé${featured.length > 1 ? "s" : ""} : résumé, probabilités, points clés.`}
        >
          {spotlight ? (
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 font-bold">
                <TeamBadge team={spotlight.homeTeam} size="xs" />
                {spotlight.homeTeam.shortName}
                <span className="text-fg-subtle">–</span>
                {spotlight.awayTeam.shortName}
                <TeamBadge team={spotlight.awayTeam} size="xs" />
              </p>
              <p className="line-clamp-4 text-fg-muted">{spotlight.analysis.summary}</p>
            </div>
          ) : (
            <p className="text-sm text-fg-muted">Aucun match au programme aujourd’hui.</p>
          )}
        </HubCard>
      </div>
    </div>
  );
}
