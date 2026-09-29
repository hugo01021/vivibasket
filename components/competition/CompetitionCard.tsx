import Link from "next/link";
import type { Competition, StandingRow, Team } from "@/types";
import { LiveDot } from "@/components/ui/LiveDot";
import { TeamBadge } from "@/components/team/TeamBadge";

/** Carte de compétition (liste /competitions). */
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
      className="group relative flex flex-col overflow-hidden rounded-card border border-border bg-surface p-4 pt-5 shadow-card transition-colors hover:border-border-strong hover:bg-surface-2"
    >
      <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: competition.accentColor }} aria-hidden="true" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-extrabold tracking-tight group-hover:text-accent">{competition.name}</h3>
          <p className="truncate text-xs text-fg-muted">{competition.fullName}</p>
        </div>
        {liveCount > 0 && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-live/10 px-2 py-1 text-[11px] font-bold text-live">
            <LiveDot />
            {liveCount} en direct
          </span>
        )}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">Région</dt>
          <dd className="truncate font-semibold">{competition.region}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">Saison</dt>
          <dd className="font-semibold tabular">{competition.season}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">Phase</dt>
          <dd className="truncate font-semibold">{competition.stage}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">Équipes</dt>
          <dd className="font-semibold tabular">{competition.teamCount}</dd>
        </div>
      </dl>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3 text-xs text-fg-muted">
        {leader && leaderTeam && leader.played > 0 ? (
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="text-fg-subtle">En tête</span>
            <TeamBadge team={leaderTeam} size="xs" />
            <span className="truncate font-semibold text-fg">{leaderTeam.shortName}</span>
            <span className="tabular">
              ({leader.wins}-{leader.losses})
            </span>
          </span>
        ) : (
          <span className="text-fg-subtle">Aucun match joué</span>
        )}
        <span aria-hidden="true" className="text-fg-subtle">
          ›
        </span>
      </div>
    </Link>
  );
}
