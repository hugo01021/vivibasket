import type { ReactNode } from "react";

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-border px-4 py-8 text-center">
      <p className="font-semibold text-fg">{title}</p>
      {children && <p className="mt-1 text-sm text-fg-muted">{children}</p>}
    </div>
  );
}
