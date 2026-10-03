import type { FactorKey } from "./types";

/** Les huit facteurs, dans l'ordre d'affichage (écran de progression et résultat). */
export const ANALYSIS_STEPS: ReadonlyArray<{ key: FactorKey; label: string }> = [
  { key: "forme", label: "Forme récente" },
  { key: "terrain", label: "Domicile / extérieur" },
  { key: "h2h", label: "Confrontations directes" },
  { key: "attaque", label: "Attaque" },
  { key: "defense", label: "Défense" },
  { key: "rythme", label: "Rythme" },
  { key: "fatigue", label: "Fatigue" },
  { key: "blessures", label: "Blessures" },
];
