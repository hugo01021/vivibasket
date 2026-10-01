import type { Metadata } from "next";
import Link from "next/link";
import { LegalArticle } from "~/components/layout/LegalArticle";
import { SITE } from "~/lib/site";

export const metadata: Metadata = { title: "Conditions générales d'utilisation", alternates: { canonical: "/cgu" } };

export default function TermsPage() {
  return (
    <LegalArticle title="Conditions générales d'utilisation" updated="1er octobre 2026" lead="Ce que vous pouvez attendre de Rebond, et ce que nous attendons de vous.">
      <h2>1. Objet</h2>
      <p>
        Les présentes conditions encadrent l&apos;accès et l&apos;utilisation de l&apos;application {SITE.name} (le « Service »), éditée par{" "}
        <mark>[Dénomination sociale]</mark> (l&apos;« Éditeur »). Le Service produit des analyses statistiques de matchs de basket assistées par des modèles
        automatisés. En créant un compte, vous acceptez ces conditions sans réserve.
      </p>
      <h2>2. Accès réservé aux adultes</h2>
      <p>
        Le Service est <strong>strictement réservé aux personnes majeures (18 ans et plus)</strong>. En créant un compte, vous certifiez avoir l&apos;âge requis.
        L&apos;Éditeur peut suspendre tout compte dont l&apos;utilisateur ne remplirait pas cette condition.
      </p>
      <h2>3. Nature des contenus</h2>
      <p>
        Les probabilités, scores projetés, détections de value, résumés et réponses de l&apos;assistant sont des <strong>estimations</strong> calculées à partir de
        données disponibles au moment de l&apos;analyse. Elles ne constituent ni un conseil, ni une incitation à parier, ni une garantie de résultat. Vous restez
        seul responsable des décisions que vous prenez. {SITE.name} n&apos;est pas un opérateur de jeux ou de paris et ne collecte aucune mise.
      </p>
      <h2>4. Compte et sécurité</h2>
      <ul>
        <li>Une adresse e-mail et un mot de passe suffisent. Le compte est créé lors de la première connexion.</li>
        <li>Vous êtes responsable de la confidentialité de vos identifiants et de toute activité réalisée depuis votre compte.</li>
        <li>Un compte est personnel : le partage d&apos;identifiants ou la revente des analyses sont interdits.</li>
      </ul>
      <h2>5. Abonnements et quotas</h2>
      <p>
        L&apos;accès aux analyses complètes nécessite un abonnement mensuel décrit dans les <Link href="/cgv">conditions générales de vente</Link>. Chaque
        offre définit un nombre d&apos;analyses déblocables par période de facturation et les compétitions couvertes. Une analyse lancée sans abonnement reste
        verrouillée jusqu&apos;à la souscription d&apos;une offre.
      </p>
      <h2>6. Usages interdits</h2>
      <ul>
        <li>Extraire massivement les contenus (scraping), contourner les quotas ou les mécanismes de verrouillage.</li>
        <li>Perturber le fonctionnement du Service ou tenter d&apos;accéder aux données d&apos;autres utilisateurs.</li>
        <li>Utiliser le Service dans un pays où ce type de contenu est prohibé.</li>
      </ul>
      <h2>7. Propriété intellectuelle</h2>
      <p>
        L&apos;interface, la marque {SITE.name}, les textes, illustrations et modèles d&apos;analyse sont protégés. Les noms des ligues, clubs et salles cités
        appartiennent à leurs titulaires respectifs et sont utilisés à titre informatif, sans affiliation.
      </p>
      <h2>8. Disponibilité et évolution</h2>
      <p>
        L&apos;Éditeur s&apos;efforce de maintenir le Service accessible en continu mais ne peut garantir l&apos;absence d&apos;interruption. Les fonctionnalités peuvent
        évoluer ; les modifications substantielles des présentes conditions vous sont notifiées par e-mail ou dans l&apos;application.
      </p>
      <h2>9. Responsabilité</h2>
      <p>
        Dans les limites autorisées par la loi, l&apos;Éditeur ne saurait être tenu responsable des pertes financières consécutives à l&apos;usage des analyses, ni des
        dommages indirects. Les dispositions légales protectrices du consommateur demeurent applicables.
      </p>
      <h2>10. Résiliation du compte</h2>
      <p>
        Vous pouvez supprimer votre compte à tout moment en écrivant à <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>. La résiliation d&apos;un
        abonnement s&apos;effectue en ligne, depuis la page <Link href="/compte">Mon compte</Link>.
      </p>
      <h2>11. Droit applicable</h2>
      <p>Les présentes conditions sont soumises au droit français. En cas de litige, une solution amiable sera recherchée avant toute action judiciaire.</p>
    </LegalArticle>
  );
}
