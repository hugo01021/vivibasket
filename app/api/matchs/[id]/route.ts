import { NextResponse, type NextRequest } from "next/server";
import { getBasketApi } from "~/lib/basket/api";

/** GET /api/matchs/:id — un match et les données d'analyse des deux équipes. */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const basketApi = await getBasketApi();
  const fixture = await basketApi.getFixture(id);
  if (!fixture) return NextResponse.json({ error: "Match introuvable" }, { status: 404 });
  const data = await basketApi.getAnalysisData(fixture);
  return NextResponse.json({ fixture, source: data.source, sheets: { home: data.home, away: data.away }, h2h: data.h2h, marketOdds: data.marketOdds }, { headers: { "Cache-Control": "no-store" } });
}
