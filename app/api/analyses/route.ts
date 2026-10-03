import { NextResponse, type NextRequest } from "next/server";
import { getBasketApi } from "~/lib/basket/api";
import { createAnalysis, listAnalysesForUser } from "~/server/analyses/service";
import { getCurrentUser } from "~/server/auth/dal";

/** GET /api/analyses — analyses de l'utilisateur connecté. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const rows = await listAnalysesForUser(user.id, 50);
  return NextResponse.json({
    analyses: rows.map((a) => ({ id: a.id, matchId: a.matchId, league: a.league, home: a.homeTeam, away: a.awayTeam, unlocked: a.unlocked, createdAt: a.createdAt })),
  });
}

/** POST /api/analyses { matchId } ou { query } — lance une analyse. */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  let body: { matchId?: string; query?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON attendu" }, { status: 400 });
  }
  const basketApi = await getBasketApi();
  let fixture = body.matchId ? await basketApi.getFixture(body.matchId) : undefined;
  if (!fixture && body.query) {
    const resolution = await basketApi.resolveMatchup(body.query);
    if (!resolution.ok) return NextResponse.json({ error: resolution.error, suggestions: resolution.suggestions }, { status: 422 });
    fixture = resolution.fixture;
  }
  if (!fixture) return NextResponse.json({ error: "Indiquez matchId ou query" }, { status: 400 });
  const { id, unlocked } = await createAnalysis(user, fixture, body.query ?? null);
  return NextResponse.json({ id, unlocked, url: `/analyse/${id}` }, { status: 201 });
}
