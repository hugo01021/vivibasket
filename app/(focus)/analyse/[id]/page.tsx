import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AnalysisScreen } from "~/components/analysis/AnalysisScreen";
import { FullResult } from "~/components/analysis/FullResult";
import { LockedResult } from "~/components/analysis/LockedResult";
import { AppHeader } from "~/components/layout/AppHeader";
import { SiteFooter } from "~/components/layout/SiteFooter";
import { LEAGUES } from "~/lib/basket/teams";
import { PLANS } from "~/lib/plans";
import { getAnalysisForUser, parseResult, redactForPlan, unlockAnalysis } from "~/server/analyses/service";
import { requireUser } from "~/server/auth/dal";
import { getEntitlement } from "~/server/billing/entitlements";

export const metadata: Metadata = { title: "Analyse", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Params = { id: string };
type Search = { lancement?: string; paiement?: string };

export default async function AnalysisPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<Search> }) {
  const { id } = await params;
  const { lancement } = await searchParams;
  const user = await requireUser(`/analyse/${id}`);
  let analysis = await getAnalysisForUser(user.id, id);
  if (!analysis) notFound();

  // Un abonné dont l'offre couvre ce match ne voit jamais l'écran verrouillé.
  if (!analysis.unlocked) {
    const attempt = await unlockAnalysis(user.id, id);
    if (attempt.ok) analysis = (await getAnalysisForUser(user.id, id)) ?? analysis;
  }

  const runFirst = lancement === "1";
  const result = parseResult(analysis);

  if (!analysis.unlocked) {
    return (
      <AnalysisScreen runFirst={runFirst} home={analysis.homeTeam} away={analysis.awayTeam}>
        <LockedResult analysisId={analysis.id} home={analysis.homeTeam} away={analysis.awayTeam} leagueName={LEAGUES[analysis.league].name} phase={result.match.phase} />
      </AnalysisScreen>
    );
  }

  const entitlement = await getEntitlement(user.id);
  const plan = entitlement.plan ?? PLANS.basic;
  const redacted = redactForPlan({ ...result, match: { ...result.match, id: analysis.id } }, plan);

  return (
    <AnalysisScreen runFirst={runFirst} home={analysis.homeTeam} away={analysis.awayTeam}>
      <div className="flex min-h-dvh flex-col">
        <AppHeader />
        <main id="contenu" className="flex-1">
          <FullResult result={redacted} usage={{ used: entitlement.used, quota: entitlement.quota }} />
        </main>
        <SiteFooter />
      </div>
    </AnalysisScreen>
  );
}
