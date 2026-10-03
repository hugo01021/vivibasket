"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isPlanId } from "~/lib/plans";
import { siteUrl } from "~/lib/site";
import { getCurrentUser, requireUser } from "~/server/auth/dal";
import { unlockAnalysis } from "~/server/analyses/service";
import { getActiveSubscription } from "~/server/billing/entitlements";
import {
  activateDemoSubscription,
  changeStripePlan,
  createCheckoutSession,
  createPortalSession,
  isStripeConfigured,
  setLocalCancelAtPeriodEnd,
  setStripeCancelAtPeriodEnd,
} from "~/server/billing/stripe";
import { getDb, schema } from "~/server/db";
import { persistToCookie } from "~/server/db/cookie-store";

async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return host ? `${proto}://${host}` : siteUrl();
}

function analysisParam(id: string | null): string {
  return id ? `?analyse=${encodeURIComponent(id)}` : "";
}

/** Bouton d'une offre : ouvre le paiement (Stripe Checkout, ou simulation si Stripe n'est pas configuré). */
export async function startCheckout(formData: FormData): Promise<void> {
  const plan = String(formData.get("plan") ?? "");
  const analysisId = String(formData.get("analyse") ?? "") || null;
  if (!isPlanId(plan)) redirect(`/offres${analysisParam(analysisId)}`);

  const user = await getCurrentUser();
  if (!user) {
    const next = `/offres${analysisParam(analysisId)}${analysisId ? "&" : "?"}plan=${plan}`;
    redirect(`/connexion?next=${encodeURIComponent(next)}`);
  }

  const current = await getActiveSubscription(user.id);
  if (!isStripeConfigured()) {
    redirect(`/paiement/demo?plan=${plan}${analysisId ? `&analyse=${encodeURIComponent(analysisId)}` : ""}`);
  }

  if (current?.provider === "stripe" && current.stripeSubscriptionId) {
    // Changement d'offre sur l'abonnement existant : pas de second abonnement.
    if (current.plan !== plan) await changeStripePlan(current, plan);
    if (analysisId) await unlockAnalysis(user.id, analysisId);
    redirect(analysisId ? `/analyse/${analysisId}` : "/compte?maj=offre");
  }

  const url = await createCheckoutSession({ user, plan, analysisId, origin: await requestOrigin() });
  redirect(url);
}

/** Mode démonstration : active l'abonnement sans paiement réel. */
export async function confirmDemoPayment(formData: FormData): Promise<void> {
  if (isStripeConfigured()) redirect("/offres");
  const plan = String(formData.get("plan") ?? "");
  const analysisId = String(formData.get("analyse") ?? "") || null;
  if (!isPlanId(plan)) redirect("/offres");
  const user = await requireUser(`/paiement/demo?plan=${plan}`);
  await activateDemoSubscription(user.id, plan);
  if (analysisId) await unlockAnalysis(user.id, analysisId);
  await persistToCookie(user.id);
  redirect(analysisId ? `/analyse/${analysisId}?paiement=ok` : "/compte?paiement=ok");
}

export async function cancelSubscription(): Promise<void> {
  const user = await requireUser("/compte");
  const sub = await getActiveSubscription(user.id);
  if (sub) {
    if (sub.provider === "stripe" && isStripeConfigured()) await setStripeCancelAtPeriodEnd(sub, true);
    else await setLocalCancelAtPeriodEnd(sub, true);
  }
  await persistToCookie(user.id);
  redirect("/compte?resiliation=ok");
}

export async function resumeSubscription(): Promise<void> {
  const user = await requireUser("/compte");
  const sub = await getActiveSubscription(user.id);
  if (sub) {
    if (sub.provider === "stripe" && isStripeConfigured()) await setStripeCancelAtPeriodEnd(sub, false);
    else await setLocalCancelAtPeriodEnd(sub, false);
  }
  await persistToCookie(user.id);
  redirect("/compte?reprise=ok");
}

export async function openBillingPortal(): Promise<void> {
  const user = await requireUser("/compte");
  if (!isStripeConfigured()) redirect("/compte");
  const url = await createPortalSession(user, `${await requestOrigin()}/compte`);
  redirect(url);
}

export async function setPriorityAlerts(formData: FormData): Promise<void> {
  const user = await requireUser("/compte");
  const enabled = formData.get("enabled") === "on";
  const db = await getDb();
  await db.update(schema.users).set({ priorityAlerts: enabled }).where(eq(schema.users.id, user.id));
  await persistToCookie(user.id);
  redirect("/compte?alertes=ok");
}
