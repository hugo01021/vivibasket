import type { NextRequest } from "next/server";
import { api } from "@/lib/api";
import { jsonError, parseIntInRange } from "../_lib/http";

const MAX_QUERY_LENGTH = 100;

/** GET /api/search?q=…&limit=… → SearchResult[] */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = params.get("q");
  if (q === null) return jsonError(400, "Paramètre « q » requis.");
  const query = q.trim();
  if (query.length > MAX_QUERY_LENGTH) return jsonError(400, `Requête trop longue (${MAX_QUERY_LENGTH} caractères max).`);

  let limit = 12;
  const rawLimit = params.get("limit");
  if (rawLimit !== null) {
    const parsed = parseIntInRange(rawLimit, 1, 50);
    if (parsed === null) return jsonError(400, "Paramètre « limit » invalide (entier entre 1 et 50).");
    limit = parsed;
  }

  // Moins de 2 caractères : pas d'erreur, simplement aucun résultat.
  const results = query.length < 2 ? [] : await api.search(query, limit);
  return Response.json(results);
}
