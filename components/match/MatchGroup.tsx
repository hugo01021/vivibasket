import Link from "next/link";
import type { Competition, Match, Team } from "@/types";
import { MatchRow } from "./MatchRow";

/** Liste de matchs d'une compétition, avec en-tête cliquable. */
export function MatchGroup({
  competition,
  matches,
  teams,
  subtitle,
}: {
  competition: Competition;
  matches: Match[];
  teams: Map<string, Team>;
  subtitle?: string;
}) {
  return (
    <section aria-labelledby={`groupe-${competition.id}`} className="overflow-hidden rounded-md border border-border bg-surface">
      <header className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 sm:px-4">
        <Link href={`/competitions/${competition.slug}`} className="flex min-w-0 items-baseline gap-2 hover:text-accent">
          <h3 id={`groupe-${competition.id}`} className="truncate font-display text-lg font-bold uppercase leading-none">
            {competition.name}
          </h3>
          {subtitle && <span className="hidden truncate text-xs text-fg-subtle sm:inline">· {subtitle}</span>}
        </Link>
        <span className="text-xs text-fg-subtle tabular">{matches.length} match{matches.length > 1 ? "s" : ""}</span>
      </header>
      <div className="divide-y divide-border">
        {matches.map((match) => {
          const home = teams.get(match.homeTeamId);
          const away = teams.get(match.awayTeamId);
          if (!home || !away) return null;
          return <MatchRow key={match.id} match={match} homeTeam={home} awayTeam={away} />;
        })}
      </div>
    </section>
  );
}
