import Link from "next/link";
import type { Competition, Team } from "@/types";
import { TeamBadge } from "./TeamBadge";
import { countryName } from "./country";

/** Ligne d'équipe pour les listes (/equipes) : écusson, nom, localisation et compétitions disputées. */
export function TeamCard({ team, competitions }: { team: Team; competitions: Competition[] }) {
  const location = team.kind === "national" ? "Sélection nationale" : `${team.city} · ${countryName(team.country)}`;
  return (
    <Link href={`/equipes/${team.id}`} className="group flex items-center gap-3 px-2 py-2.5 transition-colors hover:bg-surface-2 sm:px-3">
      <TeamBadge team={team} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-fg transition-colors group-hover:text-accent">{team.name}</p>
        <p className="truncate text-xs text-fg-muted">
          {location}
          {competitions.length > 0 && <span className="text-fg-subtle"> · {competitions.map((competition) => competition.name).join(" · ")}</span>}
        </p>
      </div>
      <span aria-hidden="true" className="text-fg-subtle">
        ›
      </span>
    </Link>
  );
}
