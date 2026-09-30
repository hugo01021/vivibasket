import Link from "next/link";
import type { Competition, StandingRow, Team } from "@/types";
import { LiveDot } from "@/components/ui/LiveDot";
import { TeamBadge } from "@/components/team/TeamBadge";

/** Ligne de compétition (liste /competitions) : nom, méta-infos, équipe en tête, matchs en direct. */
export function CompetitionCard({
  competition,
  liveCount,
  leader,
  leaderTeam,
}: {
  competition: Competition;
  liveCount: number;
  leader?: StandingRow;
  leaderTeam?: Team;
}) {
  return (
    <Link
      href={`/competitions/${competition.slug}`}
      className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-2 py-3 transition-colors hover:bg-surface-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,14rem)_auto] sm:px-3"
    >
      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-display text-xl font-bold uppercase leading-none transition-colors group-hover:text-accent">
            {competition.name}
          </span>
          <span className="text-xs text-fg-muted">{competition.fullName}</span>
        </p>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] uppercase tracking-[0.08em] text-fg-muted">
          <span>
            {competition.region} · {competition.season} · {competition.stage} · <span className="tabular">{competition.teamCount}</span> équipes
          </span>
          {liveCount > 0 && (
            <span className="inline-flex items-center gap-1.5 font-semibold text-live">
              <LiveDot />
              {liveCount} en direct
            </span>
          )}
        </p>
      </div>
      <span aria-hidden="true" className="text-fg-subtle sm:order-last">
        ›
      </span>
      <div className="col-span-2 mt-2 flex min-w-0 items-center gap-2 text-sm sm:col-span-1 sm:mt-0">
        {leader && leaderTeam && leader.played > 0 ? (
          <>
            <span className="shrink-0 text-[11px] uppercase tracking-[0.08em] text-fg-subtle">En tête</span>
            <TeamBadge team={leaderTeam} size="xs" />
            <span className="truncate font-semibold text-fg">{leaderTeam.shortName}</span>
            <span className="shrink-0 text-fg-muted tabular">
              {leader.wins}-{leader.losses}
            </span>
          </>
        ) : (
          <span className="text-xs text-fg-subtle">Aucun match joué</span>
        )}
      </div>
    </Link>
  );
}
