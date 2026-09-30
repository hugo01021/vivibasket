"use client";

import { useState } from "react";
import { analyzeMatch, findTeam, type MatchAnalysis } from "@/lib/home-analysis";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { AnalyzeMatch } from "./AnalyzeMatch";
import { TodayMatches } from "./TodayMatches";

/** Accueil : formulaire d'analyse (état des deux équipes) et tableau des matchs du jour. */
export function HomePage({ dateLabel }: { dateLabel: string }) {
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealKey, setRevealKey] = useState(0);

  const run = (homeName: string, awayName: string): boolean => {
    const homeTeam = findTeam(homeName);
    const awayTeam = findTeam(awayName);
    if (!homeTeam || !awayTeam) {
      setError(!homeName.trim() || !awayName.trim() ? "Renseigne les deux équipes." : "Équipe inconnue : choisis-la dans la liste.");
      return false;
    }
    if (homeTeam.name === awayTeam.name) {
      setError("Deux équipes différentes, sinon le match sera long.");
      return false;
    }
    setError(null);
    setAnalysis(analyzeMatch(homeTeam, awayTeam));
    return true;
  };

  const submit = () => {
    if (run(home, away)) setRevealKey((k) => k + 1);
  };

  return (
    <>
      <Header variant="home" />
      <main id="contenu" className="flex-1">
        <AnalyzeMatch
          home={home}
          away={away}
          onHomeChange={setHome}
          onAwayChange={setAway}
          onSubmit={submit}
          analysis={analysis}
          error={error}
          revealKey={revealKey}
        />
        <TodayMatches dateLabel={dateLabel} />
      </main>
      <Footer />
    </>
  );
}
