import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { analyzeFixture } from "~/lib/basket/engine";
import type { AnalysisResult, Factor, FactorKey, Fixture } from "~/lib/basket/types";
import { PLANS, type Plan, type PlanId } from "~/lib/plans";
import { checkUnlock, getEntitlement, type UnlockCheck } from "~/server/billing/entitlements";
import { getDb, newId, schema } from "~/server/db";
import type { Analysis, User } from "~/server/db/schema";

export async function createAnalysis(user: User, fixture: Fixture, query?: string | null): Promise<{ id: string; unlocked: boolean }> {
  const db = await getDb();
  const result = analyzeFixture(fixture);
  const entitlement = await getEntitlement(user.id);
  const check = checkUnlock(entitlement, fixture.league);
  const now = Date.now();
  const id = newId("ana");
  await db.insert(schema.analyses).values({
    id,
    userId: user.id,
    matchId: fixture.id,
    league: fixture.league,
    homeTeam: fixture.home.name,
    awayTeam: fixture.away.name,
    query: query ?? null,
    resultJson: JSON.stringify(result),
    unlocked: check.ok,
    unlockedAt: check.ok ? now : null,
    createdAt: now,
  });
  return { id, unlocked: check.ok };
}

export async function getAnalysisForUser(userId: string, id: string): Promise<Analysis | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.analyses)
    .where(and(eq(schema.analyses.id, id), eq(schema.analyses.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function listAnalysesForUser(userId: string, limit = 20): Promise<Analysis[]> {
  const db = await getDb();
  return db
    .select()
    .from(schema.analyses)
    .where(eq(schema.analyses.userId, userId))
    .orderBy(desc(schema.analyses.createdAt))
    .limit(limit);
}

/** Déverrouille une analyse si l'abonnement courant le permet (consomme une unité de quota). */
export async function unlockAnalysis(userId: string, id: string): Promise<UnlockCheck | { ok: false; reason: "not_found" }> {
  const analysis = await getAnalysisForUser(userId, id);
  if (!analysis) return { ok: false, reason: "not_found" };
  if (analysis.unlocked) return { ok: true };
  const entitlement = await getEntitlement(userId);
  const check = checkUnlock(entitlement, analysis.league);
  if (!check.ok) return check;
  const db = await getDb();
  await db.update(schema.analyses).set({ unlocked: true, unlockedAt: Date.now() }).where(eq(schema.analyses.id, id));
  return { ok: true };
}

export function parseResult(analysis: Analysis): AnalysisResult {
  return JSON.parse(analysis.resultJson) as AnalysisResult;
}

/** Facteurs visibles avec l'offre Basic. */
export const BASIC_FACTORS: FactorKey[] = ["forme", "terrain", "h2h"];

export type RedactedResult = Omit<AnalysisResult, "projectedScore" | "value" | "keyStats" | "advanced" | "injuries" | "live" | "factors"> & {
  factors: Factor[];
  lockedFactors: FactorKey[];
  projectedScore: AnalysisResult["projectedScore"] | null;
  value: AnalysisResult["value"] | null;
  keyStats: AnalysisResult["keyStats"] | null;
  advanced: AnalysisResult["advanced"] | null;
  injuries: AnalysisResult["injuries"] | null;
  live: AnalysisResult["live"] | null;
  plan: PlanId;
};

/** Ne laisse passer vers le client que les sections comprises dans l'offre. */
export function redactForPlan(result: AnalysisResult, plan: Plan): RedactedResult {
  const factors = plan.access.allFactors ? result.factors : result.factors.filter((f) => BASIC_FACTORS.includes(f.key));
  const lockedFactors = plan.access.allFactors ? [] : result.factors.map((f) => f.key).filter((k) => !BASIC_FACTORS.includes(k));
  return {
    ...result,
    factors,
    lockedFactors,
    projectedScore: plan.access.projectedScore ? result.projectedScore : null,
    value: plan.access.valueDetector ? result.value : null,
    keyStats: plan.access.keyStats ? result.keyStats : null,
    advanced: plan.access.advancedStats ? result.advanced : null,
    injuries: plan.access.injuries ? result.injuries : null,
    live: plan.access.live ? result.live : null,
    plan: plan.id,
  };
}

export function planOrDefault(planId: PlanId | null | undefined): Plan {
  return PLANS[planId ?? "basic"];
}
