import type { ReactNode } from "react";
import Link from "next/link";
import type { AnalysisInsight, FormResult, InsightTone, MatchAnalysis, MatchStatus, Player, Team } from "@/types";
import { formatTime, fullPlayerName } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FormIndicator } from "@/components/team/FormIndicator";
import { TeamBadge } from "@/components/team/TeamBadge";
import { periodShortLabel } from "@/components/match/periods";

const TONES: Record<InsightTone, { label: string; border: string; chip: string }> = {
  positive: { label: "Atout", border: "border-l-win", chip: "bg-win/15 text-win" },
  negative: { label: "Point faible", border: "border-l-loss", chip: "bg-loss/15 text-loss" },
  neutral: { label: "À noter", border: "border-l-info", chip: "bg-info/15 text-info" },
};

export interface KeyPlayerCard {
  player: Player;
  /** "28 pts · 7 reb · 5 pd" */
  statLine: string;
  /** "Ce soir", "Moyennes de la saison". */
  context: string;
}

function Card({ title, children, className, action }: { title: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={cn("rounded-card border border-border bg-surface p-4 shadow-card", className)}>
      <header className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-fg-subtle">{title}</h3>
        {action}
      </header>
      {children}
    </section>
  );
}

/** Barre de probabilité de victoire (domicile en accent, extérieur en bleu). */
export function WinProbabilityBar({
  probability,
  homeTeam,
  awayTeam,
}: {
  probability: MatchAnalysis["winProbability"];
  homeTeam: Team;
  awayTeam: Team;
}) {
  const home = Math.round(probability.home * 100);
  const away = 100 - home;
  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-3">
        <span className="flex items-center gap-2">
          <TeamBadge team={homeTeam} size="sm" />
          <span className="text-2xl font-extrabold text-fg tabular">{home} %</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="text-2xl font-extrabold text-fg tabular">{away} %</span>
          <TeamBadge team={awayTeam} size="sm" />
        </span>
      </div>
      <div
        className="flex h-2.5 gap-[2px] overflow-hidden rounded-full"
        role="img"
        aria-label={`Probabilité de victoire : ${homeTeam.shortName} ${home} %, ${awayTeam.shortName} ${away} %`}
      >
        <div className="h-full rounded-l-full bg-accent" style={{ width: `${home}%` }} />
        <div className="h-full rounded-r-full bg-info" style={{ width: `${away}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-fg-muted">
        <span>{homeTeam.shortName}</span>
        <span>{awayTeam.shortName}</span>
      </div>
    </div>
  );
}

function FormMeter({ team, score, form }: { team: Team; score: number; form?: FormResult[] }) {
  const color = score >= 6.5 ? "bg-win" : score <= 3.5 ? "bg-loss" : "bg-accent";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex min-w-0 items-center gap-2 font-semibold">
          <TeamBadge team={team} size="xs" />
          <span className="truncate">{team.shortName}</span>
        </span>
        <span className="font-extrabold tabular">
          {score.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}
          <span className="text-xs font-semibold text-fg-subtle">/10</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.min(100, Math.max(0, score * 10))}%` }} />
      </div>
      {form && form.length > 0 && <FormIndicator form={form} />}
    </div>
  );
}

function InsightItem({ insight, team }: { insight: AnalysisInsight; team?: Team }) {
  const tone = TONES[insight.tone];
  return (
    <li className={cn("rounded-lg border border-border border-l-4 bg-surface-2/60 p-3", tone.border)}>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", tone.chip)}>{tone.label}</span>
        {team && (
          <span className="flex items-center gap-1 text-xs text-fg-muted">
            <TeamBadge team={team} size="xs" />
            {team.shortName}
          </span>
        )}
      </div>
      <p className="font-bold text-fg">{insight.title}</p>
      <p className="mt-0.5 text-sm text-fg-muted">{insight.body}</p>
    </li>
  );
}

