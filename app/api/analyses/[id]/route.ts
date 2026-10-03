import { NextResponse, type NextRequest } from "next/server";
import { PLANS } from "~/lib/plans";
import { getAnalysisForUser, parseResult, redactForPlan } from "~/server/analyses/service";
import { getCurrentUser } from "~/server/auth/dal";
import { getEntitlement } from "~/server/billing/entitlements";

/** GET /api/analyses/:id — résultat (filtré selon l'offre) ou état verrouillé. */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { id } = await context.params;
  const analysis = await getAnalysisForUser(user.id, id);
  if (!analysis) return NextResponse.json({ error: "Analyse introuvable" }, { status: 404 });
  if (!analysis.unlocked) {
    return NextResponse.json({ id, locked: true, home: analysis.homeTeam, away: analysis.awayTeam, league: analysis.league, unlockUrl: `/offres?analyse=${id}` });
  }
  const entitlement = await getEntitlement(user.id);
  const result = redactForPlan(parseResult(analysis), entitlement.plan ?? PLANS.basic);
  return NextResponse.json({ id, locked: false, result }, { headers: { "Cache-Control": "private, no-store" } });
}
