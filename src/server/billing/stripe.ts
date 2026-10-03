import "server-only";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { PLANS, isPlanId, type PlanId } from "~/lib/plans";
import { SITE } from "~/lib/site";
import { getDb, newId, schema } from "~/server/db";
import type { Subscription, User } from "~/server/db/schema";

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

let client: Stripe | null = null;
/** SDK Stripe chargé seulement au premier paiement : les pages démarrent sans l'évaluer. */
export async function getStripe(): Promise<Stripe> {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error("STRIPE_SECRET_KEY manquant");
  if (!client) {
    const { default: StripeSdk } = await import("stripe");
    client = new StripeSdk(key, { appInfo: { name: SITE.name, url: process.env.NEXT_PUBLIC_SITE_URL } });
  }
  return client;
}

function priceIdFromEnv(plan: PlanId): string | undefined {
  const map: Record<PlanId, string | undefined> = {
    basic: process.env.STRIPE_PRICE_BASIC,
    pro: process.env.STRIPE_PRICE_PRO,
    elite: process.env.STRIPE_PRICE_ELITE,
  };
  return map[plan]?.trim() || undefined;
}

/** Ligne de paiement : identifiant de prix configuré, sinon prix défini à la volée. */
export function lineItemFor(plan: PlanId): Stripe.Checkout.SessionCreateParams.LineItem {
  const priceId = priceIdFromEnv(plan);
  if (priceId) return { price: priceId, quantity: 1 };
  const def = PLANS[plan];
  return {
    quantity: 1,
    price_data: {
      currency: "eur",
      unit_amount: def.priceCents,
      recurring: { interval: "month" },
      product_data: {
        name: `${SITE.name} ${def.name}`,
        description: def.pitch,
        metadata: { plan },
      },
    },
  };
}

export async function ensureCustomer(user: User): Promise<string> {
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const stripe = await getStripe();
  const customer = await stripe.customers.create({ email: user.email, metadata: { userId: user.id } });
  const db = await getDb();
  await db.update(schema.users).set({ stripeCustomerId: customer.id }).where(eq(schema.users.id, user.id));
  return customer.id;
}

export async function createCheckoutSession(input: { user: User; plan: PlanId; analysisId: string | null; origin: string }): Promise<string> {
  const stripe = await getStripe();
  const customer = await ensureCustomer(input.user);
  const analyse = input.analysisId ? `&analyse=${encodeURIComponent(input.analysisId)}` : "";
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: input.user.id,
    line_items: [lineItemFor(input.plan)],
    locale: "fr",
    allow_promotion_codes: true,
    success_url: `${input.origin}/paiement/retour?session_id={CHECKOUT_SESSION_ID}${analyse}`,
    cancel_url: `${input.origin}/offres?annule=1${analyse}`,
    metadata: { userId: input.user.id, plan: input.plan, analysisId: input.analysisId ?? "" },
    subscription_data: { metadata: { userId: input.user.id, plan: input.plan } },
    consent_collection: { terms_of_service: "required" },
    custom_text: {
      terms_of_service_acceptance: {
        message: `J'accepte les [CGV](${input.origin}/cgv) et je confirme avoir plus de 18 ans.`,
      },
    },
  });
  if (!session.url) throw new Error("Session Stripe sans URL");
  return session.url;
}

export async function createPortalSession(user: User, returnUrl: string): Promise<string> {
  const stripe = await getStripe();
  const customer = await ensureCustomer(user);
  const session = await stripe.billingPortal.sessions.create({ customer, return_url: returnUrl });
  return session.url;
}

export function planFromStripeSubscription(sub: Stripe.Subscription): PlanId | null {
  const meta = sub.metadata?.plan;
  if (isPlanId(meta)) return meta;
  const item = sub.items.data[0];
  const priceId = item?.price?.id;
  for (const plan of ["basic", "pro", "elite"] as PlanId[]) {
    if (priceId && priceIdFromEnv(plan) === priceId) return plan;
  }
  const productMeta = typeof item?.price?.product === "object" && item.price.product && "metadata" in item.price.product ? item.price.product.metadata?.plan : undefined;
  if (isPlanId(productMeta)) return productMeta;
  const amount = item?.price?.unit_amount;
  for (const plan of ["basic", "pro", "elite"] as PlanId[]) {
    if (amount === PLANS[plan].priceCents) return plan;
  }
  return null;
}

const STATUS_MAP: Record<string, Subscription["status"]> = {
  active: "active",
  trialing: "trialing",
  past_due: "past_due",
  canceled: "canceled",
  incomplete: "incomplete",
  incomplete_expired: "incomplete",
  unpaid: "unpaid",
  paused: "unpaid",
};

