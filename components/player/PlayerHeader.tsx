import Link from "next/link";
import type { Player, Team } from "@/types";
import { ageFromBirthDate, formatHeight, fullPlayerName } from "@/lib/format";
import { TeamBadge } from "@/components/team/TeamBadge";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { POSITION_LABELS, countryName } from "./labels";

const birthDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** En-tête de la fiche joueur : identité, club, mensurations, favori. En-tête plat, sans couleurs d'équipe. */
export function PlayerHeader({ player, team }: { player: Player; team: Team | null }) {
  const name = fullPlayerName(player);
  const age = ageFromBirthDate(player.birthDate);
  const facts: Array<{ label: string; value: string; hint?: string }> = [
    { label: "Taille", value: formatHeight(player.heightCm) },
    { label: "Poids", value: `${player.weightKg} kg` },
    {
      label: "Âge",
      value: `${age} ans`,
      hint: birthDateFormatter.format(new Date(`${player.birthDate}T00:00:00Z`)),
    },
    { label: "Nationalité", value: countryName(player.nationality) },
  ];

  return (
    <header className="border-b border-border pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-balance font-display text-4xl font-bold uppercase leading-none sm:text-5xl">{name}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fg-muted">
            <span className="tabular">
              <span className="sr-only">Numéro </span>#{player.jerseyNumber}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {POSITION_LABELS[player.position]} ({player.position})
            </span>
            {team && (
              <>
                <span aria-hidden="true">·</span>
                <Link
                  href={`/equipes/${team.id}`}
                  className="inline-flex items-center gap-1.5 font-semibold text-fg transition-colors hover:text-accent"
                >
                  <TeamBadge team={team} size="xs" />
                  {team.name}
                </Link>
              </>
            )}
          </p>
        </div>
        <FavoriteButton kind="player" id={player.id} label={name} className="self-start" />
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-4 sm:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">{fact.label}</dt>
            <dd className="mt-1 font-display text-2xl font-bold leading-none tabular">
              {fact.value}
              {fact.hint && <span className="mt-1.5 block font-sans text-xs font-normal text-fg-muted">{fact.hint}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </header>
  );
}
