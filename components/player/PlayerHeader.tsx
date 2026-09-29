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

/** En-tête de la fiche joueur : identité, club, mensurations, favori. */
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
    <header className="relative overflow-hidden rounded-card border border-border bg-surface shadow-card">
      {team && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: `linear-gradient(90deg, ${team.colors.primary}, ${team.colors.secondary})` }}
        />
      )}
      <div className="flex flex-col gap-5 p-4 sm:p-6 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span
            aria-hidden="true"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface-3 text-2xl font-extrabold text-accent tabular sm:h-20 sm:w-20 sm:text-3xl"
          >
            {player.jerseyNumber}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-fg-muted">{player.firstName}</p>
            <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">{player.lastName}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fg-muted">
              <span>
                <span className="sr-only">Numéro </span>#{player.jerseyNumber} · {POSITION_LABELS[player.position]} ({player.position})
              </span>
              {team && (
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true">·</span>
                  <Link href={`/equipes/${team.id}`} className="inline-flex items-center gap-1.5 font-semibold text-fg hover:text-accent">
                    <TeamBadge team={team} size="xs" />
                    {team.name}
                  </Link>
                </span>
              )}
            </p>
          </div>
        </div>
        <FavoriteButton kind="player" id={player.id} label={name} className="self-start md:self-center" />
      </div>
      <dl className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label} className="bg-surface px-4 py-3 sm:px-6">
            <dt className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">{fact.label}</dt>
            <dd className="mt-0.5 font-bold tabular">
              {fact.value}
              {fact.hint && <span className="block text-xs font-normal text-fg-muted">{fact.hint}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </header>
  );
}
