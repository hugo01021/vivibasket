import type { Metadata } from "next";
import { PageShell, PageTitle } from "~/components/layout/PageShell";
import { MatchList } from "~/components/match/MatchList";
import { getBasketApi } from "~/lib/basket/api";
import { formatDateLong } from "~/lib/utils";

export const metadata: Metadata = {
  title: "Matchs du jour",
  description: "Programme du jour en NBA, EuroLeague et Betclic Élite : horaires, salles, scores en direct et analyse IA en un clic.",
  alternates: { canonical: "/matchs" },
};

/** Page mise en cache 60 s : les scores simulés évoluent à la minute. */
export const revalidate = 60;

export default async function MatchesPage() {
  const now = new Date();
  const basketApi = await getBasketApi();
  const fixtures = await basketApi.getTodayFixtures(now);
  const liveCount = fixtures.filter((f) => f.status === "live").length;
  return (
    <PageShell>
      <PageTitle
        eyebrow={formatDateLong(now)}
        title="Matchs du jour"
        lead={
          liveCount > 0
            ? `${liveCount} match${liveCount > 1 ? "s" : ""} en direct en ce moment. Touchez « analyser » pour lancer le modèle sur une affiche.`
            : "Touchez « analyser » pour lancer le modèle sur une affiche."
        }
      />
      <MatchList fixtures={fixtures} />
      <p className="mt-6 text-xs text-fg-subtle">
        {basketApi.name === "api-sports"
          ? "Programme et scores fournis par api-basketball, rafraîchis toutes les dix minutes."
          : "Données de démonstration : programme, scores et statistiques sont simulés en attendant le branchement d'un fournisseur de données."}
      </p>
    </PageShell>
  );
}
