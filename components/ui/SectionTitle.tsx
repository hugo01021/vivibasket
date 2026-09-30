import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Titre de section : condensé, capitales, compteur discret, action optionnelle à droite. */
export function SectionTitle({
  children,
  count,
  action,
  className,
  as: Tag = "h2",
}: {
  children: ReactNode;
  count?: number;
  action?: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-3 border-b border-border pb-2", className)}>
      <Tag className="flex items-baseline gap-2 font-display text-2xl font-bold uppercase leading-none">
        {children}
        {typeof count === "number" && (
          <span className="font-sans text-xs font-semibold normal-case text-fg-muted tabular">{count}</span>
        )}
      </Tag>
      {action}
    </div>
  );
}
