import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
    <div className={cn("mb-3 flex items-end justify-between gap-3", className)}>
      <Tag className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
        {children}
        {typeof count === "number" && (
          <span className="rounded-full bg-surface-3 px-2 py-0.5 text-xs font-semibold text-fg-muted tabular">
            {count}
          </span>
        )}
      </Tag>
      {action}
    </div>
  );
}
