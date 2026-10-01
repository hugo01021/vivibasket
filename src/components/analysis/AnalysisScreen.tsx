"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ProgressScreen } from "./ProgressScreen";

type Props = {
  /** Jouer l'animation « analyse en cours » avant d'afficher le contenu. */
  runFirst: boolean;
  home: string;
  away: string;
  children: ReactNode;
};

/** Enchaîne l'écran de progression (étape 4) puis le résultat (étape 5 ou 7). */
export function AnalysisScreen({ runFirst, home, away, children }: Props) {
  const [phase, setPhase] = useState<"running" | "done">(runFirst ? "running" : "done");

  useEffect(() => {
    // Retire le paramètre de lancement pour qu'un rechargement n'exécute pas l'animation à nouveau.
    if (!runFirst) return;
    const url = new URL(window.location.href);
    if (url.searchParams.has("lancement")) {
      url.searchParams.delete("lancement");
      window.history.replaceState(window.history.state, "", url.toString());
    }
  }, [runFirst]);

  const finish = useCallback(() => setPhase("done"), []);

  if (phase === "running") return <ProgressScreen home={home} away={away} onDone={finish} />;
  return <div className="animate-rise">{children}</div>;
}
