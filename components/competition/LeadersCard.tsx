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
    <section aria-labelledby={`leaders-${unit}`} className="overflow-hidden rounded-md border border-border bg-surface">
      <header className="flex items-baseline justify-between gap-3 border-b border-border px-3 py-2 sm:px-4">
        <h3 id={`leaders-${unit}`} className="font-display text-lg font-bold uppercase leading-none">
          {title}
        </h3>
        <span className="text-[11px] uppercase tracking-[0.08em] text-fg-subtle">par match</span>
      </header>
      {leaders.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-fg-muted">Pas encore assez de matchs joués.</p>
      ) : (
        <ol className="divide-y divide-border">
          {leaders.map((leader, index) => (
            <li key={leader.player.id} className="flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-surface-2 sm:px-4">
              <span className={cn("w-4 shrink-0 text-right text-xs tabular", index === 0 ? "font-bold text-accent" : "text-fg-subtle")}>
                {index + 1}
              </span>
              <TeamBadge team={leader.team} size="sm" />
              <div className="min-w-0 flex-1">
                <Link href={`/joueurs/${leader.player.id}`} className="block truncate font-semibold hover:text-accent">
                  {fullPlayerName(leader.player)}
                </Link>
                <Link href={`/equipes/${leader.team.id}`} className="block truncate text-xs text-fg-muted hover:text-fg">
                  {leader.team.shortName} · {leader.stats.gamesPlayed} m.
                </Link>
              </div>
              <span className={cn("shrink-0 text-right font-display text-xl font-bold leading-none tabular", index === 0 ? "text-accent" : "text-fg")}>
                {formatNumber(value(leader))}
                <span className="ml-1 font-sans text-[11px] font-semibold text-fg-subtle">{unit}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
