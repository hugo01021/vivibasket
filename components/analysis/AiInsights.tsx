import type { ReactNode } from "react";
import Link from "next/link";
import type { AnalysisInsight, FormResult, InsightTone, MatchAnalysis, MatchStatus, Player, Team } from "@/types";
import { formatTime, fullPlayerName } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FormIndicator } from "@/components/team/FormIndicator";
import { TeamBadge } from "@/components/team/TeamBadge";
import { periodShortLabel } from "@/components/match/periods";

/** Sur-titres des cartes (charte). */
const LABEL = "text-[11px] uppercase tracking-[0.08em] text-fg-muted";

/* Tonalité des points clés : orange / blanc / gris (le vert et le rouge restent réservés aux V/D). */
const TONES: Record<InsightTone, { label: string; className: string }> = {
  positive: { label: "Atout", className: "text-accent" },
  negative: { label: "Point faible", className: "text-fg" },
  neutral: { label: "À noter", className: "text-fg-muted" },
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
    <section className={cn("rounded-md border border-border bg-surface p-4", className)}>
      <header className="mb-3 flex items-center justify-between gap-3">
        <h3 className={LABEL}>{title}</h3>
        {action}
      </header>
      {children}
    </section>
  );
}

/** Barre de probabilité de victoire : domicile en orange, extérieur en bleu, le favori en blanc. */
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
  const homeFavorite = home >= away;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 font-display text-3xl font-bold leading-none tabular">
        <span className={homeFavorite ? "text-fg" : "text-fg-muted"}>{home} %</span>
        <span className={!homeFavorite ? "text-fg" : "text-fg-muted"}>{away} %</span>
      </div>
      <div
        className="flex h-2 overflow-hidden rounded-[2px] bg-surface-3"
        role="img"
        aria-label={`Probabilité de victoire : ${homeTeam.shortName} ${home} %, ${awayTeam.shortName} ${away} %`}
      >
        <div className="bg-accent" style={{ width: `${home}%` }} />
        <div className="w-px bg-bg" />
        <div className="flex-1 bg-info" />
      </div>
      <div className="mt-1.5 flex justify-between gap-3 text-xs text-fg-muted">
        <span className="truncate">{homeTeam.shortName}</span>
        <span className="truncate text-right">{awayTeam.shortName}</span>
      </div>
    </div>
  );
}

/** Jauge de forme /10 : barre aux couleurs de l'équipe (domicile orange, extérieur bleu), meilleure note en blanc. */
function FormMeter({
  team,
  side,
  score,
  form,
  highlight,
}: {
  team: Team;
  side: "home" | "away";
  score: number;
  form?: FormResult[];
  highlight: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <TeamBadge team={team} size="xs" />
          <span className="truncate">{team.shortName}</span>
        </span>
        <span className={cn("font-display text-2xl font-bold leading-none tabular", highlight ? "text-fg" : "text-fg-muted")}>
          {score.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}
          <span className="font-sans text-xs font-normal text-fg-subtle">/10</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-[2px] bg-surface-3" aria-hidden="true">
        <div className={cn("h-full", side === "home" ? "bg-accent" : "bg-info")} style={{ width: `${Math.min(100, Math.max(0, score * 10))}%` }} />
      </div>
      {form && form.length > 0 && <FormIndicator form={form} />}
    </div>
  );
}

function InsightItem({ insight, team }: { insight: AnalysisInsight; team?: Team }) {
  const tone = TONES[insight.tone];
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <p className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] uppercase tracking-[0.08em]">
        <span className={cn("font-semibold", tone.className)}>{tone.label}</span>
        {team && <span className="text-fg-muted">{team.shortName}</span>}
      </p>
      <p className="text-[15px] font-semibold text-fg">{insight.title}</p>
      <p className="mt-0.5 text-sm leading-relaxed text-fg-muted">{insight.body}</p>
    </li>
  );
}

function KeyPlayer({ card, team }: { card?: KeyPlayerCard; team: Team }) {
  if (!card) {
    return <p className="rounded-md border border-dashed border-border p-3 text-sm text-fg-subtle">Joueur clé non disponible.</p>;
  }
  return (
    <div className="flex items-start gap-3">
      <TeamBadge team={team} size="md" />
      <div className="min-w-0">
        <Link href={`/joueurs/${card.player.id}`} className="block truncate text-[15px] font-semibold transition-colors hover:text-accent">
          {fullPlayerName(card.player)}
        </Link>
        <p className="text-xs text-fg-subtle">
          {team.shortName} · {card.player.position} · #{card.player.jerseyNumber}
        </p>
        <p className="mt-1 text-sm text-fg tabular">{card.statLine}</p>
        <p className="text-[11px] text-fg-subtle">{card.context}</p>
      </div>
    </div>
  );
}

/** Bloc « Analyse » : résumé, points clés, probabilité, forme, dynamique, joueurs clés. */
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
  const homeInForm = analysis.form.home >= analysis.form.away;

  return (
    <div className="space-y-4">
      <section aria-labelledby="titre-analyse" className="rounded-md border border-border bg-surface p-4 sm:p-5">
        <header className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h3 id="titre-analyse" className={LABEL}>
            Analyse
          </h3>
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
            <ul className="divide-y divide-border">
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
              <FormMeter team={homeTeam} side="home" score={analysis.form.home} form={form?.home} highlight={homeInForm} />
              <FormMeter team={awayTeam} side="away" score={analysis.form.away} form={form?.away} highlight={!homeInForm} />
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Dynamique par période">
          {analysis.momentum.length === 0 ? (
            <p className="text-sm text-fg-muted">La dynamique du match s’affichera période par période dès le coup d’envoi.</p>
          ) : (
            <ol className="divide-y divide-border">
              {analysis.momentum.map((point) => {
                const team = leaderTeam(point.leader);
                return (
                  // Liseré aux couleurs de l'équipe qui a dominé la période (domicile orange, extérieur bleu)
                  <li
                    key={point.period}
                    className={cn(
                      "grid grid-cols-[2.5rem_minmax(0,1fr)] items-baseline gap-3 border-l-2 py-2 pl-3 first:pt-0 last:pb-0",
                      point.leader === "home" ? "border-accent" : point.leader === "away" ? "border-info" : "border-border",
                    )}
                  >
                    <span className={cn("font-display text-lg font-bold leading-none tabular", team ? "text-fg" : "text-fg-muted")}>
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <KeyPlayer card={keyPlayers.home} team={homeTeam} />
            <KeyPlayer card={keyPlayers.away} team={awayTeam} />
          </div>
        </Card>
      </div>
    </div>
  );
}
