import { PageShell } from "~/components/layout/PageShell";

/** Squelette affiché immédiatement pendant le rendu d'une page dynamique. */
export default function Loading() {
  return (
    <PageShell aria-busy="true">
      <div className="space-y-4" aria-hidden="true">
        <div className="h-4 w-24 animate-pulse rounded bg-surface-2" />
        <div className="h-9 w-2/3 animate-pulse rounded bg-surface-2" />
        <div className="h-4 w-full animate-pulse rounded bg-surface-2" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-card bg-surface" />
          ))}
        </div>
      </div>
    </PageShell>
  );
}
