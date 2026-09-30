import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { LiveDot } from "@/components/ui/LiveDot";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AiMatchCard } from "../_components/AiMatchCard";
import { AnalysisPageHeader } from "../_components/AnalysisPageHeader";
import { loadFeaturedAnalyses, type AnalyzedMatch } from "../_lib/featured";

export const metadata: Metadata = {
  title: "Analyse IA",
  description: "Résumés, probabilités de victoire et points clés des matchs du jour et des matchs en direct.",
};

function Grid({ items }: { items: AnalyzedMatch[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <AiMatchCard key={item.match.id} {...item} />
      ))}
    </div>
  );
}

export default async function AiAnalysisPage() {
  const items = await loadFeaturedAnalyses();
  const live = items.filter((i) => i.match.status === "live" || i.match.status === "halftime");
  const upcoming = items.filter((i) => i.match.status === "scheduled");
  const finished = items.filter((i) => i.match.status === "finished");

  return (
    <div className="space-y-8">
      <div>
        <AnalysisPageHeader title="Analyse IA">
          Pour chaque match en direct ou programmé aujourd’hui : un résumé, la probabilité de victoire avant-match et les
          points clés à suivre.
        </AnalysisPageHeader>
        <p className="mt-3 max-w-2xl text-xs text-fg-muted">
          <span className="font-semibold text-fg">Version de démonstration.</span> Ces analyses sont générées automatiquement à
          partir de règles statistiques (forme, ratings, box scores). Elles seront à terme rédigées par un modèle de langage.
        </p>
      </div>

      {items.length === 0 && (
        <EmptyState title="Aucun match à analyser aujourd’hui">Revenez lors de la prochaine journée de compétition.</EmptyState>
      )}

      {live.length > 0 && (
        <section aria-labelledby="titre-ia-direct">
          <SectionTitle count={live.length}>
            <span id="titre-ia-direct" className="flex items-center gap-2">
              <LiveDot /> En direct
            </span>
          </SectionTitle>
          <Grid items={live} />
        </section>
      )}

      {upcoming.length > 0 && (
        <section aria-labelledby="titre-ia-avenir">
          <SectionTitle count={upcoming.length}>
            <span id="titre-ia-avenir">À venir aujourd’hui</span>
          </SectionTitle>
          <Grid items={upcoming} />
        </section>
      )}

      {finished.length > 0 && (
        <section aria-labelledby="titre-ia-termines">
          <SectionTitle count={finished.length}>
            <span id="titre-ia-termines">Terminés aujourd’hui</span>
          </SectionTitle>
          <Grid items={finished} />
        </section>
      )}
    </div>
  );
}
