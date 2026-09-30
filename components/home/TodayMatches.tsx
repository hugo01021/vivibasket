"use client";

import { useState } from "react";
import { HOME_COMPETITIONS, HOME_TEAMS, TODAY_MATCHES, type HomeCompetitionId, type TodayMatch } from "@/data/matches";
import { cn } from "@/lib/utils";

const teamByName = new Map(HOME_TEAMS.map((t) => [t.name, t]));

/** Heure du coup d'envoi, chrono du direct ou « Terminé ». */
function Status({ match }: { match: TodayMatch }) {
  if (match.status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-live tabular">
        <span aria-hidden="true" className="relative inline-flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-live-pulse rounded-full bg-live" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
        </span>
        <span className="sr-only">En direct, </span>
        {match.clock}
      </span>
    );
  }
  if (match.status === "finished") {
    return (
      <span className="text-xs font-semibold text-fg-muted">
        Terminé
        <span className="sr-only">, coup d’envoi {match.time}</span>
      </span>
    );
  }
  return <time className="text-xs font-semibold text-fg tabular">{match.time}</time>;
}

/** Une ligne : statut · [score] domicile – extérieur [score]. */
function MatchLine({ match }: { match: TodayMatch }) {
  const home = teamByName.get(match.home);
  const away = teamByName.get(match.away);
  if (!home || !away) return null;
  const live = match.status === "live";
  const finished = match.status === "finished";
  const showScore = live || finished;
  const homeWon = finished && (match.homeScore ?? 0) > (match.awayScore ?? 0);
  const awayWon = finished && (match.awayScore ?? 0) > (match.homeScore ?? 0);
  const nameClass = (won: boolean, lost: boolean) => (won ? "font-semibold text-fg" : lost ? "text-fg-muted" : "text-fg/85");
  const scoreClass = (lost: boolean) =>
    cn("w-9 shrink-0 font-display text-xl font-bold leading-none tabular sm:w-11 sm:text-2xl", live ? "text-accent" : lost ? "text-fg-muted" : "text-fg");

  return (
    <li className="grid grid-cols-[4.25rem_minmax(0,1fr)] items-center gap-3 px-2 py-3 text-[13px] transition-colors hover:bg-surface sm:px-3 sm:text-[15px]">
      <Status match={match} />
      <span className="flex w-full items-center gap-2 sm:mx-auto sm:max-w-3xl sm:gap-3">
        {showScore && <span className={cn(scoreClass(awayWon), "text-left")}>{match.homeScore}</span>}
        <span className={cn("min-w-0 flex-1 truncate text-right", nameClass(homeWon, awayWon))}>
          <span className="sm:hidden">{home.shortName}</span>
          <span className="hidden sm:inline">{home.name}</span>
        </span>
        <span aria-hidden="true" className="shrink-0 text-fg-subtle">
          –
        </span>
        <span className={cn("min-w-0 flex-1 truncate", nameClass(awayWon, homeWon))}>
          <span className="sm:hidden">{away.shortName}</span>
          <span className="hidden sm:inline">{away.name}</span>
        </span>
        {showScore && <span className={cn(scoreClass(homeWon), "text-right")}>{match.awayScore}</span>}
      </span>
    </li>
  );
}

/** Tableau des matchs du jour : onglets par compétition, une ligne par match, aucune analyse (offre payante à venir). */
export function TodayMatches({ dateLabel }: { dateLabel: string }) {
  const [active, setActive] = useState<HomeCompetitionId>(HOME_COMPETITIONS[0].id);
  const matches = TODAY_MATCHES.filter((m) => m.competition === active).sort((a, b) => a.time.localeCompare(b.time));
  const liveCount = TODAY_MATCHES.filter((m) => m.status === "live").length;
  const countFor = (id: HomeCompetitionId) => TODAY_MATCHES.filter((m) => m.competition === id).length;

  return (
    <section id="matchs" aria-labelledby="titre-matchs" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-border">
        <div className="pb-3">
          <h2 id="titre-matchs" className="font-display text-3xl font-bold uppercase leading-none">
            Matchs du jour
          </h2>
          <p className="mt-1.5 text-sm text-fg-muted">
            {liveCount > 0 && (
              <>
                <span className="font-semibold text-live">
                  {liveCount} match{liveCount > 1 ? "s" : ""} en direct
                </span>
                {" · "}
              </>
            )}
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

      <ul id="liste-matchs" role="tabpanel" className="divide-y divide-border">
        {matches.map((m) => (
          <MatchLine key={m.id} match={m} />
        ))}
      </ul>
    </section>
  );
}
