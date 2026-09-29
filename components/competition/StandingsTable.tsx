import Link from "next/link";
import type { Competition, StandingRow, Team } from "@/types";
import { formatNumber, formatSigned } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FormIndicator } from "@/components/team/FormIndicator";
import { TeamBadge } from "@/components/team/TeamBadge";

function groupLabel(competition: Competition, group: string): string {
  return competition.category === "nba" ? `Conférence ${group}` : group;
}

function formatGamesBehind(value: number): string {
  if (value === 0) return "—";
  return formatNumber(value, Number.isInteger(value) ? 0 : 1);
}

function Table({
  rows,
  teams,
  showGamesBehind,
  caption,
}: {
  rows: StandingRow[];
  teams: Map<string, Team>;
  showGamesBehind: boolean;
  caption: string;
}) {
  const th = "px-2 py-2.5 text-right font-semibold";
  return (
    <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-card">
      <table className="w-full min-w-[720px] text-sm tabular">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-fg-subtle">
            <th scope="col" className="sticky left-0 z-10 bg-surface px-3 py-2.5 text-left font-semibold sm:px-4">
              Équipe
            </th>
            <th scope="col" className={th}>
              <abbr title="Matchs joués" className="no-underline">J</abbr>
            </th>
            <th scope="col" className={th}>
              <abbr title="Victoires" className="no-underline">V</abbr>
            </th>
            <th scope="col" className={th}>
              <abbr title="Défaites" className="no-underline">D</abbr>
            </th>
            <th scope="col" className={th}>
              <abbr title="Pourcentage de victoires" className="no-underline">%</abbr>
            </th>
            {showGamesBehind && (
              <th scope="col" className={th}>
                <abbr title="Matchs de retard sur le leader" className="no-underline">GB</abbr>
              </th>
            )}
            <th scope="col" className={th}>
              <abbr title="Points marqués" className="no-underline">Pts +</abbr>
            </th>
            <th scope="col" className={th}>
              <abbr title="Points encaissés" className="no-underline">Pts −</abbr>
            </th>
            <th scope="col" className={th}>
              <abbr title="Différence de points" className="no-underline">Diff</abbr>
            </th>
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
                  <span className="flex items-center gap-2.5">
                    <span className={cn("w-5 shrink-0 text-right text-xs font-bold", row.rank === 1 ? "text-accent" : "text-fg-muted")}>{row.rank}</span>
                    {team ? (
                      <Link href={`/equipes/${team.id}`} className="flex min-w-0 items-center gap-2 hover:text-accent">
                        <TeamBadge team={team} size="sm" />
                        <span className="truncate font-semibold sm:hidden">{team.shortName}</span>
                        <span className="hidden truncate font-semibold sm:inline">{team.name}</span>
                      </Link>
                    ) : (
                      <span className="text-fg-muted">{row.teamId}</span>
                    )}
                  </span>
                </th>
                <td className="px-2 py-2 text-right text-fg-muted">{row.played}</td>
                <td className="px-2 py-2 text-right font-semibold">{row.wins}</td>
                <td className="px-2 py-2 text-right font-semibold">{row.losses}</td>
                <td className="px-2 py-2 text-right">{row.played > 0 ? formatNumber(row.winPct * 100, 1) : "—"}</td>
                {showGamesBehind && <td className="px-2 py-2 text-right text-fg-muted">{formatGamesBehind(row.gamesBehind)}</td>}
                <td className="px-2 py-2 text-right text-fg-muted">{row.pointsFor}</td>
                <td className="px-2 py-2 text-right text-fg-muted">{row.pointsAgainst}</td>
                <td className={cn("px-2 py-2 text-right font-semibold", row.pointDiff > 0 && "text-win", row.pointDiff < 0 && "text-loss")}>
                  {formatSigned(row.pointDiff, 0)}
                </td>
                <td className="px-3 py-2 sm:pr-4">
                  <FormIndicator form={row.last5} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Classement d'une compétition, découpé par groupe / conférence si besoin. Défile horizontalement sur mobile. */
export function StandingsTable({
  competition,
  rows,
  teams,
}: {
  competition: Competition;
  rows: StandingRow[];
  teams: Map<string, Team>;
}) {
  const showGamesBehind = competition.category === "nba";
  const groups = competition.groups ?? [];
  const sections =
    groups.length > 0
      ? groups.map((group) => ({ key: group, label: groupLabel(competition, group), rows: rows.filter((r) => r.group === group) }))
      : [{ key: "all", label: "", rows }];
  // Lignes éventuellement hors des groupes déclarés
  const orphans = groups.length > 0 ? rows.filter((r) => !r.group || !groups.includes(r.group)) : [];
  if (orphans.length > 0) sections.push({ key: "autres", label: "Autres", rows: orphans });

  return (
    <div className="space-y-6">
      {sections
        .filter((section) => section.rows.length > 0)
        .map((section) => (
          <section key={section.key} aria-label={section.label || `Classement ${competition.name}`}>
            {section.label && <h3 className="mb-2 text-sm font-bold text-fg-muted">{section.label}</h3>}
            <Table
              rows={[...section.rows].sort((a, b) => a.rank - b.rank)}
              teams={teams}
              showGamesBehind={showGamesBehind}
              caption={section.label ? `Classement ${competition.name} — ${section.label}` : `Classement ${competition.name}`}
            />
          </section>
        ))}
    </div>
  );
}