function mapStatus(status: Stripe.Subscription.Status): Subscription["status"] {
  return STATUS_MAP[status as string] ?? "canceled";
}

/** Crée ou met à jour l'abonnement local à partir d'un objet Stripe. */
export async function syncSubscriptionFromStripe(sub: Stripe.Subscription, userIdHint?: string | null): Promise<Subscription | null> {
  const db = await getDb();
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  let userId = userIdHint || sub.metadata?.userId || null;
  if (!userId) {
    const rows = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.stripeCustomerId, customerId)).limit(1);
    userId = rows[0]?.id ?? null;
  }
  if (!userId) {
    console.warn(`[stripe] abonnement ${sub.id} sans utilisateur rattaché (client ${customerId})`);
    return null;
  }
  const plan = planFromStripeSubscription(sub);
  if (!plan) {
    console.warn(`[stripe] impossible de déterminer l'offre de l'abonnement ${sub.id}`);
    return null;
  }
  const item = sub.items.data[0];
  const now = Date.now();
  const periodStart = (item?.current_period_start ?? sub.start_date) * 1000;
  const periodEnd = (item?.current_period_end ?? sub.start_date + 30 * 86_400) * 1000;
  const values = {
    userId,
    plan,
    status: mapStatus(sub.status),
    provider: "stripe" as const,
    stripeSubscriptionId: sub.id,
    stripePriceId: item?.price?.id ?? null,
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
    updatedAt: now,
  };
  const existing = await db.select().from(schema.subscriptions).where(eq(schema.subscriptions.stripeSubscriptionId, sub.id)).limit(1);
  if (existing[0]) {
    await db.update(schema.subscriptions).set(values).where(eq(schema.subscriptions.id, existing[0].id));
    return { ...existing[0], ...values };
  }
  const row = { id: newId("sub"), createdAt: now, ...values };
  await db.insert(schema.subscriptions).values(row);
  return row;
}

/** Changement d'offre sur un abonnement Stripe existant (prorata immédiat). */
export async function changeStripePlan(subscription: Subscription, plan: PlanId): Promise<Subscription | null> {
  if (!subscription.stripeSubscriptionId) return null;
  const stripe = await getStripe();
  const current = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
  const item = current.items.data[0];
  const line = lineItemFor(plan);
  const updated = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    items: [
      {
        id: item.id,
        ...(line.price
          ? { price: line.price }
          : {
              price_data: {
                currency: "eur",
                unit_amount: PLANS[plan].priceCents,
                recurring: { interval: "month" },
                product: typeof item.price.product === "string" ? item.price.product : item.price.product.id,
              },
            }),
      },
    ],
    proration_behavior: "create_prorations",
    cancel_at_period_end: false,
    metadata: { plan, userId: subscription.userId },
  });
  return syncSubscriptionFromStripe(updated, subscription.userId);
}

export async function setStripeCancelAtPeriodEnd(subscription: Subscription, cancel: boolean): Promise<Subscription | null> {
  if (!subscription.stripeSubscriptionId) return null;
  const stripe = await getStripe();
  const updated = await stripe.subscriptions.update(subscription.stripeSubscriptionId, { cancel_at_period_end: cancel });
  return syncSubscriptionFromStripe(updated, subscription.userId);
}

/* ─── Mode démonstration (Stripe non configuré) ───────────────────────────── */

export async function activateDemoSubscription(userId: string, plan: PlanId): Promise<Subscription> {
  const db = await getDb();
  const now = Date.now();
  const existing = await db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.userId, userId))
    .limit(5);
  const demo = existing.find((s) => s.provider === "demo" && ["active", "trialing", "past_due"].includes(s.status));
  if (demo) {
    const values = { plan, status: "active" as const, cancelAtPeriodEnd: false, updatedAt: now };
    await db.update(schema.subscriptions).set(values).where(eq(schema.subscriptions.id, demo.id));
    return { ...demo, ...values };
  }
  const row: Subscription = {
    id: newId("sub"),
    userId,
    plan,
    status: "active",
    provider: "demo",
    stripeSubscriptionId: null,
    stripePriceId: null,
    currentPeriodStart: now,
    currentPeriodEnd: now + 30 * 86_400_000,
    cancelAtPeriodEnd: false,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(schema.subscriptions).values(row);
  return row;
}

export async function setLocalCancelAtPeriodEnd(subscription: Subscription, cancel: boolean): Promise<void> {
  const db = await getDb();
  await db
    .update(schema.subscriptions)
    .set({ cancelAtPeriodEnd: cancel, updatedAt: Date.now() })
    .where(eq(schema.subscriptions.id, subscription.id));
}
