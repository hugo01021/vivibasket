import type { NextRequest } from "next/server";
import type { Match } from "@/types";
import { api } from "@/lib/api";
import type { FavoritesPayload } from "@/components/favorites/types";
import { jsonError, parseIdList } from "../_lib/http";

const MAX_IDS = 50;
const PER_TEAM = 3;
const MAX_UPCOMING = 8;
const MAX_RECENT = 8;

function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function dedupe(matches: Match[]): Match[] {
  return [...new Map(matches.map((m) => [m.id, m])).values()];
}

/**
 * GET /api/favorites?teams=a,b&players=c&competitions=d → FavoritesPayload
 * Les favoris sont stockés côté navigateur (ids seulement) : cette route fournit le détail
 * et les matchs (direct, à venir, récents) des équipes suivies.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const teamIds = parseIdList(params.get("teams"), MAX_IDS);
  const playerIds = parseIdList(params.get("players"), MAX_IDS);
  const competitionIds = parseIdList(params.get("competitions"), MAX_IDS);
  if (!teamIds || !playerIds || !competitionIds) {
    return jsonError(400, `Listes d'identifiants invalides (séparés par des virgules, ${MAX_IDS} max).`);
  }

  const [teams, players, competitions] = await Promise.all([
    Promise.all(teamIds.map((id) => api.getTeam(id))).then((list) => list.filter(isDefined)),
    Promise.all(
      playerIds.map(async (id) => {
        const player = await api.getPlayer(id);
        return player ? { player, team: await api.getTeam(player.teamId) } : null;
      }),
    ).then((list) => list.filter(isDefined)),
    Promise.all(competitionIds.map((id) => api.getCompetition(id))).then((list) => list.filter(isDefined)),
  ]);

  const perTeam = await Promise.all(
    teams.map(async (team) => {
      const [live, upcoming, recent] = await Promise.all([
        api.getTeamMatches(team.id, { status: ["live", "halftime"] }),
        api.getTeamMatches(team.id, { status: "scheduled", order: "asc", limit: PER_TEAM }),
        api.getTeamMatches(team.id, { status: "finished", order: "desc", limit: PER_TEAM }),
      ]);
      return { live, upcoming, recent };
    }),
  );
  const matches: FavoritesPayload["matches"] = {
    live: dedupe(perTeam.flatMap((m) => m.live)).sort((a, b) => a.date.localeCompare(b.date)),
    upcoming: dedupe(perTeam.flatMap((m) => m.upcoming))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, MAX_UPCOMING),
    recent: dedupe(perTeam.flatMap((m) => m.recent))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, MAX_RECENT),
  };

  const allMatches = [...matches.live, ...matches.upcoming, ...matches.recent];
  const lookupTeamIds = new Set(allMatches.flatMap((m) => [m.homeTeamId, m.awayTeamId]));
  const lookupCompetitionIds = new Set(allMatches.map((m) => m.competitionId));
  const [lookupTeams, lookupCompetitions] = await Promise.all([
    Promise.all([...lookupTeamIds].map((id) => api.getTeam(id))).then((list) => list.filter(isDefined)),
    Promise.all([...lookupCompetitionIds].map((id) => api.getCompetition(id))).then((list) => list.filter(isDefined)),
  ]);

  const payload: FavoritesPayload = {
    teams,
    players,
    competitions,
    matches,
    lookup: { teams: lookupTeams, competitions: lookupCompetitions },
  };
  return Response.json(payload);
}
