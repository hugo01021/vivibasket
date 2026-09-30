"use client";

import { useState } from "react";
import { HOME_COMPETITIONS, HOME_TEAMS, TODAY_MATCHES, type HomeCompetitionId, type TodayMatch } from "@/data/matches";
import { cn } from "@/lib/utils";

const shortName = new Map(HOME_TEAMS.map((t) => [t.name, t.short]));

interface TodayMatchesProps {
  onAnalyze: (match: TodayMatch) => void;
}

export function TodayMatches({ onAnalyze }: TodayMatchesProps) {
  const [active, setActive] = useState<HomeCompetitionId>(HOME_COMPETITIONS[0].id);
  const matches = TODAY_MATCHES.filter((m) => m.competition === active).sort((a, b) => a.time.localeCompare(b.time));

  return (
    <section id="matchs" aria-labelledby="titre-matchs" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-line">
        <h2 id="titre-matchs" className="pb-3 font-display text-3xl font-bold uppercase leading-none">
          Matchs du jour
        </h2>
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
                  "-mb-px border-b-2 pb-3 text-sm transition-colors",
                  selected ? "border-accent text-fg" : "border-transparent text-dim hover:text-fg",
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <ul id="liste-matchs" role="tabpanel" className="divide-y divide-line">
        {matches.map((m) => {
          const homeFav = m.homeWinProb >= 50;
          const favorite = homeFav ? m.home : m.away;
          const prob = homeFav ? m.homeWinProb : 100 - m.homeWinProb;
          return (
            <li key={m.id}>
              <div className="group grid grid-cols-[2.75rem_1fr_auto] items-center gap-3 py-3 transition-colors hover:bg-surface-2 sm:grid-cols-[3.5rem_1fr_9rem_auto] sm:gap-4 sm:px-2">
                <time className="text-sm tabular-nums text-dim">{m.time}</time>
                <div className="min-w-0">
                  <p className="text-sm leading-snug sm:truncate sm:text-[15px]">
                    <span className={homeFav ? "font-semibold text-fg" : "text-fg/85"}>{m.home}</span>
                    <span className="text-dim"> – </span>
                    <span className={!homeFav ? "font-semibold text-fg" : "text-fg/85"}>{m.away}</span>
                  </p>
                  <p className="text-xs tabular-nums text-dim sm:hidden">
                    {shortName.get(favorite)} {prob} %
                  </p>
                </div>
                <p className="hidden text-right text-xs tabular-nums text-dim sm:block">
                  <span className="text-fg/85">{shortName.get(favorite)}</span> {prob} %
                </p>
                <button
                  type="button"
                  onClick={() => onAnalyze(m)}
                  className="h-10 rounded-[4px] border border-line px-3 text-xs font-semibold text-fg transition-colors hover:border-accent hover:text-accent sm:h-8"
                >
                  Analyser
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
