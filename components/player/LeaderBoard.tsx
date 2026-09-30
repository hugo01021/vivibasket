import Link from "next/link";
import type { PlayerLeader } from "@/lib/api";
import { fullPlayerName } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TeamBadge } from "@/components/team/TeamBadge";

/** Classement d'une statistique (top joueurs), dans une carte. */
export function LeaderBoard({
  title,
  unit,
  hint,
  leaders,
  formatValue,
  competitionNames,
}: {
  title: string;
  unit: string;
  hint?: string;
  leaders: Array<PlayerLeader & { value: number }>;
  formatValue: (value: number) => string;
  /** Si fourni, affiche la compétition de chaque ligne (vue « toutes compétitions »). */
  competitionNames?: Map<string, string>;
}) {
  const headingId = `leaders-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <section aria-labelledby={headingId} className="overflow-hidden rounded-md border border-border bg-surface">
      <header className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-2.5">
        <h2 id={headingId} className="font-display text-lg font-bold uppercase leading-none">
          {title}
        </h2>
        <span className="text-[11px] uppercase tracking-[0.08em] text-fg-muted">{hint ?? unit}</span>
      </header>
      {leaders.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-fg-muted">Pas encore assez de matchs joués.</p>
      ) : (
        <ol className="divide-y divide-border">
          {leaders.map(({ player, team, stats, value }, index) => (
            <li key={`${player.id}-${stats.competitionId}`}>
              <Link
                href={`/joueurs/${player.id}`}
                className="flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-surface-2"
              >
                <span
                  className={cn(
                    "w-5 shrink-0 text-right text-xs tabular",
                    index === 0 ? "font-bold text-accent" : "text-fg-subtle",
                  )}
                >
                  {index + 1}
                </span>
                <TeamBadge team={team} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-fg">{fullPlayerName(player)}</span>
                  <span className="block truncate text-xs text-fg-muted">
                    {team.shortName}
                    {competitionNames ? ` · ${competitionNames.get(stats.competitionId) ?? ""}` : ""} ·{" "}
                    <span className="tabular">{stats.gamesPlayed} m.</span>
                  </span>
                </span>
                <span className={cn("font-display text-lg font-bold leading-none tabular", index === 0 ? "text-accent" : "text-fg")}>
                  {formatValue(value)}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
