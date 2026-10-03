import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

/** Conteneur de page mobile-first (16 px de marge, largeur max confortable). */
export function PageShell({ children, className, narrow = false }: { children: ReactNode; className?: string; narrow?: boolean }) {
  return <div className={cn("mx-auto w-full px-4 pb-16 pt-6 sm:px-6", narrow ? "max-w-md" : "max-w-5xl", className)}>{children}</div>;
}

export function PageTitle({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: ReactNode }) {
  return (
    <div className="mb-6 space-y-2">
      {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{eyebrow}</p> : null}
      <h1 className="font-display text-3xl font-extrabold text-fg sm:text-4xl">{title}</h1>
      {lead ? <p className="max-w-2xl text-base text-fg-muted">{lead}</p> : null}
    </div>
  );
}
