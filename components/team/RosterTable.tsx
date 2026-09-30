import Link from "next/link";
import type { Player, Position } from "@/types";
import { ageFromBirthDate, formatHeight, fullPlayerName } from "@/lib/format";
import { countryName } from "./country";

const POSITION_LABELS: Record<Position, string> = {
  PG: "Meneur",
  SG: "Arrière",
  SF: "Ailier",
  PF: "Ailier fort",
  C: "Pivot",
  G: "Arrière",
  F: "Ailier",
  "G-F": "Arrière-ailier",
  "F-C": "Ailier fort-pivot",
};

/** Effectif d'une équipe : numéro, nom, poste, taille, âge, nationalité. Défile horizontalement sur mobile. */
export function RosterTable({ players }: { players: Player[] }) {
  const sorted = [...players].sort((a, b) => a.jerseyNumber - b.jerseyNumber || a.lastName.localeCompare(b.lastName, "fr"));
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-surface">
      <table className="w-full min-w-[560px] text-sm">
        <caption className="sr-only">Effectif</caption>
        <thead>
          <tr className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
            <th scope="col" className="w-12 px-3 py-2.5 text-center sm:px-4">N°</th>
            <th scope="col" className="px-3 py-2.5">Joueur</th>
            <th scope="col" className="px-3 py-2.5">Poste</th>
            <th scope="col" className="px-3 py-2.5 text-right">Taille</th>
            <th scope="col" className="px-3 py-2.5 text-right">Âge</th>
            <th scope="col" className="px-3 py-2.5 sm:pr-4">Nationalité</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((player) => (
            <tr key={player.id} className="transition-colors hover:bg-surface-2">
              <td className="px-3 py-2.5 text-center font-semibold text-fg-muted tabular sm:px-4">{player.jerseyNumber}</td>
              <td className="px-3 py-2.5">
                <Link href={`/joueurs/${player.id}`} className="font-semibold text-fg hover:text-accent">
                  {fullPlayerName(player)}
                </Link>
              </td>
              <td className="px-3 py-2.5 text-fg-muted">
                <abbr title={player.position} className="no-underline">
                  {POSITION_LABELS[player.position]}
                </abbr>
              </td>
              <td className="px-3 py-2.5 text-right tabular">{formatHeight(player.heightCm)}</td>
              <td className="px-3 py-2.5 text-right tabular">{ageFromBirthDate(player.birthDate)} ans</td>
              <td className="px-3 py-2.5 text-fg-muted sm:pr-4">{countryName(player.nationality)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
