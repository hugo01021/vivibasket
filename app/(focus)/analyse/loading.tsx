/** Transition immédiate vers l'analyse (le contenu arrive juste derrière). */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 pt-6 sm:px-6" aria-busy="true" aria-hidden="true">
      <div className="h-4 w-28 animate-pulse rounded bg-surface-2" />
      <div className="h-10 w-3/4 animate-pulse rounded bg-surface-2" />
      <div className="h-40 animate-pulse rounded-card bg-surface" />
      <div className="h-72 animate-pulse rounded-card bg-surface" />
    </div>
  );
}
