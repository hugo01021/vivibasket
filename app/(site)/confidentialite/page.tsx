import type { Metadata } from "next";
import { LegalArticle } from "~/components/layout/LegalArticle";
import { SITE } from "~/lib/site";

export const metadata: Metadata = { title: "Politique de confidentialité", alternates: { canonical: "/confidentialite" } };

export default function PrivacyPage() {
  return (
    <LegalArticle title="Politique de confidentialité" updated="1er octobre 2026" lead="Quelles données nous collectons, pourquoi, et comment exercer vos droits.">
      <h2>1. Responsable du traitement</h2>
      <p>
        <mark>[Dénomination sociale]</mark>, éditeur de {SITE.name}. Contact : <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.
      </p>
      <h2>2. Données collectées</h2>
      <ul>
        <li>
          <strong>Compte</strong> : adresse e-mail, mot de passe (stocké sous forme hachée, jamais en clair), date d&apos;acceptation des CGU.
        </li>
        <li>
          <strong>Abonnement</strong> : offre, statut, dates de période, identifiants techniques Stripe. Aucune donnée bancaire n&apos;est stockée par {SITE.name}.
        </li>
        <li>
          <strong>Usage</strong> : analyses demandées (équipes, date, résultat), préférences d&apos;alertes.
        </li>
        <li>
          <strong>Technique</strong> : journaux de sécurité (adresse IP tronquée, horodatage) conservés 12 mois au maximum.
        </li>
      </ul>
      <h2>3. Finalités et bases légales</h2>
      <ul>
        <li>Fournir le Service et gérer votre compte (exécution du contrat).</li>
        <li>Facturer et sécuriser les paiements (exécution du contrat, obligations légales).</li>
        <li>Prévenir la fraude et les abus (intérêt légitime).</li>
        <li>Vous informer des évolutions importantes du Service (intérêt légitime, désinscription possible).</li>
      </ul>
      <h2>4. Cookies</h2>
      <p>
        {SITE.name} utilise uniquement un cookie de session strictement nécessaire (<code>rebond_session</code>, 30 jours) et aucun traceur publicitaire. Le
        service worker de l&apos;application peut conserver localement des pages pour un usage hors ligne.
      </p>
      <h2>5. Destinataires</h2>
      <p>
        Stripe (paiement), <mark>[hébergeur]</mark> (hébergement). Aucune donnée n&apos;est vendue ni cédée à des tiers à des fins commerciales.
      </p>
      <h2>6. Durées de conservation</h2>
      <p>
        Données de compte : pendant la durée de la relation puis 3 ans. Données de facturation : 10 ans (obligation comptable). Analyses : 24 mois après leur
        création.
      </p>
      <h2>7. Vos droits</h2>
      <p>
        Accès, rectification, effacement, limitation, portabilité et opposition : écrivez à <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.
        Vous pouvez également saisir la CNIL (cnil.fr).
      </p>
      <h2>8. Sécurité</h2>
      <p>Chiffrement des échanges (HTTPS), hachage des mots de passe (scrypt), cookies de session signés et limités au protocole HTTP.</p>
    </LegalArticle>
  );
}
