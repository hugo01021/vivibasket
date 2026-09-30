import type { Metadata } from "next";
import type { CompetitionCategory, StandingRow } from "@/types";
import { api } from "@/lib/api";
import { groupBy } from "@/lib/utils";
import { CompetitionCard } from "@/components/competition/CompetitionCard";
import { SectionTitle } from "@/components/ui/SectionTitle";

export const metadata: Metadata = {
  title: "Compétitions",
  description: "NBA, EuroLeague, EuroCup, compétitions FIBA et championnats nationaux : classements, calendriers et résultats.",
};

const CATEGORIES: Array<{ value: CompetitionCategory; label: string }> = [
  { value: "nba", label: "NBA" },
  { value: "europe", label: "Coupes d’Europe" },
  { value: "international", label: "International" },
  { value: "national", label: "Championnats nationaux" },
  { value: "other", label: "Autres" },
];

/** Meilleure équipe d'un classement (tous groupes confondus). */
function leaderOf(rows: StandingRow[]): StandingRow | undefined {
  return [...rows].sort((a, b) => b.winPct - a.winPct || b.wins - a.wins || b.pointDiff - a.pointDiff)[0];
}

export default async function CompetitionsPage() {
  const [competitions, live, teams] = await Promise.all([api.getCompetitions(), api.getLiveMatches(), api.getTeams()]);
  const standings = await Promise.all(competitions.map((c) => api.getStandings(c.id)));
  const leaders = new Map(competitions.map((c, i) => [c.id, leaderOf(standings[i])]));
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const liveCount = new Map<string, number>();
  for (const match of live) liveCount.set(match.competitionId, (liveCount.get(match.competitionId) ?? 0) + 1);
  const byCategory = groupBy(competitions, (c) => c.category);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl font-bold uppercase leading-none sm:text-5xl">Compétitions</h1>
        <p className="mt-2 text-sm text-fg-muted">
          {competitions.length} compétitions suivies
          {live.length > 0 && (
            <>
              {" "}
              · <span className="font-semibold text-live">{live.length} match{live.length > 1 ? "s" : ""} en direct</span>
            </>
          )}
        </p>
      </div>

      {CATEGORIES.map(({ value, label }) => {
        const items = byCategory.get(value);
        if (!items || items.length === 0) return null;
        return (
          <section key={value} aria-labelledby={`categorie-${value}`}>
            <SectionTitle count={items.length}>
              <span id={`categorie-${value}`}>{label}</span>
            </SectionTitle>
            <ul className="divide-y divide-border">
              {items.map((competition) => {
                const leader = leaders.get(competition.id);
                return (
                  <li key={competition.id}>
                    <CompetitionCard
                      competition={competition}
                      liveCount={liveCount.get(competition.id) ?? 0}
                      leader={leader}
                      leaderTeam={leader ? teamMap.get(leader.teamId) : undefined}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
