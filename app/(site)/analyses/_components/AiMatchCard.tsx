import Link from "next/link";
import type { Competition, InsightTone, Match, MatchAnalysis, Team } from "@/types";
import { cn } from "@/lib/utils";
import { MatchStatus } from "@/components/match/MatchStatus";
import { TeamBadge } from "@/components/team/TeamBadge";

const TONE_DOT: Record<InsightTone, string> = {
  positive: "bg-win",
  negative: "bg-loss",
  neutral: "bg-fg-subtle",
};

const TONE_LABEL: Record<InsightTone, string> = {
  positive: "Point fort",
  negative: "Point faible",
  neutral: "Observation",
};

function pct(value: number): number {
  return Math.round(value * 100);
}

/** Probabilité de victoire (avant-match), barre à deux segments étiquetés. */
export function WinProbabilityBar({
  analysis,
  homeTeam,
  awayTeam,
}: {
  analysis: MatchAnalysis;
  homeTeam: Team;
  awayTeam: Team;
}) {
  const home = pct(analysis.winProbability.home);
  const away = 100 - home;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-semibold tabular">
        <span className="text-fg">
          {homeTeam.abbreviation} {home} %
        </span>
        <span className="text-fg-subtle">Probabilité de victoire</span>
        <span className="text-fg">
          {away} % {awayTeam.abbreviation}
        </span>
      </div>
      <div
        className="flex h-2 gap-0.5 overflow-hidden rounded-full"
        role="img"
        aria-label={`Probabilité de victoire : ${homeTeam.name} ${home} %, ${awayTeam.name} ${away} %`}
      >
        <span className="rounded-l-full bg-accent" style={{ width: `${home}%` }} />
        <span className="rounded-r-full bg-info" style={{ width: `${away}%` }} />
      </div>
    </div>
  );
}

/** Carte « Analyse IA » d'un match : score, résumé, probabilité, points clés. */
export function AiMatchCard({
  match,
  analysis,
  competition,
  homeTeam,
  awayTeam,
  maxInsights = 3,
}: {
  match: Match;
  analysis: MatchAnalysis;
  competition: Competition;
  homeTeam: Team;
  awayTeam: Team;
  maxInsights?: number;
}) {
  const live = match.status === "live" || match.status === "halftime";
  const showScore = live || match.status === "finished";
  const headingId = `analyse-${match.id}`;

  return (
    <article
      aria-labelledby={headingId}
      className={cn(
        "flex flex-col rounded-card border bg-surface shadow-card",
        live ? "border-accent/40" : "border-border",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2 text-xs">
        <span className="flex min-w-0 items-center gap-1.5 text-fg-muted">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: competition.accentColor }} aria-hidden="true" />
          <span className="truncate">
            {competition.name} · {match.round}
          </span>
        </span>
        <MatchStatus match={match} />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <h2 id={headingId} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
          <span className="flex min-w-0 items-center justify-end gap-2 font-bold">
            <span className="truncate text-right">{homeTeam.shortName}</span>
            <TeamBadge team={homeTeam} size="md" />
          </span>
          <span
            className={cn(
              "min-w-[4.5rem] rounded-md px-2 py-1 text-center text-base font-extrabold tabular",
              live ? "bg-accent-soft text-accent" : showScore ? "bg-surface-3 text-fg" : "text-fg-subtle",
            )}
          >
            {showScore ? `${match.homeScore} – ${match.awayScore}` : "vs"}
          </span>
          <span className="flex min-w-0 items-center gap-2 font-bold">
            <TeamBadge team={awayTeam} size="md" />
            <span className="truncate">{awayTeam.shortName}</span>
          </span>
        </h2>

        <p className="text-sm leading-relaxed text-fg">{analysis.summary}</p>

        <WinProbabilityBar analysis={analysis} homeTeam={homeTeam} awayTeam={awayTeam} />

        {analysis.insights.length > 0 && (
          <ul className="space-y-2.5">
            {analysis.insights.slice(0, maxInsights).map((insight, i) => (
              <li key={i} className="flex gap-2.5 text-sm">
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", TONE_DOT[insight.tone])} aria-hidden="true" />
                <span className="min-w-0">
                  <span className="sr-only">{TONE_LABEL[insight.tone]} : </span>
                  <span className="font-semibold text-fg">{insight.title}</span>
                  <span className="block text-fg-muted">{insight.body}</span>
                </span>
              </li>
            ))}
          </ul>
        )}

        <Link
          href={`/match/${match.id}?onglet=analyse`}
          className="mt-auto inline-flex items-center gap-1 self-start text-sm font-semibold text-accent hover:text-accent-hover"
        >
          Analyse complète <span aria-hidden="true">→</span>
          <span className="sr-only">
            {" "}
            de {homeTeam.name} – {awayTeam.name}
          </span>
        </Link>
      </div>
    </article>
  );
}
