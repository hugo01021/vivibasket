import { NextResponse, type NextRequest } from "next/server";
import { getBasketApi } from "~/lib/basket/api";
import { isLeagueId } from "~/lib/basket/teams";
import { sportsDayKey } from "~/lib/basket/fixtures";

/** GET /api/matchs?ligue=nba|euroleague|betclic — programme du jour (données fictives). */
export async function GET(request: NextRequest) {
  const league = request.nextUrl.searchParams.get("ligue");
  const now = new Date();
  const basketApi = await getBasketApi();
  const fixtures = await basketApi.getTodayFixtures(now, isLeagueId(league) ? league : undefined);
  return NextResponse.json(
    { date: sportsDayKey(now), source: basketApi.name, count: fixtures.length, fixtures },
    { headers: { "Cache-Control": "no-store" } },
  );
}
