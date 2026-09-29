import type { NextRequest } from "next/server";
import type { MatchStatus } from "@/types";
import { api, type MatchFilter } from "@/lib/api";
import { isValidDay } from "@/lib/time";
import { isValidId, jsonError, parseIntInRange } from "../_lib/http";

const STATUSES: readonly MatchStatus[] = ["scheduled", "live", "halftime", "finished", "postponed", "cancelled"];
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function isStatus(value: string): value is MatchStatus {
  return (STATUSES as readonly string[]).includes(value);
}

/**
 * GET /api/matches → Match[]
 * Filtres optionnels : `team` (id), `competition` (slug ou id), `status` (liste séparée par des virgules),
 * `day` (YYYY-MM-DD, journée sportive), `order` (asc | desc), `limit` (1-200, 50 par défaut).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const filter: MatchFilter = { limit: DEFAULT_LIMIT };

  const team = params.get("team");
  if (team !== null) {
    if (!isValidId(team)) return jsonError(400, "Paramètre « team » invalide.");
    if (!(await api.getTeam(team))) return jsonError(404, "Équipe introuvable.");
    filter.teamId = team;
  }

  const competition = params.get("competition");
  if (competition !== null) {
    if (!isValidId(competition)) return jsonError(400, "Paramètre « competition » invalide.");
    const found = await api.getCompetition(competition);
    if (!found) return jsonError(404, "Compétition introuvable.");
    filter.competitionId = found.id;
  }

  const status = params.get("status");
  if (status !== null) {
    const list = status.split(",").map((s) => s.trim()).filter(Boolean);
    if (list.length === 0 || !list.every(isStatus)) {
      return jsonError(400, `Paramètre « status » invalide (valeurs : ${STATUSES.join(", ")}).`);
    }
    filter.status = list as MatchStatus[];
  }

  const day = params.get("day");
  if (day !== null) {
    if (!isValidDay(day)) return jsonError(400, "Paramètre « day » invalide (format YYYY-MM-DD).");
    filter.day = day;
  }

  const order = params.get("order");
  if (order !== null) {
    if (order !== "asc" && order !== "desc") return jsonError(400, "Paramètre « order » invalide (asc ou desc).");
    filter.order = order;
  }

  const limit = params.get("limit");
  if (limit !== null) {
    const parsed = parseIntInRange(limit, 1, MAX_LIMIT);
    if (parsed === null) return jsonError(400, `Paramètre « limit » invalide (entier entre 1 et ${MAX_LIMIT}).`);
    filter.limit = parsed;
  }

  const matches = await api.getMatches(filter);
  return Response.json(matches);
}
