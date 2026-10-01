"use client";

import { useMemo, useState } from "react";
import { LEAGUES, LEAGUE_ORDER } from "~/lib/basket/teams";
import type { Fixture, LeagueId } from "~/lib/basket/types";
import { cn } from "~/lib/utils";
import { MatchCard } from "./MatchCard";

type Filter = "all" | LeagueId;

export function MatchList({ fixtures, highlightId = null }: { fixtures: Fixture[]; highlightId?: string | null }) {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = useMemo(() => (filter === "all" ? fixtures : fixtures.filter((f) => f.league === filter)), [fixtures, filter]);
  const counts = useMemo(() => {
    const map = new Map<Filter, number>([["all", fixtures.length]]);
    for (const l of LEAGUE_ORDER) map.set(l, fixtures.filter((f) => f.league === l).length);
    return map;
  }, [fixtures]);

  const filters: Array<{ id: Filter; label: string }> = [{ id: "all", label: "Tous" }, ...LEAGUE_ORDER.map((l) => ({ id: l, label: LEAGUES[l].name }))];

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Filtrer par ligue" className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {filters.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setFilter(f.id)}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-full border px-3 py-2.5 text-sm font-semibold transition-colors sm:px-4 sm:py-2",
                active ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface text-fg-muted hover:text-fg",
              )}
            >
              {f.label}
              <span className={cn("tabular rounded-full px-1.5 text-xs", active ? "bg-accent/20" : "bg-surface-3")}>{counts.get(f.id) ?? 0}</span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-card border border-dashed border-border-strong p-6 text-center text-sm text-fg-muted">
          Aucun match programmé dans cette ligue aujourd&apos;hui.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {visible.map((fixture) => (
            <li key={fixture.id} className="min-w-0 animate-rise">
              <MatchCard fixture={fixture} highlighted={fixture.id === highlightId} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
