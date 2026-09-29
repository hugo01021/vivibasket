import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="text-6xl font-extrabold text-accent">404</p>
      <h1 className="mt-3 text-xl font-bold">Page introuvable</h1>
      <p className="mt-2 text-sm text-fg-muted">
        Cette page n’existe pas ou n’est pas encore disponible.
      </p>
      <Link href="/" className="mt-6 inline-flex h-10 items-center rounded-full bg-accent px-5 text-sm font-bold text-accent-ink hover:bg-accent-hover">
        Retour aux matchs
      </Link>
    </div>
  );
}
