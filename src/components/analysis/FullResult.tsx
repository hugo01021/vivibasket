import Link from "next/link";
import type { Factor, Injury, StatLine } from "~/lib/basket/types";
import { PLANS, type PlanId } from "~/lib/plans";
import { cn, formatDateShort, formatDateTime } from "~/lib/utils";
import { Badge, LiveBadge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Card, CardHeader } from "~/components/ui/Card";
import { IconLock, IconSpark, IconTrophy } from "~/components/ui/icons";
import type { RedactedResult } from "~/server/analyses/service";
import { ANALYSIS_STEPS } from "~/lib/basket/factors";
import { AssistantPanel } from "./AssistantPanel";

type Props = {
  result: RedactedResult;
  usage: { used: number; quota: number | null };
};

const FACTOR_LABEL: Record<string, string> = Object.fromEntries(ANALYSIS_STEPS.map((s) => [s.key, s.label]));

function fmtStat(line: StatLine, value: number): string {
  if (line.unit === "pct") return `${(value * 100).toFixed(1).replace(".", ",")} %`;
  return value.toFixed(1).replace(".", ",");
}

function better(line: StatLine): "home" | "away" | "even" {
  if (Math.abs(line.home - line.away) < 1e-9) return "even";
  const homeBetter = line.betterIs === "high" ? line.home > line.away : line.home < line.away;
  return homeBetter ? "home" : "away";
}

