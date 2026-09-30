import Link from "next/link";
import type { Competition, StandingRow, TeamSeasonStats } from "@/types";
import { formatNumber, formatPct, formatSigned } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { FormIndicator } from "./FormIndicator";

function record(wins: number, losses: number): string {
  return `${wins}-${losses}`;
}

/** Bilan et indicateurs de saison d'une équipe dans une compétition. */
export function TeamSeasonStatsPanel({
  competition,
  stats,
  standing,
}: {
  competition: Competition;
  stats?: TeamSeasonStats;
  standing?: StandingRow;
}) {
  return (
    <section aria-labelledby={`saison-${competition.id}`} className="space-y-3">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <Link href={`/competitions/${competition.slug}`} className="flex min-w-0 items-baseline gap-2 hover:text-accent">
          <h3 id={`saison-${competition.id}`} className="font-display text-lg font-bold uppercase leading-none">
            {competition.name}
          </h3>
          <span className="text-xs text-fg-subtle">
            {competition.season} · {competition.stage}
          </span>
        </Link>
      </header>
      {!stats || stats.gamesPlayed === 0 ? (
        <EmptyState title="Aucun match joué">Les statistiques apparaîtront après le premier match de la saison.</EmptyState>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          <StatCard
            label="Bilan"
            value={record(stats.wins, stats.losses)}
            hint={`${formatPct(stats.wins / stats.gamesPlayed)} de victoires`}
          />
          {standing && (
            <StatCard
              label="Classement"
              value={`${standing.rank}${standing.rank === 1 ? "er" : "e"}`}
              hint={
                standing.group
                  ? competition.category === "nba"
                    ? `Conférence ${standing.group}`
                    : standing.group
                  : `${stats.gamesPlayed} matchs joués`
              }
            />
          )}
          <StatCard
            label="Points"
            value={formatNumber(stats.pointsPerGame)}
            hint={`${formatNumber(stats.pointsAllowedPerGame)} encaissés`}
          />
          <StatCard label="ORTG" value={formatNumber(stats.offensiveRating)} hint="Pts marqués / 100 poss." />
          <StatCard label="DRTG" value={formatNumber(stats.defensiveRating)} hint="Pts encaissés / 100 poss." />
          <StatCard label="Net rating" value={formatSigned(stats.netRating)} hint="ORTG − DRTG" />
          <StatCard label="Pace" value={formatNumber(stats.pace)} hint="Possessions par match" />
          <StatCard
            label="Forme"
            value={
              <>
                {formatNumber(stats.formScore)}
                <span className="text-sm font-semibold text-fg-subtle">/10</span>
              </>
            }
            hint={<FormIndicator form={stats.form} className="mt-1" />}
          />
          <StatCard label="Domicile" value={record(stats.homeRecord.wins, stats.homeRecord.losses)} hint="Bilan à domicile" />
          <StatCard label="Extérieur" value={record(stats.awayRecord.wins, stats.awayRecord.losses)} hint="Bilan à l’extérieur" />
          <StatCard
            label="Série"
            value={
              // Vert / rouge réservés aux V/D, toujours atténués
              <span className={stats.streak.type === "W" ? "text-win/80" : "text-loss/80"}>
                {stats.streak.count} {stats.streak.type === "W" ? "V" : "D"}
              </span>
            }
            hint={
              stats.streak.type === "W"
                ? `victoire${stats.streak.count > 1 ? "s" : ""} consécutive${stats.streak.count > 1 ? "s" : ""}`
                : `défaite${stats.streak.count > 1 ? "s" : ""} consécutive${stats.streak.count > 1 ? "s" : ""}`
            }
          />
        </div>
      )}
    </section>
  );
}
