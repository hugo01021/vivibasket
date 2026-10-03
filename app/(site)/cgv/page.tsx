import type { Metadata } from "next";
import Link from "next/link";
import { LegalArticle } from "~/components/layout/LegalArticle";
import { PLANS, PLAN_ORDER } from "~/lib/plans";
import { SITE } from "~/lib/site";
import { formatPrice } from "~/lib/utils";

export const metadata: Metadata = { title: "Conditions générales de vente", alternates: { canonical: "/cgv" } };

export default function SalesTermsPage() {
  return (
    <LegalArticle title="Conditions générales de vente" updated="1er octobre 2026" lead="Prix, paiement, durée et résiliation des abonnements DunkOne.">
      <h2>1. Offres et prix</h2>
      <p>Trois abonnements mensuels sont proposés, toutes taxes comprises :</p>
      <ul>
        {PLAN_ORDER.map((id) => (
          <li key={id}>
            <strong>{PLANS[id].name}</strong> — {formatPrice(PLANS[id].priceCents)} par mois : {PLANS[id].features.join(", ").toLowerCase()}.
          </li>
        ))}
      </ul>
      <p>Aucune période d&apos;essai gratuit n&apos;est proposée. Les prix peuvent évoluer ; toute modification vous est annoncée au moins 30 jours avant son application.</p>
      <h2>2. Souscription</h2>
      <p>
        L&apos;abonnement se souscrit en ligne, après création d&apos;un compte et acceptation des présentes conditions. Le paiement est confié à{" "}
        <strong>Stripe</strong>, prestataire de paiement certifié ; {SITE.name} ne conserve aucune donnée bancaire.
      </p>
      <h2>3. Durée et renouvellement</h2>
      <p>
        L&apos;abonnement court pour une période d&apos;un mois à compter du paiement et se renouvelle tacitement par périodes d&apos;un mois, sauf résiliation avant la
        date de renouvellement. Le montant est prélevé à chaque échéance sur le moyen de paiement enregistré.
      </p>
      <h2>4. Résiliation en ligne</h2>
      <p>
        Vous pouvez résilier à tout moment, <strong>en ligne et en quelques clics</strong>, depuis la page <Link href="/compte">Mon compte</Link>. La
        résiliation prend effet à la fin de la période déjà payée : vous conservez l&apos;accès jusqu&apos;à cette date et aucun montant n&apos;est prélevé ensuite.
        Les modalités détaillées figurent sur la page <Link href="/resiliation">Résiliation en ligne</Link>.
      </p>
      <h2>5. Droit de rétractation</h2>
      <p>
        Le Service est un contenu numérique fourni immédiatement après paiement. En validant la commande, vous demandez expressément l&apos;exécution immédiate
        du Service et reconnaissez perdre votre droit de rétractation de 14 jours, conformément à l&apos;article L221-28 du Code de la consommation.
      </p>
      <h2>6. Changement d&apos;offre</h2>
      <p>
        Le passage à une offre supérieure est immédiat et facturé au prorata de la période restante. Le passage à une offre inférieure est appliqué au prochain
        renouvellement.
      </p>
      <h2>7. Quotas</h2>
      <p>
        Les analyses non utilisées au cours d&apos;une période ne sont pas reportées. Les quotas sont rattachés à la période de facturation en cours.
      </p>
      <h2>8. Défaut de paiement</h2>
      <p>En cas d&apos;échec de prélèvement, de nouvelles tentatives sont effectuées pendant quelques jours ; faute de régularisation, l&apos;abonnement est suspendu.</p>
      <h2>9. Réclamations et médiation</h2>
      <p>
        Pour toute question : <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>. À défaut de solution amiable, vous pouvez saisir gratuitement le
        médiateur de la consommation <mark>[nom et coordonnées du médiateur]</mark> ou la plateforme européenne de règlement en ligne des litiges.
      </p>
      <h2>10. Vendeur</h2>
      <p>
        <mark>[Dénomination sociale]</mark>, <mark>[forme juridique et capital]</mark>, <mark>[adresse du siège]</mark>, immatriculée sous le numéro{" "}
        <mark>[SIREN]</mark>, TVA intracommunautaire <mark>[numéro]</mark>.
      </p>
    </LegalArticle>
  );
}
