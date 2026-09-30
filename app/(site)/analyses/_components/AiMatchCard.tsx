import Link from "next/link";
import type { Competition, InsightTone, Match, MatchAnalysis, Team } from "@/types";
import { cn } from "@/lib/utils";
import { MatchStatus } from "@/components/match/MatchStatus";
import { TeamBadge } from "@/components/team/TeamBadge";

/** Marqueur textuel du point clé (pas de couleur : vert / rouge sont réservés aux V/D). */
const TONE_MARK: Record<InsightTone, string> = {
  positive: "+",
  negative: "−",
  neutral: "·",
};

const TONE_LABEL: Record<InsightTone, string> = {
  positive: "Point fort",
  negative: "Point faible",
  neutral: "Observation",
};

function pct(value: number): number {
  return Math.round(value * 100);
}

/** Probabilité de victoire (avant-match) : domicile en orange (accent), extérieur en bleu (info), barre à deux segments. */
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
      <div className="mb-1.5 flex items-baseline justify-between gap-2 font-display font-bold tabular">
        <span className="text-lg leading-none text-accent">
          {homeTeam.abbreviation} {home} %
        </span>
        <span className="font-sans text-[11px] font-normal uppercase tracking-[0.08em] text-fg-muted">Probabilité de victoire</span>
        <span className="text-lg leading-none text-info">
          {away} % {awayTeam.abbreviation}
        </span>
      </div>
      <div
        className="flex h-2 overflow-hidden rounded-[2px] bg-surface-3"
        role="img"
        aria-label={`Probabilité de victoire : ${homeTeam.name} ${home} %, ${awayTeam.name} ${away} %`}
      >
        <span className="bg-accent" style={{ width: `${home}%` }} />
        <span className="w-px bg-bg" />
        <span className="flex-1 bg-info" />
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
      className={cn("flex flex-col rounded-md border bg-surface", live ? "border-accent/40" : "border-border")}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2 text-[11px] uppercase tracking-[0.08em] text-fg-muted">
        <span className="truncate">
          {competition.name} · {match.round}
        </span>
        <MatchStatus match={match} />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <h2 id={headingId} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
          {/* Noms sur deux lignes si besoin plutôt que tronqués */}
          <span className="flex min-w-0 items-center justify-end gap-2 font-display text-lg font-bold uppercase leading-tight">
            <span className="min-w-0 text-right">{homeTeam.shortName}</span>
            <TeamBadge team={homeTeam} size="sm" />
          </span>
          <span
            className={cn(
              "min-w-[4.5rem] text-center tabular",
              showScore ? "font-display text-2xl font-bold leading-none" : "text-xs text-fg-muted",
              live ? "text-accent" : "text-fg",
            )}
          >
            {showScore ? `${match.homeScore} – ${match.awayScore}` : "vs"}
          </span>
          <span className="flex min-w-0 items-center gap-2 font-display text-lg font-bold uppercase leading-tight">
            <TeamBadge team={awayTeam} size="sm" />
            <span className="min-w-0">{awayTeam.shortName}</span>
          </span>
        </h2>

        <p className="text-sm leading-relaxed text-fg/85">{analysis.summary}</p>

        <WinProbabilityBar analysis={analysis} homeTeam={homeTeam} awayTeam={awayTeam} />

        {analysis.insights.length > 0 && (
          <ul className="space-y-2 border-t border-border pt-3">
            {analysis.insights.slice(0, maxInsights).map((insight, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span aria-hidden="true" className="w-3 shrink-0 text-center font-bold text-fg-muted">
                  {TONE_MARK[insight.tone]}
                </span>
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
          className="mt-auto inline-flex h-10 items-center self-start rounded-[4px] border border-border px-3 text-xs font-semibold text-fg transition-colors hover:border-accent hover:text-accent sm:h-8"
        >
          Analyse complète
          <span className="sr-only">
            {" "}
            de {homeTeam.name} – {awayTeam.name}
          </span>
        </Link>
      </div>
    </article>
  );
}
