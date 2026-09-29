import Link from "next/link";
import type { Competition, PlayerSeasonStats } from "@/types";
import { formatMinutes, formatNumber, formatPct, formatSigned } from "@/lib/format";

const COLUMNS: Array<{ key: string; label: string; title: string; value: (s: PlayerSeasonStats) => string }> = [
  { key: "gp", label: "MJ", title: "Matchs joués", value: (s) => String(s.gamesPlayed) },
  { key: "gs", label: "TIT", title: "Titularisations", value: (s) => String(s.gamesStarted) },
  { key: "min", label: "MIN", title: "Minutes par match", value: (s) => formatMinutes(s.minutesPerGame) },
  { key: "pts", label: "PTS", title: "Points par match", value: (s) => formatNumber(s.pointsPerGame) },
  { key: "reb", label: "REB", title: "Rebonds par match", value: (s) => formatNumber(s.reboundsPerGame) },
  { key: "ast", label: "PD", title: "Passes décisives par match", value: (s) => formatNumber(s.assistsPerGame) },
  { key: "stl", label: "INT", title: "Interceptions par match", value: (s) => formatNumber(s.stealsPerGame) },
  { key: "blk", label: "CTR", title: "Contres par match", value: (s) => formatNumber(s.blocksPerGame) },
  { key: "tov", label: "BP", title: "Balles perdues par match", value: (s) => formatNumber(s.turnoversPerGame) },
  { key: "fg", label: "TIRS %", title: "Adresse aux tirs", value: (s) => formatPct(s.fieldGoalPct) },
  { key: "3p", label: "3 PTS %", title: "Adresse à 3 points", value: (s) => formatPct(s.threePointPct) },
  { key: "ft", label: "LF %", title: "Adresse aux lancers francs", value: (s) => formatPct(s.freeThrowPct) },
  { key: "ts", label: "TS %", title: "True shooting", value: (s) => formatPct(s.trueShootingPct) },
  { key: "usg", label: "USG %", title: "Taux d'utilisation", value: (s) => `${formatNumber(s.usageRate)} %` },
  { key: "pm", label: "+/−", title: "Plus/moins par match", value: (s) => formatSigned(s.plusMinus) },
  { key: "pir", label: "PIR", title: "Évaluation par match", value: (s) => formatNumber(s.efficiency) },
];

/** Moyennes de saison d'un joueur, une ligne par compétition. */
export function PlayerStatsTable({
  stats,
  competitions,
}: {
  stats: PlayerSeasonStats[];
  competitions: Map<string, Competition>;
}) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] text-sm tabular">
          <caption className="sr-only">Moyennes par match et par compétition</caption>
          <thead>
            <tr className="border-b border-border text-xs text-fg-subtle">
              <th scope="col" className="sticky left-0 bg-surface px-4 py-2 text-left font-semibold">
                Compétition
              </th>
              {COLUMNS.map((c) => (
                <th key={c.key} scope="col" className="px-2 py-2 text-right font-semibold whitespace-nowrap">
                  <abbr title={c.title} className="no-underline">
                    {c.label}
                  </abbr>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {stats.map((s) => {
              const competition = competitions.get(s.competitionId);
              return (
                <tr key={s.competitionId} className="hover:bg-surface-2">
                  <th scope="row" className="sticky left-0 bg-surface px-4 py-2.5 text-left font-semibold whitespace-nowrap">
                    {competition ? (
                      <Link href={`/competitions/${competition.slug}`} className="inline-flex items-center gap-2 hover:text-accent">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: competition.accentColor }} aria-hidden="true" />
                        {competition.name}
                      </Link>
                    ) : (
                      s.competitionId
                    )}
                    <span className="ml-2 text-xs font-normal text-fg-subtle">{s.season}</span>
                  </th>
                  {COLUMNS.map((c) => (
                    <td key={c.key} className={`px-2 py-2.5 text-right whitespace-nowrap ${c.key === "pts" ? "font-bold text-fg" : "text-fg-muted"}`}>
                      {c.value(s)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
