"use client";

import { useState } from "react";
import { HOME_COMPETITIONS, HOME_TEAMS, TODAY_MATCHES, type HomeCompetitionId, type TodayMatch } from "@/data/matches";
import { cn } from "@/lib/utils";

const teamByName = new Map(HOME_TEAMS.map((t) => [t.name, t]));

/** Pourcentage de victoire, en gros, en orange pour le favori. */
function Prob({ value, favorite, align }: { value: number; favorite: boolean; align: "left" | "right" }) {
  return (
    <span
      className={cn(
        "w-12 shrink-0 font-display text-xl font-bold leading-none tabular sm:w-14 sm:text-2xl",
        align === "right" ? "text-right" : "text-left",
        favorite ? "text-accent" : "text-fg-muted",
      )}
    >
      {value}
      <span className="text-xs sm:text-sm"> %</span>
    </span>
  );
}

interface TodayMatchesProps {
  /** « Mardi 30 septembre », calculé côté serveur en heure de Paris. */
  dateLabel: string;
  onAnalyze: (match: TodayMatch) => void;
}

export function TodayMatches({ dateLabel, onAnalyze }: TodayMatchesProps) {
  const [active, setActive] = useState<HomeCompetitionId>(HOME_COMPETITIONS[0].id);
  const matches = TODAY_MATCHES.filter((m) => m.competition === active).sort((a, b) => a.time.localeCompare(b.time));
  const countFor = (id: HomeCompetitionId) => TODAY_MATCHES.filter((m) => m.competition === id).length;

  return (
    <section id="matchs" aria-labelledby="titre-matchs" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-border">
        <div className="pb-3">
          <h2 id="titre-matchs" className="font-display text-3xl font-bold uppercase leading-none">
            Matchs du jour
          </h2>
          <p className="mt-1.5 text-sm text-fg-muted">
            <span className="inline-block first-letter:uppercase">{dateLabel}</span> · heures de Paris
          </p>
        </div>
        <div role="tablist" aria-label="Compétition" className="-mb-px flex gap-5">
          {HOME_COMPETITIONS.map((c) => {
            const selected = c.id === active;
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="liste-matchs"
                onClick={() => setActive(c.id)}
                className={cn(
                  "-mb-px flex h-10 items-baseline gap-1.5 border-b-2 text-sm transition-colors",
                  selected ? "border-accent text-fg" : "border-transparent text-fg-muted hover:text-fg",
                )}
              >
                {c.label}
                <span className={cn("text-[11px] tabular", selected ? "text-accent" : "text-fg-subtle")}>{countFor(c.id)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-3 text-xs text-fg-muted">
        Équipe à domicile à gauche, équipe à l’extérieur à droite. De chaque côté, sa probabilité de victoire estimée :
        <span className="text-accent"> le favori en orange</span>, <span className="text-info">l’outsider en bleu</span>.
      </p>

      <ul id="liste-matchs" role="tabpanel" className="mt-2 divide-y divide-border">
        {matches.map((m) => {
          const home = teamByName.get(m.home);
          const away = teamByName.get(m.away);
          if (!home || !away) return null;
          const homeFav = m.homeWinProb >= 50;
          const awayProb = 100 - m.homeWinProb;
          return (
            <li key={m.id}>
              <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 py-3.5 transition-colors hover:bg-surface sm:grid-cols-[3.5rem_1fr_auto] sm:gap-y-0 sm:px-2">
                <time className="font-display text-xl font-bold leading-none tabular text-fg">{m.time}</time>
                <button
                  type="button"
                  onClick={() => onAnalyze(m)}
                  aria-label={`Analyser ${m.home} contre ${m.away}`}
                  className="h-9 rounded-[4px] border border-border px-3.5 text-xs font-semibold text-fg transition-colors hover:border-accent hover:text-accent sm:col-start-3 sm:h-8"
                >
                  Analyser
                </button>

                {/* Duel : probabilité · domicile – extérieur · probabilité, puis la barre de partage */}
                <div className="col-span-2 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Prob value={m.homeWinProb} favorite={homeFav} align="left" />
                    <span className={cn("min-w-0 flex-1 truncate text-right text-[15px]", homeFav ? "font-semibold text-fg" : "text-fg-muted")}>
                      <span className="sm:hidden">{home.shortName}</span>
                      <span className="hidden sm:inline">{home.name}</span>
                    </span>
                    <span aria-hidden="true" className="shrink-0 text-fg-subtle">
                      –
                    </span>
                    <span className={cn("min-w-0 flex-1 truncate text-[15px]", !homeFav ? "font-semibold text-fg" : "text-fg-muted")}>
                      <span className="sm:hidden">{away.shortName}</span>
                      <span className="hidden sm:inline">{away.name}</span>
                    </span>
                    <Prob value={awayProb} favorite={!homeFav} align="right" />
                  </div>
                  <div className="mt-2 flex h-1 overflow-hidden rounded-[2px] bg-surface-3" aria-hidden="true">
                    <div className={homeFav ? "bg-accent" : "bg-info/70"} style={{ width: `${m.homeWinProb}%` }} />
                    <div className="w-px bg-bg" />
                    <div className={cn("flex-1", !homeFav ? "bg-accent" : "bg-info/70")} />
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