function KeyPlayer({ card, team }: { card?: KeyPlayerCard; team: Team }) {
  if (!card) {
    return <p className="rounded-lg border border-dashed border-border p-3 text-sm text-fg-subtle">Joueur clé non disponible.</p>;
  }
  return (
    <div className="flex items-center gap-3 rounded-lg bg-surface-2/60 p-3">
      <TeamBadge team={team} size="lg" />
      <div className="min-w-0">
        <Link href={`/joueurs/${card.player.id}`} className="block truncate font-bold hover:text-accent">
          {fullPlayerName(card.player)}
        </Link>
        <p className="text-xs text-fg-subtle">
          {team.shortName} · {card.player.position} · #{card.player.jerseyNumber}
        </p>
        <p className="mt-1 text-sm font-semibold text-fg tabular">{card.statLine}</p>
        <p className="text-[11px] text-fg-subtle">{card.context}</p>
      </div>
    </div>
  );
}

/** Bloc « Analyse IA » : résumé, points clés, probabilité, forme, dynamique, joueurs clés. */
export function AiInsights({
  analysis,
  homeTeam,
  awayTeam,
  status,
  keyPlayers,
  form,
}: {
  analysis: MatchAnalysis;
  homeTeam: Team;
  awayTeam: Team;
  status: MatchStatus;
  keyPlayers: { home?: KeyPlayerCard; away?: KeyPlayerCard };
  /** 5 derniers résultats (optionnel). */
  form?: { home?: FormResult[]; away?: FormResult[] };
}) {
  const teams = new Map([
    [homeTeam.id, homeTeam],
    [awayTeam.id, awayTeam],
  ]);
  const leaderTeam = (leader: "home" | "away" | "even") => (leader === "home" ? homeTeam : leader === "away" ? awayTeam : null);
  const upcoming = status === "scheduled" || status === "postponed" || status === "cancelled";

  return (
    <div className="space-y-4">
      <section className="rounded-card border border-accent/30 bg-gradient-to-br from-accent-soft/70 to-surface p-4 shadow-card sm:p-5">
        <header className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-accent-ink">Analyse IA</span>
          <span className="text-xs text-fg-subtle">
            {analysis.source === "llm" ? `Générée par ${analysis.model ?? "un modèle de langage"}` : "Générée automatiquement à partir des données"} · mise à jour à{" "}
            {formatTime(analysis.generatedAt)}
          </span>
        </header>
        <p className="text-[15px] leading-relaxed text-fg">{analysis.summary}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Points clés" className="lg:col-span-2">
          {analysis.insights.length === 0 ? (
            <p className="text-sm text-fg-muted">Pas encore de point clé pour ce match.</p>
          ) : (
            <ul className="space-y-2.5">
              {analysis.insights.map((insight, i) => (
                <InsightItem key={i} insight={insight} team={insight.teamId ? teams.get(insight.teamId) : undefined} />
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-4">
          <Card title={upcoming ? "Probabilité de victoire" : "Probabilité pré-match"}>
            <WinProbabilityBar probability={analysis.winProbability} homeTeam={homeTeam} awayTeam={awayTeam} />
          </Card>
          <Card title="Forme du moment">
            <div className="space-y-4">
              <FormMeter team={homeTeam} score={analysis.form.home} form={form?.home} />
              <FormMeter team={awayTeam} score={analysis.form.away} form={form?.away} />
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Dynamique par période">
          {analysis.momentum.length === 0 ? (
            <p className="text-sm text-fg-muted">La dynamique du match s’affichera période par période dès le coup d’envoi.</p>
          ) : (
            <ol className="space-y-2">
              {analysis.momentum.map((point) => {
                const team = leaderTeam(point.leader);
                return (
                  <li key={point.period} className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 inline-flex w-10 shrink-0 justify-center rounded-md px-1.5 py-1 text-xs font-extrabold tabular",
                        point.leader === "home" ? "bg-accent text-accent-ink" : point.leader === "away" ? "bg-info text-bg" : "bg-surface-3 text-fg-muted",
                      )}
                    >
                      {periodShortLabel(point.period)}
                    </span>
                    <div className="min-w-0 text-sm">
                      <p className="font-semibold text-fg">{team ? `Avantage ${team.shortName}` : "Période équilibrée"}</p>
                      <p className="text-fg-muted">{point.note}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>

        <Card title={upcoming ? "Joueurs à suivre" : "Joueurs clés"}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <KeyPlayer card={keyPlayers.home} team={homeTeam} />
            <KeyPlayer card={keyPlayers.away} team={awayTeam} />
          </div>
        </Card>
      </div>
    </div>
  );
}
