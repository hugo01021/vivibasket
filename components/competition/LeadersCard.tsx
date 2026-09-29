import Link from "next/link";
import type { PlayerLeader } from "@/lib/api";
import { formatNumber, fullPlayerName } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TeamBadge } from "@/components/team/TeamBadge";

/** Top joueurs d'une catégorie statistique (points, rebonds, passes…). */
export function LeadersCard({
  title,
  unit,
  leaders,
  value,
}: {
  title: string;
  /** Abréviation affichée après la valeur : "pts", "reb", "pd". */
  unit: string;
  leaders: PlayerLeader[];
  value: (leader: PlayerLeader) => number;
}) {
  return (
    <section aria-labelledby={`leaders-${unit}`} className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <header className="flex items-center justify-between border-b border-border px-3 py-2 sm:px-4">
        <h3 id={`leaders-${unit}`} className="text-sm font-bold">
          {title}
        </h3>
        <span className="text-xs text-fg-subtle">par match</span>
      </header>
      {leaders.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-fg-muted">Pas encore assez de matchs joués.</p>
      ) : (
        <ol className="divide-y divide-border">
          {leaders.map((leader, index) => (
            <li key={leader.player.id} className="flex items-center gap-3 px-3 py-2.5 text-sm sm:px-4">
              <span className={cn("w-4 shrink-0 text-right text-xs font-bold tabular", index === 0 ? "text-accent" : "text-fg-subtle")}>{index + 1}</span>
              <TeamBadge team={leader.team} size="sm" />
              <div className="min-w-0 flex-1">
                <Link href={`/joueurs/${leader.player.id}`} className="block truncate font-semibold hover:text-accent">
                  {fullPlayerName(leader.player)}
                </Link>
                <Link href={`/equipes/${leader.team.id}`} className="block truncate text-xs text-fg-muted hover:text-fg">
                  {leader.team.shortName} · {leader.stats.gamesPlayed} m.
                </Link>
              </div>
              <span className={cn("shrink-0 text-right tabular", index === 0 ? "text-lg font-extrabold text-accent" : "font-bold")}>
                {formatNumber(value(leader))}
                <span className="ml-1 text-[11px] font-semibold text-fg-subtle">{unit}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
