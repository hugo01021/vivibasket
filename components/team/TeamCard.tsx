import Link from "next/link";
import type { Competition, Team } from "@/types";
import { TeamBadge } from "./TeamBadge";
import { countryName } from "./country";

/** Carte d'équipe pour les listes (/equipes). */
export function TeamCard({ team, competitions }: { team: Team; competitions: Competition[] }) {
  return (
    <Link
      href={`/equipes/${team.id}`}
      className="flex items-center gap-3 rounded-card border border-border bg-surface p-3 shadow-card transition-colors hover:border-border-strong hover:bg-surface-2"
    >
      <TeamBadge team={team} size="lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{team.name}</p>
        <p className="truncate text-xs text-fg-muted">
          {team.kind === "national" ? "Sélection nationale" : `${team.city} · ${countryName(team.country)}`}
        </p>
        {competitions.length > 0 && (
          <p className="mt-1 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[11px] text-fg-subtle">
            {competitions.map((competition) => (
              <span key={competition.id} className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: competition.accentColor }} aria-hidden="true" />
                {competition.name}
              </span>
            ))}
          </p>
        )}
      </div>
      <span aria-hidden="true" className="text-fg-subtle">
        ›
      </span>
    </Link>
  );
}