/** Étape 7 : analyse entièrement visible, sections filtrées selon l'offre. */
export function FullResult({ result, usage }: Props) {
  const plan = PLANS[result.plan];
  const { match, probabilities } = result;
  const live = match.status === "live";
  const gap = Math.abs(probabilities.home - probabilities.away);
  const favSide: "home" | "away" | null = gap < 2 ? null : probabilities.home > probabilities.away ? "home" : "away";
  const fav = favSide === "home" ? match.home : favSide === "away" ? match.away : null;
  const favPct = favSide === "home" ? probabilities.home : probabilities.away;
  const verdict = !fav
    ? "Match indécis : les deux équipes ont autant de chances de gagner."
    : gap < 16
      ? `${fav.name} a un léger avantage, mais le match s'annonce serré.`
      : gap < 40
        ? `${fav.name} est favori pour remporter ce match.`
        : `${fav.name} est largement favori pour remporter ce match.`;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 pb-16 pt-6 sm:px-6">
      {/* En-tête */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">{match.leagueName}</Badge>
          <span className="text-xs text-fg-muted">{match.phase}</span>
          {live ? <LiveBadge /> : null}
          <span className="ml-auto text-xs text-fg-subtle">Offre {plan.name}</span>
        </div>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-fg sm:text-4xl">
          {match.home.name} <span className="text-fg-subtle">vs</span> {match.away.name}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          {match.venue} · {formatDateTime(match.tipoff)}
        </p>
        {usage.quota !== null ? (
          <p className="tabular mt-2 text-xs text-fg-subtle">
            Analyse {Math.min(usage.used, usage.quota)}/{usage.quota} de votre quota mensuel
          </p>
        ) : null}
      </div>

      {/* Probabilités */}
      <Card className="p-5">
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-accent/40 bg-accent-soft/50 px-4 py-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink">
            <IconTrophy size={22} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-accent">{fav ? "Équipe favorite" : "Verdict"}</p>
            <p className="font-display text-xl font-extrabold leading-tight text-fg">{fav ? fav.name : "Égalité parfaite"}</p>
            <p className="mt-1 text-sm text-fg-muted">
              {fav ? (
                <>
                  <strong className="text-fg">{favPct.toFixed(0)} % de chances de gagner.</strong> {verdict}
                </>
              ) : (
                verdict
              )}
            </p>
          </div>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-fg-muted">
              {match.home.short} · domicile
              {favSide === "home" ? <Badge tone="accent">Favori</Badge> : null}
            </p>
            <p className={cn("tabular font-display text-5xl font-extrabold", favSide === "home" ? "text-accent" : "text-fg")}>{probabilities.home.toFixed(0)} %</p>
          </div>
          <div className="text-right">
            <p className="flex items-center justify-end gap-2 text-xs font-bold uppercase tracking-wide text-fg-muted">
              {favSide === "away" ? <Badge tone="accent">Favori</Badge> : null}
              {match.away.short} · extérieur
            </p>
            <p className={cn("tabular font-display text-5xl font-extrabold", favSide === "away" ? "text-accent" : "text-fg")}>{probabilities.away.toFixed(0)} %</p>
          </div>
        </div>
        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
          <div className="h-full bg-accent" style={{ width: `${probabilities.home}%` }} />
          <div className="h-full bg-fg-muted/60" style={{ width: `${probabilities.away}%` }} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {plan.access.projectedScore && result.projectedScore ? (
            <Stat label="Score projeté" value={`${result.projectedScore.home} – ${result.projectedScore.away}`} hint={`Total ${result.projectedScore.total} · écart ${result.projectedScore.spread > 0 ? "+" : ""}${result.projectedScore.spread}`} />
          ) : (
            <LockedStat label="Score projeté" requires="pro" analysisId={match.id} />
          )}
          {plan.access.projectedScore ? (
            <Stat label="Indice de confiance" value={`${probabilities.confidence} / 100`} hint={probabilities.confidence >= 75 ? "Signaux convergents" : "Signaux partiellement contradictoires"} />
          ) : (
            <LockedStat label="Indice de confiance" requires="pro" analysisId={match.id} />
          )}
        </div>
      </Card>

      {/* Direct (Elite) */}
      {live ? (
        result.live ? (
          <Card className="border-live/40 p-5">
            <CardHeader title="Analyse live" subtitle={result.live.label} aside={<LiveBadge />} />
            <div className="mt-4 flex items-center justify-between font-display text-4xl font-extrabold">
              <span>{result.live.home}</span>
              <span className="text-base text-fg-subtle">score actuel</span>
              <span>{result.live.away}</span>
            </div>
            <p className="mt-3 text-sm text-fg-muted">
              Probabilité de victoire {match.home.short} à cet instant : <strong className="text-fg">{result.live.winProbHome.toFixed(0)} %</strong>{" "}
              (contre {probabilities.home.toFixed(0)} % avant le match).
            </p>
          </Card>
        ) : (
          <LockedCard title="Analyse live" text="Probabilités recalculées en temps réel pendant le match." requires="elite" analysisId={match.id} />
        )
      ) : null}

      {/* Facteurs */}
      <Card>
        <CardHeader title="Les huit facteurs" subtitle="Chaque facteur est noté de 0 à 100 pour les deux équipes." />
        <ul className="mt-4 divide-y divide-border">
          {ANALYSIS_STEPS.map((step) => {
            const factor = result.factors.find((f) => f.key === step.key);
            if (factor) return <FactorRow key={step.key} factor={factor} homeShort={match.home.short} awayShort={match.away.short} />;
            return (
              <li key={step.key} className="flex items-center justify-between px-5 py-3 text-sm text-fg-subtle">
                <span className="font-semibold">{FACTOR_LABEL[step.key]}</span>
                <Link href={`/offres?analyse=${encodeURIComponent(match.id)}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
                  <IconLock size={14} /> Pro
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Forme & confrontations */}
      <Card className="p-5">
        <CardHeader title="Forme et confrontations directes" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormLine label={match.home.name} form={result.form.home} />
          <FormLine label={match.away.name} form={result.form.away} />
        </div>
        <ul className="mt-5 space-y-2 text-sm">
          {result.h2h.map((g) => {
            const homeIsFixtureHome = g.homeTeamId === match.home.id;
            const left = homeIsFixtureHome ? match.home.short : match.away.short;
            const right = homeIsFixtureHome ? match.away.short : match.home.short;
            return (
              <li key={g.date} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
                <span className="text-fg-muted">{formatDateShort(g.date)}</span>
                <span className="tabular font-semibold">
                  {left} {g.homeScore} – {g.awayScore} {right}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Value */}
      {result.value ? (
        <Card className="p-5">
          <CardHeader title="Détecteur de value" subtitle="Cotes de marché indicatives comparées à nos cotes « justes »." />
          <table className="tabular mt-4 w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-fg-muted">
              <tr>
                <th className="pb-2 font-semibold">Équipe</th>
                <th className="pb-2 text-right font-semibold">Marché</th>
                <th className="pb-2 text-right font-semibold">Juste</th>
                <th className="pb-2 text-right font-semibold">Écart</th>
              </tr>
            </thead>
            <tbody>
              {(["home", "away"] as const).map((side) => {
                const edge = result.value!.edge[side];
                return (
                  <tr key={side} className="border-t border-border">
                    <td className="py-2 font-semibold">{side === "home" ? match.home.name : match.away.name}</td>
                    <td className="py-2 text-right">{result.value!.market[side].toFixed(2)}</td>
                    <td className="py-2 text-right">{result.value!.fair[side].toFixed(2)}</td>
                    <td className={cn("py-2 text-right font-semibold", edge >= 3 ? "text-win" : edge <= -3 ? "text-loss" : "text-fg-muted")}>
                      {edge > 0 ? "+" : ""}
                      {edge.toFixed(1)} pt
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-fg-subtle">
            {result.value.pick
              ? `Value détectée sur ${result.value.pick === "home" ? match.home.name : match.away.name} : notre probabilité dépasse celle impliquée par le marché de plus de 3 points.`
              : "Aucune value significative : le marché valorise ce match comme notre modèle."}
          </p>
        </Card>
      ) : (
        <LockedCard title="Détecteur de value" text="Repère les écarts entre nos probabilités et les cotes du marché." requires="pro" analysisId={match.id} />
      )}

      {/* Stats */}
      {result.keyStats ? (
        <Card className="p-5">
          <CardHeader title="Statistiques comparées" subtitle="Saison en cours, pour 100 possessions quand c'est pertinent." />
          <StatTable lines={result.keyStats} homeShort={match.home.short} awayShort={match.away.short} />
          {result.advanced ? (
            <>
              <h3 className="mt-6 font-display text-base font-bold">Statistiques avancées</h3>
              <StatTable lines={result.advanced} homeShort={match.home.short} awayShort={match.away.short} />
            </>
          ) : (
            <p className="mt-5 flex items-center gap-2 text-sm text-fg-subtle">
              <IconLock size={16} /> Four factors, banc et « clutch » disponibles avec Elite.
            </p>
          )}
        </Card>
      ) : (
        <LockedCard title="Statistiques comparées" text="Ratings, eFG %, tirs à 3 points, balles perdues…" requires="pro" analysisId={match.id} />
      )}

      {/* Blessures */}
      {result.injuries ? (
        <Card className="p-5">
          <CardHeader title="Infirmerie" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <InjuryList label={match.home.name} injuries={result.injuries.home} />
            <InjuryList label={match.away.name} injuries={result.injuries.away} />
          </div>
        </Card>
      ) : null}

      {/* Résumé IA */}
      <Card className="p-5">
        <CardHeader
          title="Résumé rédigé par l'IA"
          aside={
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent">
              <IconSpark size={18} />
            </span>
          }
        />
        <ul className="mt-4 flex flex-wrap gap-2">
          {result.bullets.map((b) => (
            <li key={b} className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-semibold text-fg">
              {b}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[15px] leading-relaxed text-fg">{result.summary}</p>
        <p className="mt-4 text-xs text-fg-subtle">
          Texte généré automatiquement à partir des données disponibles le {formatDateTime(result.generatedAt)}
          {result.source === "api-sports" ? " (source : api-basketball)" : " (données de démonstration)"}. Une analyse n&apos;est jamais une garantie de
          résultat.
        </p>
        {result.notes && result.notes.length > 0 ? (
          <ul className="mt-2 space-y-0.5 text-xs text-fg-subtle">
            {result.notes.map((n) => (
              <li key={n}>· {n}</li>
            ))}
          </ul>
        ) : null}
      </Card>

      {/* Assistant */}
      {plan.access.assistant !== "none" ? (
        <AssistantPanel result={result} level={plan.access.assistant} />
      ) : (
        <LockedCard title="Assistant IA" text="Posez vos questions sur ce match et obtenez des réponses chiffrées." requires="pro" analysisId={match.id} />
      )}

      <div className="flex flex-col gap-2 pt-2 sm:flex-row">
        <Button href="/analyser" size="lg" className="sm:flex-1">
          Analyser un autre match
        </Button>
        <Button href="/compte" variant="secondary" size="lg" className="sm:flex-1">
          Mon compte
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-surface-2 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-fg-muted">{label}</p>
      <p className="tabular mt-1 font-display text-2xl font-extrabold text-fg">{value}</p>
      {hint ? <p className="mt-1 text-xs text-fg-subtle">{hint}</p> : null}
    </div>
  );
}

function LockedStat({ label, requires, analysisId }: { label: string; requires: PlanId; analysisId: string }) {
  return (
    <Link href={`/offres?analyse=${encodeURIComponent(analysisId)}`} className="rounded-xl border border-dashed border-border-strong p-4 hover:border-accent">
      <p className="text-xs font-bold uppercase tracking-wide text-fg-muted">{label}</p>
      <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
        <IconLock size={16} /> Disponible avec {PLANS[requires].name}
      </p>
    </Link>
  );
}

function LockedCard({ title, text, requires, analysisId }: { title: string; text: string; requires: PlanId; analysisId: string }) {
  return (
    <Card className="border-dashed p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-fg">{title}</h2>
          <p className="mt-0.5 text-sm text-fg-muted">{text}</p>
        </div>
        <Link href={`/offres?analyse=${encodeURIComponent(analysisId)}`} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent">
          <IconLock size={14} /> {PLANS[requires].name}
        </Link>
      </div>
    </Card>
  );
}

function FactorRow({ factor, homeShort, awayShort }: { factor: Factor; homeShort: string; awayShort: string }) {
  return (
    <li className="px-5 py-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-fg">{factor.label}</span>
        <span className={cn("text-xs font-bold uppercase tracking-wide", factor.edge === "even" ? "text-fg-subtle" : "text-accent")}>
          {factor.edge === "even" ? "Équilibre" : `Avantage ${factor.edge === "home" ? homeShort : awayShort}`}
        </span>
      </div>
      <div className="tabular mt-2 flex items-center gap-2 text-xs text-fg-muted">
        <span className="w-6 text-right">{factor.home}</span>
        <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
          <div className="h-full bg-accent" style={{ width: `${factor.home}%` }} />
          <div className="h-full bg-fg-muted/50" style={{ width: `${factor.away}%` }} />
        </div>
        <span className="w-6">{factor.away}</span>
      </div>
      <p className="mt-1.5 text-xs text-fg-muted">{factor.note}</p>
    </li>
  );
}

function FormLine({ label, form }: { label: string; form: Array<"V" | "D"> }) {
  return (
    <div>
      <p className="text-sm font-semibold text-fg">{label}</p>
      <div className="mt-2 flex gap-1.5" aria-label={`Cinq derniers matchs : ${form.join(", ")}`}>
        {form.map((r, i) => (
          <span
            key={i}
            className={cn("inline-flex h-8 w-8 items-center justify-center rounded-md text-xs font-extrabold", r === "V" ? "bg-win/20 text-win" : "bg-loss/20 text-loss")}
          >
            {r}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatTable({ lines, homeShort, awayShort }: { lines: StatLine[]; homeShort: string; awayShort: string }) {
  return (
    <table className="tabular mt-4 w-full text-sm">
      <thead className="text-xs uppercase tracking-wide text-fg-muted">
        <tr>
          <th className="pb-2 text-right font-semibold">{homeShort}</th>
          <th className="pb-2 text-center font-semibold">Statistique</th>
          <th className="pb-2 text-left font-semibold">{awayShort}</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => {
          const b = better(line);
          return (
            <tr key={line.key} className="border-t border-border">
              <td className={cn("py-2 text-right font-semibold", b === "home" ? "text-accent" : "text-fg")}>{fmtStat(line, line.home)}</td>
              <td className="py-2 text-center text-fg-muted">{line.label}</td>
              <td className={cn("py-2 text-left font-semibold", b === "away" ? "text-accent" : "text-fg")}>{fmtStat(line, line.away)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function InjuryList({ label, injuries }: { label: string; injuries: Injury[] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-fg">{label}</p>
      {injuries.length === 0 ? (
        <p className="mt-2 text-sm text-win">Effectif complet</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {injuries.map((inj) => (
            <li key={`${inj.role}-${inj.issue}`} className="rounded-lg bg-surface-2 px-3 py-2 text-sm">
              <p className="font-semibold text-fg">{inj.role}</p>
              <p className="text-xs text-fg-muted">
                {inj.issue} · <span className="capitalize">{inj.status}</span> · impact {inj.impact}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
