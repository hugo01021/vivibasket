import Link from "next/link";
import type { ReactNode } from "react";

/** Fil d'Ariane + titre commun aux sous-pages d'analyse. */
export function AnalysisPageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="space-y-1">
      <nav aria-label="Fil d’Ariane" className="text-sm text-fg-muted">
        <Link href="/analyses" className="hover:text-accent">
          Analyses
        </Link>
        <span aria-hidden="true" className="mx-1.5 text-fg-subtle">
          ›
        </span>
        <span className="text-fg">{title}</span>
      </nav>
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      {children && <p className="max-w-3xl text-sm text-fg-muted">{children}</p>}
    </div>
  );
}

/** Pastille de série en cours : « V3 » / « D2 ». */
export function StreakChip({ type, count }: { type: "W" | "L"; count: number }) {
  if (count === 0) return <span className="text-xs text-fg-subtle">—</span>;
  const win = type === "W";
  return (
    <span
      className={`inline-flex h-5 items-center justify-self-start rounded px-1.5 text-[11px] font-extrabold tabular ${win ? "bg-win/15 text-win" : "bg-loss/15 text-loss"}`}
      title={`${count} ${win ? "victoire" : "défaite"}${count > 1 ? "s" : ""} de suite`}
    >
      <span aria-hidden="true">
        {win ? "V" : "D"}
        {count}
      </span>
      <span className="sr-only">
        Série : {count} {win ? "victoire" : "défaite"}
        {count > 1 ? "s" : ""}
      </span>
    </span>
  );
}
