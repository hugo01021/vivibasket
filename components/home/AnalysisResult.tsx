import type { ReactNode } from "react";
import { HOME_COMPETITIONS } from "@/data/matches";
import type { MatchAnalysis, Result, TeamAnalysis } from "@/lib/home-analysis";
import { cn } from "@/lib/utils";

const oneDecimal = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const shortDate = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "UTC" });

function signed(value: number): string {
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${oneDecimal.format(Math.abs(value))}`;
}

function FormPills({ form, align }: { form: Result[]; align: "start" | "end" }) {
  return (
    <ol className={cn("flex gap-1", align === "end" && "justify-end")} aria-label={`Forme : ${form.join(" ")}`}>
      {form.map((r, i) => (
        <li
          key={i}
          aria-hidden="true"
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-[3px] text-[10px] font-bold",
            r === "V" ? "bg-win/10 text-win/80" : "bg-loss/10 text-loss/80",
          )}
        >
          {r}
        </li>
      ))}
    </ol>
  );
}

/** Ligne de comparaison : valeur domicile | libellé | valeur extérieur. */
function CompareRow({ label, home, away, better }: { label: string; home: ReactNode; away: ReactNode; better?: "home" | "away" }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-t border-line py-2.5 text-sm tabular-nums">
      <div className={cn(better === "away" ? "text-dim" : "text-fg", better === "home" && "font-semibold")}>{home}</div>
      <div className="text-center text-[11px] uppercase tracking-[0.06em] text-dim">{label}</div>
      <div className={cn("text-right", better === "home" ? "text-dim" : "text-fg", better === "away" && "font-semibold")}>{away}</div>
    </div>
  );
}

function best(home: number, away: number, higherIsBetter = true): "home" | "away" | undefined {
  if (home === away) return undefined;
  return (home > away) === higherIsBetter ? "home" : "away";
}

function Injuries({ side }: { side: TeamAnalysis }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-fg">{side.team.name}</p>
      {side.injuries.length === 0 ? (
        <p className="text-xs text-dim">Aucun blessé signalé</p>
      ) : (
        <ul className="space-y-1">
          {side.injuries.map((p, i) => (
            <li key={i} className="flex items-baseline justify-between gap-3 text-xs">
              <span className="min-w-0 truncate">
                <span className="text-fg">{p.name}</span>
                <span className="text-dim">
                  {" "}
                  · {p.position} · {p.injury}
                </span>
              </span>
              <span className={cn("shrink-0", p.status === "Absent" ? "text-fg" : "text-dim")}>{p.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AnalysisResult({ analysis }: { analysis: MatchAnalysis }) {
  const { home, away, headToHead } = analysis;
  const competition = HOME_COMPETITIONS.find((c) => c.id === analysis.competition)?.label;
  const h2hHomeWins = headToHead.filter((g) =>
    g.home === home.team.name ? g.homeScore > g.awayScore : g.awayScore > g.homeScore,
  ).length;
  const homeFavorite = home.winProb >= away.winProb;

  return (
    <article aria-label={`Analyse ${home.team.name} contre ${away.team.name}`} className="rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5 text-[11px] uppercase tracking-[0.08em] text-dim sm:px-5">
        <span>{competition}</span>
        <span>Données fictives</span>
      </div>

      <div className="px-4 pb-2 pt-4 sm:px-5">
        {/* Duel : probabilité · domicile – extérieur · probabilité */}
        <div className="flex items-baseline justify-between text-[11px] uppercase tracking-[0.08em] text-dim">
          <span>Domicile</span>
          <span>Probabilité de victoire</span>
          <span>Extérieur</span>
        </div>
        <h3 className="mt-2 grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-x-2 sm:gap-x-3">
          <span className={cn("font-display text-3xl font-bold leading-none tabular sm:text-4xl", homeFavorite ? "text-accent" : "text-fg-muted")}>
            {home.winProb}
            <span className="text-sm"> %</span>
          </span>
          <span className={cn("min-w-0 text-right font-display text-lg font-bold uppercase leading-tight sm:text-2xl", !homeFavorite && "text-fg-muted")}>
            {home.team.name}
          </span>
          <span aria-hidden="true" className="text-lg text-fg-subtle sm:text-2xl">
            –
          </span>
          <span className={cn("min-w-0 font-display text-lg font-bold uppercase leading-tight sm:text-2xl", homeFavorite && "text-fg-muted")}>
            {away.team.name}
          </span>
          <span className={cn("text-right font-display text-3xl font-bold leading-none tabular sm:text-4xl", !homeFavorite ? "text-accent" : "text-fg-muted")}>
            {away.winProb}
            <span className="text-sm"> %</span>
          </span>
        </h3>

        <div className="mt-3">
          <div
            className="flex h-2 overflow-hidden rounded-[2px] bg-surface-3"
            role="img"
            aria-label={`${home.team.name} ${home.winProb} %, ${away.team.name} ${away.winProb} %`}
          >
            <div className={homeFavorite ? "bg-accent" : "bg-info/70"} style={{ width: `${home.winProb}%` }} />
            <div className="w-px bg-bg" />
            <div className={cn("flex-1", !homeFavorite ? "bg-accent" : "bg-info/70")} />
          </div>
        </div>

        {/* Comparatif */}
        <div className="mt-5">
          <CompareRow
            label="Forme"
            home={<FormPills form={home.form} align="start" />}
            away={<FormPills form={away.form} align="end" />}
          />
          <CompareRow
            label="Dom. / Ext."
            home={`${home.venueRecord.wins}-${home.venueRecord.losses} à dom.`}
            away={`${away.venueRecord.wins}-${away.venueRecord.losses} à l’ext.`}
            better={best(
              home.venueRecord.wins / (home.venueRecord.wins + home.venueRecord.losses),
              away.venueRecord.wins / (away.venueRecord.wins + away.venueRecord.losses),
            )}
          />
          <CompareRow
            label="Pts marqués"
            home={oneDecimal.format(home.pointsFor)}
            away={oneDecimal.format(away.pointsFor)}
            better={best(home.pointsFor, away.pointsFor)}
          />
          <CompareRow
            label="Pts encaissés"
            home={oneDecimal.format(home.pointsAgainst)}
            away={oneDecimal.format(away.pointsAgainst)}
            better={best(home.pointsAgainst, away.pointsAgainst, false)}
          />
          <CompareRow
            label="Écart moyen"
            home={signed(home.pointsFor - home.pointsAgainst)}
            away={signed(away.pointsFor - away.pointsAgainst)}
            better={best(home.pointsFor - home.pointsAgainst, away.pointsFor - away.pointsAgainst)}
          />
        </div>
      </div>

      <div className="grid border-t border-line md:grid-cols-2">
        <section className="px-4 py-4 sm:px-5 md:border-r md:border-line">
          <h4 className="mb-2 flex items-baseline justify-between text-[11px] uppercase tracking-[0.08em] text-dim">
            Confrontations directes
            <span className="tabular-nums normal-case tracking-normal text-fg">
              {home.team.short} {h2hHomeWins}–{headToHead.length - h2hHomeWins} {away.team.short}
            </span>
          </h4>
          <ul className="text-xs tabular-nums">
            {headToHead.map((g, i) => {
              const homeWon = g.homeScore > g.awayScore;
              const short = (name: string) => (name === home.team.name ? home.team.short : away.team.short);
              return (
                <li key={i} className="grid grid-cols-[4.5rem_1fr] gap-2 py-1">
                  <span className="text-dim">{shortDate.format(new Date(g.date))}</span>
                  <span className="grid grid-cols-[2.5rem_auto_2.5rem] justify-start gap-2">
                    <span className={homeWon ? "font-semibold text-fg" : "text-dim"}>{short(g.home)}</span>
                    <span>
                      <span className={homeWon ? "text-fg" : "text-dim"}>{g.homeScore}</span>
                      <span className="text-dim"> – </span>
                      <span className={!homeWon ? "text-fg" : "text-dim"}>{g.awayScore}</span>
                    </span>
                    <span className={!homeWon ? "font-semibold text-fg" : "text-dim"}>{short(g.away)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="border-t border-line px-4 py-4 sm:px-5 md:border-t-0">
          <h4 className="mb-2 text-[11px] uppercase tracking-[0.08em] text-dim">Blessés</h4>
          <div className="space-y-3">
            <Injuries side={home} />
            <Injuries side={away} />
          </div>
        </section>
      </div>
    </article>
  );
}
