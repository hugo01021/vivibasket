import Link from "next/link";
import type { Team, TeamSeasonStats } from "@/types";
import { formatNumber, formatPct, formatSigned } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FormIndicator } from "@/components/team/FormIndicator";
import { TeamBadge } from "@/components/team/TeamBadge";

const COLUMNS: Array<{ label: string; title: string }> = [
  { label: "J", title: "Matchs joués" },
  { label: "Bilan", title: "Victoires - défaites" },
  { label: "Pts", title: "Points marqués par match" },
  { label: "Pts enc.", title: "Points encaissés par match" },
  { label: "ORTG", title: "Points marqués pour 100 possessions" },
  { label: "DRTG", title: "Points encaissés pour 100 possessions" },
  { label: "Net", title: "Net rating (ORTG − DRTG)" },
  { label: "Pace", title: "Possessions par match" },
  { label: "eFG%", title: "Pourcentage effectif au tir" },
  { label: "Forme", title: "Indice de forme sur 10" },
];

/** Stats de saison des équipes d'une compétition, triées par net rating. */
export function TeamStatsTable({ stats, teams }: { stats: TeamSeasonStats[]; teams: Map<string, Team> }) {
  const rows = [...stats].sort((a, b) => b.netRating - a.netRating);
  const td = "px-2 py-2 text-right";
  return (
    <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-card">
      <table className="w-full min-w-[860px] text-sm tabular">
        <caption className="sr-only">Statistiques d’équipes, triées par net rating</caption>
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-fg-subtle">
            <th scope="col" className="sticky left-0 z-10 bg-surface px-3 py-2.5 text-left font-semibold sm:px-4">
              Équipe
            </th>
            {COLUMNS.map((column) => (
              <th key={column.label} scope="col" className="px-2 py-2.5 text-right font-semibold">
                <abbr title={column.title} className="no-underline">
                  {column.label}
                </abbr>
              </th>
            ))}
            <th scope="col" className="px-3 py-2.5 text-left font-semibold sm:pr-4">
              5 derniers
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => {
            const team = teams.get(row.teamId);
            return (
              <tr key={row.teamId} className="group transition-colors hover:bg-surface-2">
                <th scope="row" className="sticky left-0 z-10 bg-surface px-3 py-2 text-left font-normal transition-colors group-hover:bg-surface-2 sm:px-4">
                  {team ? (
                    <Link href={`/equipes/${team.id}`} className="flex min-w-0 items-center gap-2 hover:text-accent">
                      <TeamBadge team={team} size="sm" />
                      <span className="truncate font-semibold">{team.shortName}</span>
                    </Link>
                  ) : (
                    <span className="text-fg-muted">{row.teamId}</span>
                  )}
                </th>
                <td className={cn(td, "text-fg-muted")}>{row.gamesPlayed}</td>
                <td className={cn(td, "font-semibold")}>
                  {row.wins}-{row.losses}
                </td>
                <td className={td}>{formatNumber(row.pointsPerGame)}</td>
                <td className={cn(td, "text-fg-muted")}>{formatNumber(row.pointsAllowedPerGame)}</td>
                <td className={td}>{formatNumber(row.offensiveRating)}</td>
                <td className={td}>{formatNumber(row.defensiveRating)}</td>
                <td className={cn(td, "font-bold", row.netRating > 0 && "text-win", row.netRating < 0 && "text-loss")}>
                  {formatSigned(row.netRating)}
                </td>
                <td className={td}>{formatNumber(row.pace)}</td>
                <td className={td}>{formatPct(row.effectiveFieldGoalPct)}</td>
                <td className={cn(td, "font-semibold", row.formScore >= 7 ? "text-win" : row.formScore <= 3 ? "text-loss" : "text-fg")}>
                  {formatNumber(row.formScore)}
                </td>
                <td className="px-3 py-2 sm:pr-4">
                  <FormIndicator form={row.form} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
