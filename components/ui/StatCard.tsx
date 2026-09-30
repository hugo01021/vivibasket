import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Tuile de chiffre clé : libellé, valeur, précision optionnelle. */
export function StatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-md border border-border bg-surface p-3", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold leading-none tabular">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-fg-muted">{hint}</p>}
    </div>
  );
}
