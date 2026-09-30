import Link from "next/link";
import type { Competition, Team } from "@/types";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { TeamBadge } from "./TeamBadge";
import { countryName } from "./country";

/**
 * En-tête d'une page équipe : écusson, identité, salle, entraîneur, compétitions.
 * En-tête plat, sans couleurs d'équipe. Sur mobile, l'écusson et le bouton favori
 * occupent la première ligne et le titre prend toute la largeur en dessous.
 */
export function TeamHeader({ team, competitions }: { team: Team; competitions: Competition[] }) {
  const location = team.kind === "national" ? "Sélection nationale" : `${team.city} · ${countryName(team.country)}`;
  const details = [
    team.arena ? { label: "Salle", value: team.arena } : null,
    team.coach ? { label: team.kind === "national" ? "Sélectionneur" : "Entraîneur", value: team.coach } : null,
    team.founded ? { label: "Fondation", value: String(team.founded), tabular: true } : null,
  ].filter((detail) => detail !== null);

  return (
    <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-4 gap-y-3 sm:items-start">
      <TeamBadge team={team} size="xl" className="col-start-1 row-start-1" />
      <FavoriteButton kind="team" id={team.id} label={team.name} className="col-start-3 row-start-1 justify-self-end" />
      <div className="col-span-3 row-start-2 min-w-0 sm:col-span-1 sm:col-start-2 sm:row-start-1">
        <h1 className="font-display text-4xl font-bold uppercase leading-none sm:text-5xl">{team.name}</h1>
        <p className="mt-2 text-sm text-fg-muted">{location}</p>
        {details.length > 0 && (
          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
            {details.map((detail) => (
              <div key={detail.label} className="flex items-baseline gap-1.5">
                <dt className="text-[11px] uppercase tracking-[0.08em] text-fg-muted">{detail.label}</dt>
                <dd className={detail.tabular ? "text-sm text-fg tabular" : "text-sm text-fg"}>{detail.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {competitions.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Compétitions disputées">
            {competitions.map((competition) => (
              <li key={competition.id}>
                <Link
                  href={`/competitions/${competition.slug}`}
                  className="inline-flex h-10 items-center rounded-[4px] border border-border px-3 text-xs font-semibold text-fg-muted transition-colors hover:border-accent hover:text-accent sm:h-7 sm:px-2.5"
                >
                  {competition.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </header>
  );
}
