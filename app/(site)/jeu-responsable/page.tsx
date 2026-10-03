import type { Metadata } from "next";
import { LegalArticle } from "~/components/layout/LegalArticle";
import { AgeBadge } from "~/components/layout/SiteFooter";
import { SITE } from "~/lib/site";

export const metadata: Metadata = {
  title: "Jeu responsable et interdiction aux mineurs",
  description: "DunkOne est réservé aux adultes et n'organise aucun pari. Ressources d'aide et bonnes pratiques.",
  alternates: { canonical: "/jeu-responsable" },
};

export default function ResponsibleGamingPage() {
  return (
    <LegalArticle title="Jeu responsable" updated="1er octobre 2026" lead="Nos analyses éclairent, elles ne décident pas à votre place.">
      <p className="flex items-center gap-3 rounded-card border border-border bg-surface p-4 text-fg">
        <AgeBadge />
        <span>
          <strong>Service interdit aux mineurs.</strong> {SITE.name} est réservé aux personnes de 18 ans et plus.
        </span>
      </p>
      <h2>Ce que {SITE.name} est, et n&apos;est pas</h2>
      <p>
        {SITE.name} est un outil d&apos;analyse statistique. Il ne propose aucun pari, ne collecte aucune mise et n&apos;est lié à aucun opérateur de jeux. Une
        probabilité de 70 % signifie qu&apos;un match sur trois environ se termine autrement : aucune analyse n&apos;est une certitude.
      </p>
      <h2>Si vous pariez</h2>
      <ul>
        <li>Fixez un budget à l&apos;avance et ne le dépassez jamais, quels que soient les résultats.</li>
        <li>Ne cherchez pas à « vous refaire » après une perte.</li>
        <li>Le jeu doit rester un divertissement, jamais une source de revenus ni un moyen de régler des difficultés financières.</li>
        <li>Faites des pauses et parlez-en à vos proches si vous sentez que le jeu prend trop de place.</li>
      </ul>
      <h2>Besoin d&apos;aide ?</h2>
      <p>
        Jouer comporte des risques : endettement, isolement, dépendance. Pour être aidé, appelez le{" "}
        <a href={`tel:${SITE.helplinePhone.replace(/\s/g, "")}`}>{SITE.helplinePhone}</a> (Joueurs Info Service, appel non surtaxé, 7 jours sur 7 de 8 h à
        2 h) ou consultez joueurs-info-service.fr.
      </p>
      <h2>Auto-exclusion</h2>
      <p>
        Vous pouvez nous demander la fermeture définitive de votre compte à tout moment en écrivant à{" "}
        <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.
      </p>
    </LegalArticle>
  );
}
