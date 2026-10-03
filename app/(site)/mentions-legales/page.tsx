import type { Metadata } from "next";
import { LegalArticle } from "~/components/layout/LegalArticle";
import { SITE } from "~/lib/site";

export const metadata: Metadata = { title: "Mentions légales", alternates: { canonical: "/mentions-legales" } };

export default function LegalNoticePage() {
  return (
    <LegalArticle title="Mentions légales" updated="1er octobre 2026">
      <h2>Éditeur</h2>
      <p>
        {SITE.name} est édité par <mark>[Dénomination sociale]</mark>, <mark>[forme juridique]</mark> au capital de <mark>[montant]</mark>, dont le siège
        est situé <mark>[adresse]</mark>, immatriculée au RCS de <mark>[ville]</mark> sous le numéro <mark>[SIREN]</mark>.
      </p>
      <p>
        Directeur de la publication : <mark>[nom]</mark>. Contact : <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.
      </p>
      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par <mark>[hébergeur, raison sociale]</mark>, <mark>[adresse]</mark>, <mark>[téléphone]</mark>.
      </p>
      <h2>Données et paiement</h2>
      <p>
        Les paiements sont traités par Stripe Payments Europe, Ltd. Les données personnelles sont traitées conformément à notre{" "}
        <a href="/confidentialite">politique de confidentialité</a>.
      </p>
      <h2>Avertissement</h2>
      <p>
        {SITE.name} fournit des analyses statistiques à titre informatif. Le service est réservé aux adultes et n&apos;organise aucun pari. Les noms des
        compétitions, clubs et salles sont la propriété de leurs titulaires ; aucune affiliation ni aucun partenariat n&apos;est revendiqué.
      </p>
      <h2>Crédits</h2>
      <p>Identité visuelle, illustrations et textes : {SITE.name}. Polices : Bricolage Grotesque et Figtree (licences libres SIL OFL).</p>
    </LegalArticle>
  );
}
