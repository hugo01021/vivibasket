"use client";

import { useEffect, useState } from "react";
import { BrandMark } from "~/components/brand/Logo";
import { IconCheck } from "~/components/ui/icons";
import { cn } from "~/lib/utils";

import { ANALYSIS_STEPS } from "~/lib/basket/factors";

const STEP_MS = 400;
const INTRO_MS = 350;
const OUTRO_MS = 500;

/** Écran plein : animation + barre de progression listant les facteurs, puis `onDone`. */
export function ProgressScreen({ home, away, onDone }: { home: string; away: string; onDone: () => void }) {
  const [step, setStep] = useState(0); // nombre de facteurs terminés

  useEffect(() => {
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    ANALYSIS_STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setStep(i + 1), INTRO_MS + (i + 1) * STEP_MS));
    });
    timers.push(setTimeout(onDone, INTRO_MS + ANALYSIS_STEPS.length * STEP_MS + OUTRO_MS));
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  const progress = Math.round((step / ANALYSIS_STEPS.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg" role="status" aria-live="polite" aria-label="Analyse en cours">
      <div className="glow-accent flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="relative mb-8 h-24 w-24">
          <div className="absolute inset-0 rounded-full border border-accent/30 animate-spin-slow" style={{ borderTopColor: "var(--color-accent)" }} />
          <div className="absolute inset-0 flex items-center justify-center animate-float">
            <BrandMark size={56} className="text-fg" />
          </div>
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Analyse en cours</p>
        <h1 className="mt-2 text-center font-display text-2xl font-extrabold text-fg sm:text-3xl">
          {home} <span className="text-fg-subtle">vs</span> {away}
        </h1>
        <p className="mt-2 text-center text-sm text-fg-muted">Le modèle croise les huit facteurs du match…</p>

        <div className="mt-8 w-full max-w-sm">
          <div className="progress-track h-2 w-full overflow-hidden rounded-full" aria-hidden="true">
            <div className="progress-fill h-full rounded-full" style={{ width: `${Math.max(4, progress)}%` }} />
          </div>
          <p className="tabular mt-2 text-right text-xs text-fg-muted">{progress} %</p>

          <ol className="mt-5 space-y-2">
            {ANALYSIS_STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <li
                  key={s.key}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition-colors",
                    done ? "border-border bg-surface text-fg" : active ? "border-accent/60 bg-accent-soft/60 text-fg" : "border-border/60 text-fg-subtle",
                  )}
                >
                  <span className="font-semibold">{s.label}</span>
                  {done ? (
                    <IconCheck size={18} className="text-win" />
                  ) : active ? (
                    <span className="relative h-5 w-16 overflow-hidden rounded-full bg-surface-3">
                      <span className="absolute inset-y-0 w-1/2 rounded-full bg-accent/70 animate-scan" />
                    </span>
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-border-strong" />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
