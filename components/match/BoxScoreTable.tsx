import Link from "next/link";
import type { ID, Player, PlayerBoxScoreLine, ShootingLine, Team, TeamBoxScore } from "@/types";
import { formatMinutes, formatPct, shortPlayerName } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TeamBadge } from "@/components/team/TeamBadge";

const COLUMNS = [
  { key: "min", label: "MIN", title: "Minutes jouées" },
  { key: "pts", label: "PTS", title: "Points" },
  { key: "reb", label: "REB", title: "Rebonds (offensifs-défensifs)" },
  { key: "ast", label: "PD", title: "Passes décisives" },
  { key: "stl", label: "INT", title: "Interceptions" },
  { key: "blk", label: "CT", title: "Contres" },
  { key: "tov", label: "BP", title: "Balles perdues" },
  { key: "pf", label: "F", title: "Fautes personnelles" },
  { key: "fg", label: "TIRS", title: "Tirs réussis-tentés" },
  { key: "3p", label: "3 PTS", title: "Tirs à 3 points réussis-tentés" },
  { key: "ft", label: "LF", title: "Lancers francs réussis-tentés" },
  { key: "pm", label: "+/−", title: "Plus/moins" },
  { key: "pir", label: "EVAL", title: "Évaluation (PIR)" },
] as const;

/* Cellules : lignes de 40 px sur mobile (cible tactile), plus denses à partir de 640 px. */
const CELL = "px-2 py-2.5 text-right tabular sm:py-2";
const SUB = "block text-[11px] font-normal text-fg-subtle";
const LABEL = "text-[11px] uppercase tracking-[0.08em] text-fg-muted";

function shooting(line: ShootingLine) {
  return `${line.made}-${line.attempted}`;
}

function shootingPct(line: ShootingLine) {
  return line.attempted > 0 ? formatPct(line.made / line.attempted, 0) : "—";
}

function ShootingCell({ line }: { line: ShootingLine }) {
  return (
    <td className={CELL}>
      <span className="text-fg">{shooting(line)}</span>
      <span className={SUB}>{shootingPct(line)}</span>
    </td>
  );
}

function signed(n: number) {
  if (n > 0) return `+${n}`;
  if (n < 0) return `−${Math.abs(n)}`;
  return "0";
}

/* Première colonne figée : fond opaque obligatoire, d'où le survol en bg-surface-2 (≈ blanc 2,5 % sur le fond de carte). */
const stickyCell = "sticky left-0 z-[1] bg-surface";

function PlayerRow({ line, player, live, topScorer }: { line: PlayerBoxScoreLine; player?: Player; live: boolean; topScorer: boolean }) {
  const name = player ? shortPlayerName(player) : line.playerId;
  const didNotPlay = line.minutes <= 0;
  return (
    <tr className="group transition-colors hover:bg-surface-2">
      <th scope="row" className={cn(stickyCell, "max-w-[11rem] py-2.5 pl-3 pr-2 text-left font-semibold group-hover:bg-surface-2 sm:max-w-none sm:py-2")}>
        <span className="flex min-w-0 items-center gap-2">
          <span className="w-5 shrink-0 text-right text-[11px] font-normal text-fg-subtle tabular">{player?.jerseyNumber ?? ""}</span>
          {player ? (
            <Link href={`/joueurs/${player.id}`} className="truncate transition-colors hover:text-accent">
              {name}
            </Link>
          ) : (
            <span className="truncate">{name}</span>
          )}
          {player && <span className="hidden shrink-0 text-[11px] font-normal text-fg-subtle sm:inline">{player.position}</span>}
          {live && line.onCourt && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-live" title="Sur le terrain">
              <span className="sr-only">Sur le terrain</span>
            </span>
          )}
        </span>
      </th>
      {didNotPlay ? (
        <td colSpan={COLUMNS.length} className="px-2 py-2.5 text-left text-xs text-fg-subtle sm:py-2">
          N’est pas entré en jeu
        </td>
      ) : (
        <>
          <td className={cn(CELL, "text-fg-muted")}>{formatMinutes(line.minutes)}</td>
          <td className={cn(CELL, "font-bold", topScorer ? "text-accent" : "text-fg")}>{line.points}</td>
          <td className={CELL}>
            <span className="text-fg">{line.rebounds}</span>
            <span className={SUB}>
              {line.offensiveRebounds}-{line.defensiveRebounds}
            </span>
          </td>
          <td className={CELL}>{line.assists}</td>
          <td className={CELL}>{line.steals}</td>
          <td className={CELL}>{line.blocks}</td>
          <td className={CELL}>{line.turnovers}</td>
          <td className={cn(CELL, line.fouls >= 5 && "font-bold text-fg")}>{line.fouls}</td>
          <ShootingCell line={line.fieldGoals} />
          <ShootingCell line={line.threePointers} />
          <ShootingCell line={line.freeThrows} />
          {/* +/− : pas de vert / rouge (réservés aux V/D), le signe suffit */}
          <td className={cn(CELL, line.plusMinus > 0 ? "text-fg" : line.plusMinus < 0 ? "text-fg-muted" : "text-fg-subtle")}>{signed(line.plusMinus)}</td>
          <td className={cn(CELL, "font-semibold")}>{line.efficiency}</td>
        </>
      )}
    </tr>
  );
}

