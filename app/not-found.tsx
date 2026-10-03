import { AppHeader } from "~/components/layout/AppHeader";
import { PageShell } from "~/components/layout/PageShell";
import { SiteFooter } from "~/components/layout/SiteFooter";
import { Button } from "~/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main id="contenu" className="flex-1">
        <PageShell narrow className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Erreur 404</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold">Balle perdue.</h1>
          <p className="mt-2 text-fg-muted">Cette page n&apos;existe pas ou a été déplacée.</p>
          <Button href="/" className="mt-6">
            Retour à l&apos;accueil
          </Button>
        </PageShell>
      </main>
      <SiteFooter />
    </div>
  );
}
