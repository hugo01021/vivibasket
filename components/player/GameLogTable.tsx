import Link from "next/link";
import type { Competition, PlayerGameLog, ShootingLine, Team } from "@/types";
import { formatMinutes, formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TeamBadge } from "@/components/team/TeamBadge";

function shooting(line: ShootingLine): string {
  return `${line.made}/${line.attempted}`;
}

function signed(value: number): string {
  if (value > 0) return `+${value}`;
  if (value < 0) return `−${Math.abs(value)}`;
  return "0";
}

/** Derniers matchs d'un joueur (journal de matchs). */
export function GameLogTable({
  logs,
  teams,
  competitions,
}: {
  logs: PlayerGameLog[];
  teams: Map<string, Team>;
  competitions: Map<string, Competition>;
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-surface">
      <table className="w-full min-w-[54rem] text-sm tabular">
        <caption className="sr-only">Derniers matchs du joueur</caption>
        <thead>
          <tr className="border-b border-border text-[11px] uppercase tracking-[0.08em] text-fg-muted">
            <th scope="col" className="sticky left-0 bg-surface px-4 py-2 text-left font-semibold">Date</th>
            <th scope="col" className="px-2 py-2 text-left font-semibold">Adversaire</th>
            <th scope="col" className="px-2 py-2 text-left font-semibold">Résultat</th>
            <th scope="col" className="px-2 py-2 text-right font-semibold"><abbr title="Minutes" className="no-underline">MIN</abbr></th>
            <th scope="col" className="px-2 py-2 text-right font-semibold"><abbr title="Points" className="no-underline">PTS</abbr></th>
            <th scope="col" className="px-2 py-2 text-right font-semibold"><abbr title="Rebonds" className="no-underline">REB</abbr></th>
            <th scope="col" className="px-2 py-2 text-right font-semibold"><abbr title="Passes décisives" className="no-underline">PD</abbr></th>
            <th scope="col" className="px-2 py-2 text-right font-semibold"><abbr title="Tirs réussis / tentés" className="no-underline">TIRS</abbr></th>
            <th scope="col" className="px-2 py-2 text-right font-semibold"><abbr title="Tirs à 3 points réussis / tentés" className="no-underline">3 PTS</abbr></th>
            <th scope="col" className="px-2 py-2 text-right font-semibold"><abbr title="Lancers francs réussis / tentés" className="no-underline">LF</abbr></th>
            <th scope="col" className="px-2 py-2 text-right font-semibold"><abbr title="Plus/moins" className="no-underline">+/−</abbr></th>
            <th scope="col" className="px-2 py-2 pr-4 text-right font-semibold"><abbr title="Évaluation" className="no-underline">PIR</abbr></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {logs.map((log) => {
            const opponent = teams.get(log.opponentTeamId);
            const competition = competitions.get(log.competitionId);
            const won = log.result === "W";
            return (
              <tr key={log.matchId} className="transition-colors hover:bg-surface-2">
                {/* Colonne collante : la date reste lisible pendant le défilement horizontal (mobile) */}
                <td className="sticky left-0 bg-surface px-4 py-2.5 whitespace-nowrap">
                  <span className="block font-semibold text-fg">{formatShortDate(log.date)}</span>
                  {competition && <span className="block text-xs text-fg-muted">{competition.name}</span>}
                </td>
                <td className="px-2 py-2.5 whitespace-nowrap">
                  {opponent ? (
                    <Link
                      href={`/equipes/${opponent.id}`}
                      className="inline-flex items-center gap-2 font-semibold text-fg transition-colors hover:text-accent"
                    >
                      <span className="w-4 text-xs font-normal text-fg-subtle">{log.isHome ? "vs" : "@"}</span>
                      <TeamBadge team={opponent} size="xs" />
                      {opponent.shortName}
                    </Link>
                  ) : (
                    <span className="text-fg-muted">—</span>
                  )}
                </td>
                <td className="px-2 py-2.5 whitespace-nowrap">
                  <Link
                    href={`/match/${log.matchId}`}
                    className="inline-flex items-center gap-2 text-fg transition-colors hover:text-accent"
                    aria-label={`${won ? "Victoire" : "Défaite"} ${log.teamScore}-${log.opponentScore}, voir le match`}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "inline-flex h-5 w-5 items-center justify-center rounded-[3px] text-[11px] font-bold",
                        won ? "bg-win/10 text-win/80" : "bg-loss/10 text-loss/80",
                      )}
                    >
                      {won ? "V" : "D"}
                    </span>
                    <span className="font-semibold">
                      {log.teamScore}–{log.opponentScore}
                    </span>
                  </Link>
                </td>
                <td className="px-2 py-2.5 text-right text-fg-muted">{formatMinutes(log.minutes)}</td>
                <td className="px-2 py-2.5 text-right font-bold text-fg">{log.points}</td>
                <td className="px-2 py-2.5 text-right text-fg-muted">{log.rebounds}</td>
                <td className="px-2 py-2.5 text-right text-fg-muted">{log.assists}</td>
                <td className="px-2 py-2.5 text-right text-fg-muted">{shooting(log.fieldGoals)}</td>
                <td className="px-2 py-2.5 text-right text-fg-muted">{shooting(log.threePointers)}</td>
                <td className="px-2 py-2.5 text-right text-fg-muted">{shooting(log.freeThrows)}</td>
                <td className="px-2 py-2.5 text-right text-fg-muted">{signed(log.plusMinus)}</td>
                <td className="px-2 py-2.5 pr-4 text-right font-semibold text-fg">{log.efficiency}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
