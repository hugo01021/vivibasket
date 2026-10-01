import "server-only";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import type { LeagueId } from "~/lib/basket/types";
import { PLANS, planCoversLeague, type Plan } from "~/lib/plans";
import { getDb, schema } from "~/server/db";
import type { Subscription } from "~/server/db/schema";

export const ACTIVE_STATUSES = ["active", "trialing", "past_due"] as const;

export type Entitlement = {
  subscription: Subscription | null;
  plan: Plan | null;
  active: boolean;
  /** Analyses débloquées sur la période courante. */
  used: number;
  quota: number | null;
  remaining: number | null;
  periodStart: number;
  periodEnd: number;
};

export type UnlockCheck =
  | { ok: true }
  | { ok: false; reason: "no_subscription" | "inactive" | "league_not_covered" | "quota_exceeded" };

export async function getActiveSubscription(userId: string): Promise<Subscription | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.subscriptions)
    .where(and(eq(schema.subscriptions.userId, userId), inArray(schema.subscriptions.status, [...ACTIVE_STATUSES])))
    .orderBy(desc(schema.subscriptions.updatedAt))
    .limit(1);
  const sub = rows[0];
  if (!sub) return null;
  // Tolérance de 3 jours au-delà de la fin de période (relances de paiement Stripe).
  if (sub.currentPeriodEnd + 3 * 86_400_000 < Date.now()) return null;
  return sub;
}

/** Dernier abonnement connu, actif ou non (pour la page compte). */
export async function getLatestSubscription(userId: string): Promise<Subscription | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.userId, userId))
    .orderBy(desc(schema.subscriptions.updatedAt))
    .limit(1);
  return rows[0] ?? null;
}

function calendarMonth(now = new Date()): { start: number; end: number } {
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
  return { start, end };
}

export async function getEntitlement(userId: string): Promise<Entitlement> {
  const subscription = await getActiveSubscription(userId);
  const month = calendarMonth();
  const periodStart = subscription?.currentPeriodStart ?? month.start;
  const periodEnd = subscription?.currentPeriodEnd ?? month.end;
  const plan = subscription ? PLANS[subscription.plan] : null;

  const db = await getDb();
  const rows = await db
    .select({ id: schema.analyses.id })
    .from(schema.analyses)
    .where(
      and(
        eq(schema.analyses.userId, userId),
        eq(schema.analyses.unlocked, true),
        gte(schema.analyses.unlockedAt, periodStart),
        lte(schema.analyses.unlockedAt, periodEnd),
      ),
    );
  const used = rows.length;
  const quota = plan?.monthlyQuota ?? null;
  return {
    subscription,
    plan,
    active: Boolean(subscription),
    used,
    quota,
    remaining: quota === null ? null : Math.max(0, quota - used),
    periodStart,
    periodEnd,
  };
}

/** Peut-on débloquer (ou créer débloquée) une analyse pour cette ligue ? */
export function checkUnlock(entitlement: Entitlement, league: LeagueId): UnlockCheck {
  if (!entitlement.subscription || !entitlement.plan) return { ok: false, reason: "no_subscription" };
  if (!ACTIVE_STATUSES.includes(entitlement.subscription.status as (typeof ACTIVE_STATUSES)[number])) {
    return { ok: false, reason: "inactive" };
  }
  if (!planCoversLeague(entitlement.plan, league)) return { ok: false, reason: "league_not_covered" };
  if (entitlement.remaining !== null && entitlement.remaining <= 0) return { ok: false, reason: "quota_exceeded" };
  return { ok: true };
}

export function describeUnlockFailure(reason: Exclude<UnlockCheck, { ok: true }>["reason"], leagueName: string): string {
  switch (reason) {
    case "no_subscription":
      return "Choisissez une offre pour débloquer cette analyse et toutes les suivantes.";
    case "inactive":
      return "Votre abonnement est en attente de paiement. Mettez à jour votre moyen de paiement pour continuer.";
    case "league_not_covered":
      return `Votre offre actuelle couvre la NBA uniquement. Passez à Pro ou Elite pour analyser la ${leagueName}.`;
    case "quota_exceeded":
      return "Vous avez utilisé vos 10 analyses du mois. Passez à Pro pour des analyses illimitées.";
  }
}
