import { NextResponse, type NextRequest } from "next/server";
import { basketApi } from "~/lib/basket/api";

/** GET /api/matchs/:id — un match et les fiches des deux équipes. */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const fixture = await basketApi.getFixture(id);
  if (!fixture) return NextResponse.json({ error: "Match introuvable" }, { status: 404 });
  const [home, away] = await Promise.all([basketApi.getTeamSheet(fixture.home.id, fixture.dateKey), basketApi.getTeamSheet(fixture.away.id, fixture.dateKey)]);
  return NextResponse.json({ fixture, sheets: { home, away } }, { headers: { "Cache-Control": "no-store" } });
}
