"use server";

import { redirect } from "next/navigation";
import { getBasketApi } from "~/lib/basket/api";
import { getCurrentUser } from "~/server/auth/dal";
import { createAnalysis } from "~/server/analyses/service";
import { persistToCookie } from "~/server/db/cookie-store";

export type SearchState = { error?: string; suggestions?: string[]; query?: string };

/** Analyse depuis le champ de recherche libre (« Lakers vs Celtics »). */
export async function analyzeFromSearch(_prev: SearchState, formData: FormData): Promise<SearchState> {
  const query = String(formData.get("q") ?? "").trim();
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(`/analyser${query ? `?q=${encodeURIComponent(query)}` : ""}`)}`);
  const basketApi = await getBasketApi();
  const resolution = await basketApi.resolveMatchup(query);
  if (!resolution.ok) return { error: resolution.error, suggestions: resolution.suggestions, query };
  const { id } = await createAnalysis(user, resolution.fixture, query);
  await persistToCookie(user.id);
  redirect(`/analyse/${id}?lancement=1`);
}

/** Analyse depuis une carte de match (bouton « analyser »). */
export async function analyzeFixtureAction(formData: FormData): Promise<void> {
  const matchId = String(formData.get("matchId") ?? "");
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(`/analyser?match=${encodeURIComponent(matchId)}`)}`);
  const basketApi = await getBasketApi();
  const fixture = await basketApi.getFixture(matchId);
  if (!fixture) redirect("/analyser?erreur=match-introuvable");
  const { id } = await createAnalysis(user, fixture, null);
  await persistToCookie(user.id);
  redirect(`/analyse/${id}?lancement=1`);
}
