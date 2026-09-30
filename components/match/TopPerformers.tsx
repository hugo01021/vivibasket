import Link from "next/link";
import type { ID, Player, PlayerBoxScoreLine, Team } from "@/types";
import { shortPlayerName } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TeamBadge } from "@/components/team/TeamBadge";

const CATEGORIES = [
  { key: "points", label: "Points" },
  { key: "rebounds", label: "Rebonds" },
  { key: "assists", label: "Passes" },
  { key: "efficiency", label: "Évaluation" },
] as const satisfies ReadonlyArray<{ key: keyof PlayerBoxScoreLine; label: string }>;

type CategoryKey = (typeof CATEGORIES)[number]["key"];

function leader(lines: PlayerBoxScoreLine[], key: CategoryKey): PlayerBoxScoreLine | undefined {
  return lines.reduce<PlayerBoxScoreLine | undefined>((best, line) => (!best || line[key] > best[key] ? line : best), undefined);
}

function Leader({ line, stat, players, align, highlight }: { line?: PlayerBoxScoreLine; stat: CategoryKey; players: Map<ID, Player>; align: "left" | "right"; highlight: boolean }) {
  if (!line) return <span className="text-sm text-fg-subtle">—</span>;
  const player = players.get(line.playerId);
  const name = player ? shortPlayerName(player) : line.playerId;
  return (
    <span className={cn("flex min-w-0 items-center gap-1.5", align === "right" && "flex-row-reverse text-right")}>
      <span
        className={cn(
          "w-7 shrink-0 font-display text-xl font-bold leading-none tabular",
          align === "right" ? "text-right" : "text-left",
          highlight ? "text-accent" : "text-fg",
        )}
      >
        {line[stat]}
      </span>
      {player ? (
        <Link href={`/joueurs/${player.id}`} className="truncate text-sm transition-colors hover:text-accent">
          {name}
        </Link>
      ) : (
        <span className="truncate text-sm">{name}</span>
      )}
    </span>
  );
}

/** Meilleurs joueurs de chaque équipe par catégorie (points, rebonds, passes, évaluation). */
export function TopPerformers({
  homeTeam,
  awayTeam,
  home,
  away,
  players,
}: {
  homeTeam: Team;
  awayTeam: Team;
  home: PlayerBoxScoreLine[];
  away: PlayerBoxScoreLine[];
  players: Map<ID, Player>;
}) {
  return (
    <section aria-labelledby="titre-top" className="rounded-md border border-border bg-surface">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <TeamBadge team={homeTeam} size="sm" />
        <h3 id="titre-top" className="text-[11px] uppercase tracking-[0.08em] text-fg-muted">
          Meilleurs joueurs
        </h3>
        <TeamBadge team={awayTeam} size="sm" />
      </header>
      <ul className="divide-y divide-border px-4">
        {CATEGORIES.map((cat) => {
          const h = leader(home, cat.key);
          const a = leader(away, cat.key);
          const hv = h?.[cat.key] ?? 0;
          const av = a?.[cat.key] ?? 0;
          return (
            <li key={cat.key} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 py-2.5">
              <Leader line={h} stat={cat.key} players={players} align="left" highlight={hv > av} />
              <span className="w-20 text-center text-[11px] uppercase tracking-[0.08em] text-fg-subtle">{cat.label}</span>
              <Leader line={a} stat={cat.key} players={players} align="right" highlight={av > hv} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