function SectionRow({ label }: { label: string }) {
  return (
    <tr className="bg-surface-2">
      <th scope="rowgroup" colSpan={COLUMNS.length + 1} className={cn(LABEL, "px-3 py-1.5 text-left font-semibold")}>
        {label}
      </th>
    </tr>
  );
}

/** Box score d'une équipe : titulaires, remplaçants, totaux. Défile horizontalement sur mobile, colonne joueur figée. */
export function BoxScoreTable({
  team,
  lines,
  totals,
  players,
  live = false,
}: {
  team: Team;
  lines: PlayerBoxScoreLine[];
  totals?: TeamBoxScore | null;
  players: Map<ID, Player>;
  live?: boolean;
}) {
  const starters = lines.filter((l) => l.starter);
  const bench = lines.filter((l) => !l.starter).sort((a, b) => b.minutes - a.minutes);
  const topPoints = Math.max(0, ...lines.map((l) => l.points));
  const headingId = `box-${team.id}`;

  const renderRows = (group: PlayerBoxScoreLine[]) =>
    group.map((line) => (
      <PlayerRow key={line.playerId} line={line} player={players.get(line.playerId)} live={live} topScorer={topPoints > 0 && line.points === topPoints} />
    ));

  return (
    <section aria-labelledby={headingId} className="overflow-hidden rounded-md border border-border bg-surface">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <h3 id={headingId} className="flex min-w-0 items-center gap-2 font-display text-lg font-bold uppercase leading-none">
          <TeamBadge team={team} size="sm" />
          <Link href={`/equipes/${team.id}`} className="truncate py-1 transition-colors hover:text-accent">
            {team.name}
          </Link>
        </h3>
        {totals && (
          <span className="shrink-0 font-display text-lg font-bold leading-none tabular">
            {totals.points} <span className="text-sm text-fg-muted">pts</span>
          </span>
        )}
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] text-sm">
          <caption className="sr-only">Statistiques individuelles de {team.name}</caption>
          <thead>
            <tr className={cn(LABEL, "border-b border-border")}>
              <th scope="col" className={cn(stickyCell, "py-2 pl-3 pr-2 text-left font-semibold")}>
                Joueur
              </th>
              {COLUMNS.map((col) => (
                <th key={col.key} scope="col" className="px-2 py-2 text-right font-semibold">
                  <abbr title={col.title} className="no-underline">
                    {col.label}
                  </abbr>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {starters.length > 0 && <SectionRow label="Cinq de départ" />}
            {renderRows(starters)}
            {bench.length > 0 && <SectionRow label="Remplaçants" />}
            {renderRows(bench)}
          </tbody>
          {totals && (
            <tfoot className="border-t border-border-strong font-bold">
              <tr>
                <th scope="row" className={cn(stickyCell, "py-2.5 pl-3 pr-2 text-left sm:py-2")}>
                  Total
                </th>
                <td className={cn(CELL, "text-fg-muted")}>—</td>
                <td className={CELL}>{totals.points}</td>
                <td className={CELL}>
                  {totals.rebounds}
                  <span className={SUB}>
                    {totals.offensiveRebounds}-{totals.defensiveRebounds}
                  </span>
                </td>
                <td className={CELL}>{totals.assists}</td>
                <td className={CELL}>{totals.steals}</td>
                <td className={CELL}>{totals.blocks}</td>
                <td className={CELL}>{totals.turnovers}</td>
                <td className={CELL}>{totals.fouls}</td>
                <ShootingCell line={totals.fieldGoals} />
                <ShootingCell line={totals.threePointers} />
                <ShootingCell line={totals.freeThrows} />
                <td className={cn(CELL, "text-fg-muted")}>—</td>
                <td className={cn(CELL, "text-fg-muted")}>—</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}
