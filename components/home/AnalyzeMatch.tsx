"use client";

import { useEffect, useRef, type FormEvent } from "react";
import type { MatchAnalysis } from "@/lib/home-analysis";
import { AnalysisResult } from "./AnalysisResult";
import { TeamInput } from "./TeamInput";

interface AnalyzeMatchProps {
  home: string;
  away: string;
  onHomeChange: (value: string) => void;
  onAwayChange: (value: string) => void;
  onSubmit: () => void;
  analysis: MatchAnalysis | null;
  error: string | null;
  /** Incrémenté à chaque analyse lancée depuis le formulaire : amène la carte dans l'écran. */
  revealKey: number;
}

export function AnalyzeMatch({ home, away, onHomeChange, onAwayChange, onSubmit, analysis, error, revealKey }: AnalyzeMatchProps) {
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (revealKey === 0) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultRef.current?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [revealKey]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <section id="analyser" aria-labelledby="titre-analyse" className="relative isolate">
      {/* Taches orange très floutées : le seul « décor » de la page */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-14 bottom-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-24 h-[440px] w-[440px] rounded-full bg-accent opacity-[0.10] blur-[140px]" />
        <div className="absolute -right-24 top-10 h-[520px] w-[520px] rounded-full bg-accent opacity-[0.13] blur-[160px] max-sm:hidden" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-14 pt-24 sm:px-6 sm:pb-20 sm:pt-32">
        <p className="inline-block rounded-[4px] border border-line px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-dim">
          NBA · EuroLeague · Betclic Élite
        </p>
        <h1
          id="titre-analyse"
          className="mt-5 font-display text-[clamp(3.25rem,11vw,7rem)] font-extrabold uppercase leading-[0.86] tracking-[-0.01em]"
        >
          Analyse
          <br />
          <span className="text-accent">un match.</span>
        </h1>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-dim">
          Probabilités, forme, confrontations directes, bilans et blessés sur chaque affiche.
        </p>

        <form onSubmit={submit} noValidate className="mt-8 flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-end">
          <TeamInput label="Équipe domicile" value={home} onChange={onHomeChange} placeholder="Ex. Paris Basketball" invalid={!!error && !home} />
          <TeamInput label="Équipe extérieur" value={away} onChange={onAwayChange} placeholder="Ex. Real Madrid" invalid={!!error && !away} />
          <button
            type="submit"
            className="h-12 shrink-0 rounded-md bg-accent px-7 text-[15px] font-bold text-bg transition-colors hover:bg-accent-hover active:bg-accent"
          >
            Analyser
          </button>
        </form>
        <p role="status" className="mt-2 min-h-5 text-sm text-accent">
          {error}
        </p>

        {analysis && (
          <div ref={resultRef} className="mt-4 max-w-3xl scroll-mt-20">
            <AnalysisResult analysis={analysis} />
          </div>
        )}
      </div>
    </section>
  );
}
