import type { Metadata } from "next";
import { PageShell, PageTitle } from "~/components/layout/PageShell";
import { Button } from "~/components/ui/Button";

export const metadata: Metadata = { title: "Hors ligne", robots: { index: false, follow: false } };

export default function OfflinePage() {
  return (
    <PageShell narrow className="text-center">
      <PageTitle title="Vous êtes hors ligne" lead="Impossible de joindre Rebond pour le moment. Vérifiez votre connexion puis réessayez." />
      <Button href="/" size="lg">
        Réessayer
      </Button>
    </PageShell>
  );
}
