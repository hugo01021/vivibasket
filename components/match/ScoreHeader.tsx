import Link from "next/link";
import type { Match, MatchDetails, Team } from "@/types";
import { formatLongDate, formatMatchDayLabel, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TeamBadge } from "@/components/team/TeamBadge";
import { MatchStatus } from "./MatchStatus";

/** Sur-titres et libellés de colonnes (charte). */
const LABEL = "text-[11px] uppercase tracking-[0.08em] text-fg-muted";

function TeamSide({ team, side, emphasis }: { team: Team; side: "home" | "away"; emphasis: "win" | "loss" | "none" }) {
  const away = side === "away";
  return (
    <div className={cn("flex min-w-0 items-center gap-3", away && "flex-row-reverse text-right")}>
      <span className="hidden shrink-0 sm:block">
        <TeamBadge team={team} size="lg" />
      </span>
      <div className="min-w-0">
        <p className={LABEL}>{away ? "Extérieur" : "Domicile"}</p>
        <Link
          href={`/equipes/${team.id}`}
          className={cn(
            "mt-0.5 block break-words py-1 font-display text-lg font-bold uppercase leading-none transition-colors hover:text-accent sm:text-2xl",
            emphasis === "loss" ? "text-fg-muted" : "text-fg",
          )}
        >
          <span className="sm:hidden">{team.shortName}</span>
          <span className="hidden sm:inline">{team.name}</span>
        </Link>
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
      <div className="flex flex-col items-center gap-1.5 text-center">
        {unavailable ? (
          <span className="font-display text-2xl font-bold uppercase leading-none text-fg-muted sm:text-3xl">
            {match.status === "postponed" ? "Reporté" : "Annulé"}
          </span>
        ) : (
          <>
            <span className="font-display text-4xl font-bold leading-none tabular sm:text-5xl lg:text-6xl">{formatTime(match.date)}</span>
            <span className={LABEL}>{formatMatchDayLabel(match.date)}</span>
          </>
        )}
      </div>
    );
  }

  const homeWon = finished && match.homeScore > match.awayScore;
  const awayWon = finished && match.awayScore > match.homeScore;
  // Très grand sur desktop, plafonné à text-4xl sur mobile pour laisser la place aux noms d'équipes
  const scoreClass = (lost: boolean) => cn("text-4xl sm:text-6xl lg:text-7xl", live ? "text-accent" : lost ? "text-fg-muted" : "text-fg");

  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="flex items-baseline gap-1.5 font-display font-bold leading-none tabular sm:gap-3">
        <span className="sr-only">Score : </span>
        <span className={scoreClass(awayWon)}>{match.homeScore}</span>
        <span className="text-2xl text-fg-subtle sm:text-4xl lg:text-5xl" aria-hidden="true">
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
  const cell = "px-2 py-1 text-center tabular";

  const row = (team: Team, side: "home" | "away") => (
    <tr>
      <th scope="row" className="py-1 pr-3 text-left font-semibold">
        {team.abbreviation}
      </th>
      {match.periods.map((p) => {
        const own = side === "home" ? p.home : p.away;
        const opp = side === "home" ? p.away : p.home;
        return (
          <td key={p.period} className={cn(cell, own > opp ? "font-semibold text-fg" : "text-fg-muted", p.period === currentPeriod && "bg-accent-soft")}>
            {own}
          </td>
        );
      })}
      <td className={cn(cell, "font-bold", live ? "text-accent" : "text-fg")}>{side === "home" ? match.homeScore : match.awayScore}</td>
    </tr>
  );

  return (
    <div className="overflow-x-auto scrollbar-none">
      <table className="mx-auto w-full max-w-md text-sm">
        <caption className="sr-only">Score par période</caption>
        <thead>
          <tr className={LABEL}>
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
        <tbody className="divide-y divide-border">
          {row(homeTeam, "home")}
          {row(awayTeam, "away")}
        </tbody>
      </table>
    </div>
  );
}

/** En-tête de la page match : compétition, équipes, score, statut, score par période, infos pratiques. */
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
    <section aria-label="Score du match" className={cn("rounded-md border bg-surface", live ? "border-accent/50" : "border-border")}>
      <div className={cn("border-b border-border px-4", LABEL)}>
        <Link href={`/competitions/${competition.slug}`} className="block truncate py-3 transition-colors hover:text-fg sm:py-2">
          <span className="text-fg">{competition.name}</span>
          {match.stage && match.stage !== match.round ? ` · ${match.stage}` : ""} · {match.round}
        </Link>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 py-4 sm:gap-6 sm:px-5 sm:py-5">
        <TeamSide team={homeTeam} side="home" emphasis={homeEmphasis} />
        <CenterScore match={match} />
        <TeamSide team={awayTeam} side="away" emphasis={awayEmphasis} />
      </div>

      {match.periods.length > 0 && (
        <div className="border-t border-border px-4 py-2">
          <PeriodTable match={match} homeTeam={homeTeam} awayTeam={awayTeam} />
        </div>
      )}

      <dl className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border px-4 py-2 text-xs">
        {meta.map((item) => (
          <div key={item.label} className="flex gap-1.5">
            <dt className="text-fg-subtle">{item.label}</dt>
            <dd className="text-fg-muted first-letter:uppercase">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
