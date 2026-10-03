import type { Metadata } from "next";
import Link from "next/link";
import { LegalArticle } from "~/components/layout/LegalArticle";
import { Button } from "~/components/ui/Button";
import { SITE } from "~/lib/site";

export const metadata: Metadata = {
  title: "Résiliation en ligne",
  description: "Résiliez votre abonnement DunkOne en ligne, en trois clics, sans frais ni justification.",
  alternates: { canonical: "/resiliation" },
};

export default function CancellationPage() {
  return (
    <LegalArticle title="Résiliation en ligne" updated="1er octobre 2026" lead="Résilier est aussi simple que s'abonner : trois clics, sans frais, sans justification.">
      <h2>Comment résilier</h2>
      <ol>
        <li>
          Connectez-vous et ouvrez <Link href="/compte">Mon compte</Link>.
        </li>
        <li>Dans le bloc « Mon abonnement », touchez « Résilier mon abonnement ».</li>
        <li>C&apos;est fait : un message confirme la date de fin d&apos;accès et aucun prélèvement n&apos;aura lieu ensuite.</li>
      </ol>
      <h2>Ce qui se passe ensuite</h2>
      <ul>
        <li>Vous conservez l&apos;accès à votre offre jusqu&apos;à la fin de la période déjà payée.</li>
        <li>Vous pouvez reprendre l&apos;abonnement à tout moment avant cette date, depuis la même page.</li>
        <li>Vos analyses débloquées restent consultables.</li>
      </ul>
      <h2>Par un autre canal</h2>
      <p>
        Vous pouvez aussi nous écrire à <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> depuis l&apos;adresse de votre compte ; la demande est
        traitée sous 48 heures ouvrées.
      </p>
      <div className="pt-2">
        <Button href="/compte">Gérer mon abonnement</Button>
      </div>
    </LegalArticle>
  );
}
