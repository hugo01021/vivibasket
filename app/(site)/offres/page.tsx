import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell, PageTitle } from "~/components/layout/PageShell";
import { PlanCard } from "~/components/offers/PlanCard";
import { IconLock, IconShield } from "~/components/ui/icons";
import { LEAGUES } from "~/lib/basket/teams";
import { PLANS, PLAN_ORDER, isPlanId, planCoversLeague, type PlanId } from "~/lib/plans";
import { SITE, siteUrl } from "~/lib/site";
import { getAnalysisForUser, unlockAnalysis } from "~/server/analyses/service";
import { getCurrentUser } from "~/server/auth/dal";
import { checkUnlock, describeUnlockFailure, getEntitlement } from "~/server/billing/entitlements";

export const metadata: Metadata = {
  title: "Offres et abonnements",
  description: "Basic à 7,99 €, Pro à 14,99 €, Elite à 24,99 € par mois. Analyses de matchs de basket par IA, sans engagement, résiliables en ligne.",
  alternates: { canonical: "/offres" },
};

export const dynamic = "force-dynamic";

type Search = { analyse?: string; annule?: string; plan?: string };

export default async function OffersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { analyse, annule, plan } = await searchParams;
  const user = await getCurrentUser();
  const analysisId = analyse ?? null;

  let banner: { title: string; text: string } | null = null;
  let currentPlan: PlanId | null = null;
  let recommended: PlanId | null = isPlanId(plan) ? plan : null;
  let analysisLeague: (typeof LEAGUES)[keyof typeof LEAGUES] | null = null;

  if (user) {
    const entitlement = await getEntitlement(user.id);
    currentPlan = entitlement.plan?.id ?? null;
    if (analysisId) {
      const analysis = await getAnalysisForUser(user.id, analysisId);
      if (analysis) {
        if (analysis.unlocked) redirect(`/analyse/${analysis.id}`);
        const check = checkUnlock(entitlement, analysis.league);
        if (check.ok) {
          // Abonné dans les clous : on débloque sans passer par les offres.
          await unlockAnalysis(user.id, analysis.id);
          redirect(`/analyse/${analysis.id}`);
        }
        const leagueName = LEAGUES[analysis.league].name;
        analysisLeague = LEAGUES[analysis.league];
        banner = {
          title: `Votre analyse ${analysis.homeTeam} – ${analysis.awayTeam} est prête`,
          text: describeUnlockFailure(check.reason, leagueName),
        };
        if (check.reason === "league_not_covered" || check.reason === "quota_exceeded") recommended = "pro";
      }
    } else if (currentPlan) {
      banner = {
        title: `Vous êtes abonné à l'offre ${PLANS[currentPlan].name}`,
        text: "Vous pouvez changer d'offre ci-dessous ; le changement est immédiat et calculé au prorata.",
      };
    }
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${SITE.name} — abonnement`,
    description: metadata.description,
    brand: { "@type": "Brand", name: SITE.name },
    offers: PLAN_ORDER.map((id) => ({
      "@type": "Offer",
      name: PLANS[id].name,
      price: (PLANS[id].priceCents / 100).toFixed(2),
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: `${siteUrl()}/offres`,
    })),
  };

  return (
    <PageShell>
      <PageTitle
        eyebrow="Étape 6"
        title="Choisissez votre offre"
        lead="Abonnement mensuel, sans engagement et sans essai gratuit. Chaque offre se résilie en ligne en un clic."
      />

      {annule === "1" ? (
        <p role="status" className="mb-5 rounded-xl border border-border bg-surface p-3 text-sm text-fg-muted">
          Paiement annulé. Votre analyse reste disponible, choisissez une offre quand vous le souhaitez.
        </p>
      ) : null}

      {banner ? (
        <div className="mb-6 flex items-start gap-3 rounded-card border border-accent/60 bg-accent-soft/40 p-4">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink">
            <IconLock size={20} />
          </span>
          <div>
            <p className="font-display text-base font-bold text-fg">{banner.title}</p>
            <p className="mt-0.5 text-sm text-fg-muted">{banner.text}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 pt-3 lg:grid-cols-3">
        {PLAN_ORDER.map((id) => (
          <PlanCard
            key={id}
            plan={PLANS[id]}
            currentPlan={currentPlan}
            analysisId={analysisId}
            recommended={recommended === id}
            unavailableReason={analysisLeague && !planCoversLeague(PLANS[id], analysisLeague.id) ? `Ne couvre pas la ${analysisLeague.name}` : null}
          />
        ))}
      </div>

      <div className="mt-8 grid gap-4 text-sm text-fg-muted sm:grid-cols-3">
        <p className="flex items-start gap-2">
          <IconShield size={18} className="mt-0.5 shrink-0 text-accent" />
          Paiement sécurisé par Stripe. Rebond ne stocke aucune donnée bancaire.
        </p>
        <p>
          Résiliation en ligne depuis votre compte, effective à la fin de la période en cours.{" "}
          <Link href="/resiliation" className="font-semibold text-fg underline-offset-2 hover:underline">
            En savoir plus
          </Link>
        </p>
        <p>
          Service réservé aux adultes. Les analyses sont des estimations, jamais une garantie.{" "}
          <Link href="/cgv" className="font-semibold text-fg underline-offset-2 hover:underline">
            Lire les CGV
          </Link>
        </p>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </PageShell>
  );
}
