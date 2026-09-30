import type { FormResult } from "@/types";
import { cn } from "@/lib/utils";

/** Pastilles V/D des derniers résultats (du plus ancien au plus récent). */
export function FormIndicator({ form, className }: { form: FormResult[]; className?: string }) {
  if (form.length === 0) return <span className="text-xs text-fg-subtle">—</span>;
  return (
    <span className={cn("inline-flex gap-1", className)} aria-label={`Forme : ${form.map((r) => (r === "W" ? "victoire" : "défaite")).join(", ")}`}>
      {form.map((result, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn(
            "inline-flex h-5 w-5 items-center justify-center rounded-[3px] text-[10px] font-bold",
            result === "W" ? "bg-win/10 text-win/80" : "bg-loss/10 text-loss/80",
          )}
        >
          {result === "W" ? "V" : "D"}
        </span>
      ))}
    </span>
  );
}
