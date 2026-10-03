import type { Metadata } from "next";
import { HeroArt } from "~/components/brand/HeroArt";
import { FeatureTriad } from "~/components/home/FeatureTriad";
import { AppHeader } from "~/components/layout/AppHeader";
import { SiteFooter } from "~/components/layout/SiteFooter";
import { Prewarm } from "~/components/pwa/Prewarm";
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
      <Prewarm />
      <div className="flex min-h-dvh flex-col">
        <AppHeader />
        <main id="contenu" className="flex-1">
          <section className="mx-auto grid max-w-5xl items-center gap-6 px-4 pb-10 pt-4 sm:gap-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:pt-16">
            <div className="order-first mx-auto w-full max-w-md lg:order-none lg:col-start-2 lg:max-w-none">
              <HeroArt className="h-auto w-full" />
            </div>
            <div className="animate-rise lg:col-start-1 lg:row-start-1">
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
          </section>

          <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6" aria-labelledby="atouts">
            <h2 id="atouts" className="sr-only">
              Pourquoi DunkOne
            </h2>
            <FeatureTriad />
          </section>
        </main>
        <SiteFooter />
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
