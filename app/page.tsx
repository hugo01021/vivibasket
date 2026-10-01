import type { Metadata } from "next";
import { HeroArt } from "~/components/brand/HeroArt";
import { FeatureTriad } from "~/components/home/FeatureTriad";
import { StarField } from "~/components/home/StarField";
import { AppHeader } from "~/components/layout/AppHeader";
import { SiteFooter } from "~/components/layout/SiteFooter";
import { Button } from "~/components/ui/Button";
import { IconArrowRight } from "~/components/ui/icons";
import { PLANS } from "~/lib/plans";
import { SITE, siteUrl } from "~/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${SITE.name} — ${SITE.tagline}` },
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: SITE.name,
        url: siteUrl(),
        logo: `${siteUrl()}/icons/icon-512.png`,
      },
      {
        "@type": "WebSite",
        name: SITE.name,
        url: siteUrl(),
        inLanguage: "fr-FR",
      },
      {
        "@type": "SoftwareApplication",
        name: SITE.name,
        applicationCategory: "SportsApplication",
        operatingSystem: "Web",
        description: SITE.description,
        offers: Object.values(PLANS).map((p) => ({
          "@type": "Offer",
          name: `${SITE.name} ${p.name}`,
          price: (p.priceCents / 100).toFixed(2),
          priceCurrency: "EUR",
          url: `${siteUrl()}/offres`,
        })),
      },
    ],
  };

  return (
    <>
      <StarField />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <AppHeader />
        <main id="contenu" className="flex-1">
          <section className="mx-auto grid max-w-5xl items-center gap-8 px-4 pb-10 pt-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:pt-16">
            <div className="animate-rise">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Analyse de basket par IA</p>
              <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.05] text-fg sm:text-5xl lg:text-6xl">{SITE.tagline}</h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-fg-muted sm:text-lg">
                Choisissez un match, laissez le modèle croiser la forme, le terrain, les confrontations, l&apos;attaque, la défense, le rythme,
                la fatigue et les blessures. En quelques secondes, vous obtenez des probabilités chiffrées, un score projeté et un résumé rédigé.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button href="/analyser" size="lg">
                  Analyser un match
                  <IconArrowRight size={18} />
                </Button>
                <Button href="/matchs" variant="secondary" size="lg">
                  Matchs du jour
                </Button>
              </div>
              <p className="mt-4 text-xs text-fg-subtle">Abonnement mensuel sans engagement · résiliable en ligne · réservé aux adultes (18+)</p>
            </div>
            <div className="animate-float mx-auto w-full max-w-md lg:max-w-none">
              <HeroArt className="h-auto w-full drop-shadow-[0_24px_40px_rgba(0,0,0,0.55)]" />
            </div>
          </section>

          <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6" aria-labelledby="atouts">
            <h2 id="atouts" className="sr-only">
              Pourquoi Rebond
            </h2>
            <FeatureTriad />
          </section>
        </main>
        <SiteFooter transparent />
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
