import Link from "next/link";
import type { Match, MatchDetails, Team } from "@/types";
import { formatLongDate, formatMatchDayLabel, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TeamBadge } from "@/components/team/TeamBadge";
import { MatchStatus } from "./MatchStatus";

function TeamSide({ team, side, emphasis }: { team: Team; side: "home" | "away"; emphasis: "win" | "loss" | "none" }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <Link href={`/equipes/${team.id}`} className="rounded-full transition-transform hover:scale-105" aria-label={`Fiche de ${team.name}`}>
        <TeamBadge team={team} size="xl" />
      </Link>
      <div className="min-w-0 max-w-full">
        <Link
          href={`/equipes/${team.id}`}
          className={cn(
            "block truncate text-base font-extrabold tracking-tight hover:text-accent sm:text-lg",
            emphasis === "loss" ? "text-fg-muted" : "text-fg",
          )}
        >
          <span className="sm:hidden">{team.shortName}</span>
          <span className="hidden sm:inline">{team.name}</span>
        </Link>
        <p className="text-xs text-fg-subtle">{side === "home" ? "Domicile" : "Extérieur"}</p>
      </div>
    </div>
  );
}

function CenterScore({ match }: { match: Match }) {
  const live = match.status === "live" || match.status === "halftime";
  const finished = match.status === "finished";

  if (!live && !finished) {
    const unavailable = match.status === "postponed" || match.status === "cancelled";
    return (
      <div className="flex flex-col items-center gap-1 text-center">
        {unavailable ? (
          <span className="text-lg font-extrabold text-fg-muted">{match.status === "postponed" ? "Reporté" : "Annulé"}</span>
        ) : (
          <>
            <span className="text-3xl font-extrabold tabular sm:text-4xl">{formatTime(match.date)}</span>
            <span className="text-xs font-semibold text-fg-muted">{formatMatchDayLabel(match.date)}</span>
          </>
        )}
      </div>
    );
  }

  const homeWon = finished && match.homeScore > match.awayScore;
  const awayWon = finished && match.awayScore > match.homeScore;
  const scoreClass = (lost: boolean) =>
    cn("text-4xl font-extrabold tabular sm:text-6xl", live ? "text-accent" : lost ? "text-fg-muted" : "text-fg");

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="flex items-center gap-2 sm:gap-4">
        <span className="sr-only">Score : </span>
        <span className={scoreClass(awayWon)}>{match.homeScore}</span>
        <span className="text-2xl font-bold text-fg-subtle" aria-hidden="true">
          –
        </span>
        <span className={scoreClass(homeWon)}>{match.awayScore}</span>
      </p>
      <MatchStatus match={match} className="text-sm" />
    </div>
  );
}

function PeriodTable({ match, homeTeam, awayTeam }: { match: Match; homeTeam: Team; awayTeam: Team }) {
  const live = match.status === "live" || match.status === "halftime";
  const currentPeriod = match.status === "live" ? match.clock?.period : undefined;
  const cell = "px-2 py-1.5 text-center tabular";

  const row = (team: Team, side: "home" | "away") => (
    <tr>
      <th scope="row" className="py-1.5 pr-3 text-left font-semibold">
        <span className="flex items-center gap-2">
          <TeamBadge team={team} size="xs" />
          <span className="truncate">{team.abbreviation}</span>
        </span>
      </th>
      {match.periods.map((p) => {
        const own = side === "home" ? p.home : p.away;
        const opp = side === "home" ? p.away : p.home;
        return (
          <td key={p.period} className={cn(cell, own > opp ? "font-bold text-fg" : "text-fg-muted", p.period === currentPeriod && "bg-accent-soft/60")}>
            {own}
          </td>
        );
      })}
      <td className={cn(cell, "font-extrabold", live ? "text-accent" : "text-fg")}>{side === "home" ? match.homeScore : match.awayScore}</td>
    </tr>
  );

  return (
    <div className="overflow-x-auto scrollbar-none">
      <table className="mx-auto w-full max-w-xl text-sm">
        <caption className="sr-only">Score par période</caption>
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-fg-subtle">
            <th scope="col" className="py-1 pr-3 text-left font-semibold">
              Équipe
            </th>
            {match.periods.map((p) => (
              <th key={p.period} scope="col" className={cn("px-2 py-1 text-center font-semibold", p.period === currentPeriod && "text-accent")}>
                {p.label}
              </th>
            ))}
            <th scope="col" className="px-2 py-1 text-center font-semibold">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {row(homeTeam, "home")}
          {row(awayTeam, "away")}
        </tbody>
      </table>
    </div>
  );
}

/** En-tête de la page match : compétition, équipes, score, statut, infos pratiques, score par période. */
export function ScoreHeader({ details }: { details: Pick<MatchDetails, "match" | "competition" | "homeTeam" | "awayTeam"> }) {
  const { match, competition, homeTeam, awayTeam } = details;
  const live = match.status === "live" || match.status === "halftime";
  const finished = match.status === "finished";
  const homeEmphasis = finished ? (match.homeScore > match.awayScore ? "win" : "loss") : "none";
  const awayEmphasis = finished ? (match.awayScore > match.homeScore ? "win" : "loss") : "none";

  const meta: Array<{ label: string; value: string }> = [
    { label: "Date", value: formatLongDate(match.date) },
    { label: "Coup d’envoi", value: formatTime(match.date) },
  ];
  if (match.venue) meta.push({ label: "Salle", value: match.venue });
  if (match.attendance) meta.push({ label: "Affluence", value: `${match.attendance.toLocaleString("fr-FR")} spectateurs` });
  if (match.broadcast) meta.push({ label: "Diffusion", value: match.broadcast });

  return (
    <section
      aria-label="Score du match"
      className={cn("overflow-hidden rounded-card border bg-surface shadow-card", live ? "border-accent/40" : "border-border")}
    >
      <div
        className="h-1"
        aria-hidden="true"
        style={{ background: `linear-gradient(90deg, ${homeTeam.colors.primary} 0 50%, ${awayTeam.colors.primary} 50% 100%)` }}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5 text-xs">
        <Link href={`/competitions/${competition.slug}`} className="flex min-w-0 items-center gap-2 font-semibold text-fg-muted hover:text-accent">
          <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: competition.accentColor }} aria-hidden="true" />
          <span className="truncate">
            <span className="text-fg">{competition.name}</span>
            {match.stage && match.stage !== match.round ? ` · ${match.stage}` : ""} · {match.round}
          </span>
        </Link>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-3 py-6 sm:gap-6 sm:px-6">
        <TeamSide team={homeTeam} side="home" emphasis={homeEmphasis} />
        <CenterScore match={match} />
        <TeamSide team={awayTeam} side="away" emphasis={awayEmphasis} />
      </div>

      {match.periods.length > 0 && (
        <div className="border-t border-border px-4 py-3">
          <PeriodTable match={match} homeTeam={homeTeam} awayTeam={awayTeam} />
        </div>
      )}

      <dl className="flex flex-wrap gap-x-5 gap-y-1.5 border-t border-border bg-surface-2/50 px-4 py-2.5 text-xs">
        {meta.map((item) => (
          <div key={item.label} className="flex gap-1.5">
            <dt className="text-fg-subtle">{item.label}</dt>
            <dd className="font-semibold text-fg-muted first-letter:uppercase">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
