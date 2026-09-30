"use client";

import { useState } from "react";
import { HOME_COMPETITIONS, HOME_TEAMS, TODAY_MATCHES, type HomeCompetitionId, type HomeTeam, type TodayMatch } from "@/data/matches";
import { cn } from "@/lib/utils";

const teamByName = new Map(HOME_TEAMS.map((t) => [t.name, t]));

/** Une équipe du match : écusson, nom, rôle (dom./ext.), barre et pourcentage de victoire. */
function TeamLine({ team, role, prob, favorite }: { team: HomeTeam; role: "Dom." | "Ext."; prob: number; favorite: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className={cn(
          "flex h-6 w-9 shrink-0 items-center justify-center rounded-[4px] border font-display text-[11px] font-bold tracking-wide",
          favorite ? "border-accent/40 bg-accent-soft text-accent" : "border-border bg-surface-2 text-fg-muted",
        )}
      >
        {team.short}
      </span>
      <span className={cn("min-w-0 flex-1 truncate text-sm", favorite ? "font-semibold text-fg" : "text-fg-muted")}>
        <span className="sm:hidden">{team.shortName}</span>
        <span className="hidden sm:inline">{team.name}</span>
        <span className="ml-1.5 text-[10px] font-normal uppercase tracking-[0.06em] text-fg-subtle">{role}</span>
      </span>
      <span className="h-1.5 w-16 shrink-0 overflow-hidden rounded-[2px] bg-surface-3 sm:w-28" aria-hidden="true">
        <span className={cn("block h-full rounded-[2px]", favorite ? "bg-accent" : "bg-info/70")} style={{ width: `${prob}%` }} />
      </span>
      <span className={cn("w-11 shrink-0 text-right font-display text-lg font-bold leading-none tabular", favorite ? "text-accent" : "text-fg-muted")}>
        {prob}
        <span className="text-xs"> %</span>
      </span>
    </div>
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
        Pour chaque match, la barre et le pourcentage indiquent la probabilité de victoire estimée de chaque équipe :
        <span className="text-accent"> le favori en orange</span>, <span className="text-info">l’outsider en bleu</span>.
      </p>

      <ul id="liste-matchs" role="tabpanel" className="mt-2 divide-y divide-border">
        {matches.map((m) => {
          const home = teamByName.get(m.home);
          const away = teamByName.get(m.away);
          if (!home || !away) return null;
          const homeFav = m.homeWinProb >= 50;
          return (
            <li key={m.id}>
              <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2.5 py-3.5 transition-colors hover:bg-surface sm:grid-cols-[3.5rem_1fr_auto] sm:gap-y-0 sm:px-2">
                <time className="font-display text-xl font-bold leading-none tabular text-fg">{m.time}</time>
                <button
                  type="button"
                  onClick={() => onAnalyze(m)}
                  aria-label={`Analyser ${m.home} contre ${m.away}`}
                  className="h-9 rounded-[4px] border border-border px-3.5 text-xs font-semibold text-fg transition-colors hover:border-accent hover:text-accent sm:col-start-3 sm:h-8"
                >
                  Analyser
                </button>
                <div className="col-span-2 space-y-1.5 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                  <TeamLine team={home} role="Dom." prob={m.homeWinProb} favorite={homeFav} />
                  <TeamLine team={away} role="Ext." prob={100 - m.homeWinProb} favorite={!homeFav} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
