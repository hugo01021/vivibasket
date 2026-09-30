import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Fil d'Ariane + titre commun aux sous-pages d'analyse. */
export function AnalysisPageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div>
      <nav aria-label="Fil d’Ariane" className="mb-3 text-sm text-fg-muted">
        <Link href="/analyses" className="transition-colors hover:text-fg">
          Analyses
        </Link>
        <span aria-hidden="true" className="mx-1.5 text-fg-subtle">
          ›
        </span>
        <span className="text-fg">{title}</span>
      </nav>
      <h1 className="font-display text-4xl font-bold uppercase leading-none sm:text-5xl">{title}</h1>
      {children && <p className="mt-2 max-w-2xl text-sm text-fg-muted">{children}</p>}
    </div>
  );
}

/** Pastille de série en cours : « V3 » / « D2 » (vert / rouge atténués, réservés aux V/D). */
export function StreakChip({ type, count }: { type: "W" | "L"; count: number }) {
  if (count === 0) return <span className="text-xs text-fg-subtle">—</span>;
  const win = type === "W";
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center justify-self-start rounded-[3px] px-1.5 text-[11px] font-bold tabular",
        win ? "bg-win/10 text-win/80" : "bg-loss/10 text-loss/80",
      )}
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
