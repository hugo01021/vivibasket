import { api } from "@/lib/api";
import { isValidId, jsonError } from "../_lib/http";

/**
 * POST /api/analysis  { matchId } → MatchAnalysis
 * Aujourd'hui produite par des règles (source "mock") ; destinée à appeler un LLM.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Corps JSON invalide.");
  }
  const matchId =
    body && typeof body === "object" && "matchId" in body ? (body as { matchId: unknown }).matchId : undefined;
  if (typeof matchId !== "string" || !isValidId(matchId)) {
    return jsonError(400, "Champ « matchId » requis (chaîne).");
  }

  const analysis = await api.getMatchAnalysis(matchId);
  if (!analysis) return jsonError(404, "Match introuvable.");
  return Response.json(analysis);
}
