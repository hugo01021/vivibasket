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
    <div className={cn("rounded-card border border-border bg-surface p-3 shadow-card", className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tabular">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-fg-muted">{hint}</p>}
    </div>
  );
}
