import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import type { TeamSeasonStats } from "@/types";
import { api } from "@/lib/api";
import { formatNumber, formatSigned } from "@/lib/format";
import { LiveDot } from "@/components/ui/LiveDot";
import { loadFeaturedAnalyses } from "./_lib/featured";

export const metadata: Metadata = {
  title: "Analyses",
  description: "Forme des équipes, stats avancées (ORTG, DRTG, pace, TS%) et analyse IA des matchs du jour.",
};

/** Nombre minimal de matchs pour figurer dans les repères toutes compétitions. */
const MIN_GAMES = 3;

/** Ligne du hub : titre, description courte et, à droite, un chiffre utile. */
function HubLink({
  href,
  title,
  description,
  value,
  hint,
}: {
  href: string;
  title: string;
  description: string;
  value: ReactNode;
  hint: ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex flex-col gap-3 py-4 transition-colors hover:bg-surface-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-2"
      >
        <span className="min-w-0">
          <span className="block font-display text-2xl font-bold uppercase leading-none">{title}</span>
          <span className="mt-1.5 block text-sm text-fg-muted">{description}</span>
        </span>
        {/* Mobile : valeur et libellé sur une ligne sous la description ; ≥ sm : bloc aligné à droite */}
        <span className="flex shrink-0 items-baseline gap-2 sm:block sm:text-right">
          <span className="font-display text-2xl font-bold leading-none tabular">{value}</span>
          <span className="text-[11px] uppercase tracking-[0.08em] text-fg-muted sm:mt-1 sm:block">{hint}</span>
        </span>
      </Link>
    </li>
  );
}

export default async function AnalysesHubPage() {
  const [competitions, teams, featured] = await Promise.all([
    api.getCompetitions(),
    api.getTeams(),
    loadFeaturedAnalyses(),
  ]);
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const allStats: TeamSeasonStats[] = (
    await Promise.all(competitions.map((c) => api.getCompetitionTeamStats(c.id)))
  )
    .flat()
    .filter((s) => s.gamesPlayed >= MIN_GAMES);

  // Repères toutes compétitions : la meilleure forme et le meilleur net rating.
  const inForm = [...allStats].sort((a, b) => b.formScore - a.formScore || b.netRating - a.netRating)[0];
  const bestNet = [...allStats].sort((a, b) => b.netRating - a.netRating)[0];
  const liveCount = featured.filter((f) => f.match.status === "live" || f.match.status === "halftime").length;
  const teamName = (s: TeamSeasonStats) => teamMap.get(s.teamId)?.shortName ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-bold uppercase leading-none sm:text-5xl">Analyses</h1>
        <p className="mt-2 max-w-2xl text-sm text-fg-muted">
          Forme récente des équipes, efficacité pour 100 possessions et lecture des matchs du jour.
        </p>
      </div>

      <ul className="divide-y divide-border border-y border-border">
        <HubLink
          href="/analyses/forme"
          title="Forme des équipes"
          description="Indice de forme /10, 5 derniers matchs, séries en cours."
          value={inForm ? formatNumber(inForm.formScore) : "—"}
          hint={inForm ? `En forme · ${teamName(inForm)}` : "Pas encore de match joué"}
        />
        <HubLink
          href="/analyses/stats-avancees"
          title="Stats avancées"
          description="ORTG, DRTG, net rating, pace, eFG% et TS%, avec le nuage attaque / défense."
          value={bestNet ? formatSigned(bestNet.netRating) : "—"}
          hint={bestNet ? `Net rating · ${teamName(bestNet)}` : "Pas encore de match joué"}
        />
        <HubLink
          href="/analyses/ia"
          title="Analyse IA"
          description="Résumé, probabilité de victoire et points clés des matchs du jour."
          value={featured.length}
          hint={
            <span className="inline-flex items-center gap-1.5">
              {featured.length > 1 ? "matchs analysés" : "match analysé"}
              {liveCount > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <LiveDot /> {liveCount} en direct
                </>
              )}
            </span>
          }
        />
      </ul>
    </div>
  );
}
