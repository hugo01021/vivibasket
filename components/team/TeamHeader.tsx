import Link from "next/link";
import type { Competition, Team } from "@/types";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { TeamBadge } from "./TeamBadge";
import { countryName } from "./country";

/** En-tête d'une page équipe : écusson, identité, salle, entraîneur, compétitions. */
export function TeamHeader({ team, competitions }: { team: Team; competitions: Competition[] }) {
  const location = team.kind === "national" ? "Sélection nationale" : `${team.city} · ${countryName(team.country)}`;
  return (
    <header
      className="relative overflow-hidden rounded-card border border-border bg-surface p-4 shadow-card sm:p-5"
      style={{ backgroundImage: `linear-gradient(120deg, ${team.colors.primary}26 0%, transparent 55%)` }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <TeamBadge team={team} size="xl" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{team.name}</h1>
          <p className="mt-0.5 text-sm text-fg-muted">{location}</p>
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {team.arena && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">Salle</dt>
                <dd className="font-semibold">{team.arena}</dd>
              </div>
            )}
            {team.coach && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                  {team.kind === "national" ? "Sélectionneur" : "Entraîneur"}
                </dt>
                <dd className="font-semibold">{team.coach}</dd>
              </div>
            )}
            {team.founded && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">Fondation</dt>
                <dd className="font-semibold tabular">{team.founded}</dd>
              </div>
            )}
          </dl>
          {competitions.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Compétitions disputées">
              {competitions.map((competition) => (
                <li key={competition.id}>
                  <Link
                    href={`/competitions/${competition.slug}`}
                    className="inline-flex h-7 items-center gap-1.5 rounded-chip border border-border bg-surface-2 px-2.5 text-xs font-semibold text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: competition.accentColor }} aria-hidden="true" />
                    {competition.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <FavoriteButton kind="team" id={team.id} label={team.name} className="self-start" />
      </div>
    </header>
  );
}
