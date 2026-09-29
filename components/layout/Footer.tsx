import Link from "next/link";
import { BallGlyph } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-fg-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <BallGlyph className="h-5 w-5" />
          <span className="font-semibold text-fg">Basket Analytics</span>
          <span className="text-fg-subtle">· données de démonstration</span>
        </div>
        <nav aria-label="Liens secondaires" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/competitions" className="hover:text-fg">Compétitions</Link>
          <Link href="/equipes" className="hover:text-fg">Équipes</Link>
          <Link href="/joueurs" className="hover:text-fg">Joueurs</Link>
          <Link href="/analyses" className="hover:text-fg">Analyses</Link>
        </nav>
      </div>
    </footer>
  );
}
