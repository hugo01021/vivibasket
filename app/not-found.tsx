import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="contenu" className="mx-auto w-full max-w-md flex-1 px-4 pb-20 pt-36 text-center">
        <p className="font-display text-7xl font-extrabold leading-none text-accent">404</p>
        <h1 className="mt-3 font-display text-2xl font-bold uppercase leading-none">Page introuvable</h1>
        <p className="mt-2 text-sm text-fg-muted">
          Cette page n’existe pas ou n’est pas encore disponible.
        </p>
        <Link href="/" className="mt-6 inline-flex h-10 items-center rounded-md bg-accent px-5 text-sm font-bold text-bg hover:bg-accent-hover">
          Retour à l’accueil
        </Link>
      </main>
      <Footer />
    </>
  );
}
