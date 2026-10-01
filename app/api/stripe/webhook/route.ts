import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe, isStripeConfigured, syncSubscriptionFromStripe } from "~/server/billing/stripe";
import { getDb, schema } from "~/server/db";

/**
 * POST /api/stripe/webhook — synchronise les abonnements.
 * Événements utiles : checkout.session.completed, customer.subscription.*, invoice.paid, invoice.payment_failed.
 */
export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) return NextResponse.json({ error: "Stripe non configuré" }, { status: 503 });
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET manquant" }, { status: 503 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Signature absente" }, { status: 400 });
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(payload, signature, secret);
  } catch (error) {
    console.warn("[stripe] signature invalide", error);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  const db = await getDb();
  const seen = await db.select({ id: schema.stripeEvents.id }).from(schema.stripeEvents).where(eq(schema.stripeEvents.id, event.id)).limit(1);
  if (seen[0]) return NextResponse.json({ received: true, duplicate: true });

  try {
    await handleEvent(event);
    await db.insert(schema.stripeEvents).values({ id: event.id, type: event.type, processedAt: Date.now() });
  } catch (error) {
    console.error(`[stripe] échec du traitement de ${event.type}`, error);
    return NextResponse.json({ error: "Traitement échoué" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  const stripe = getStripe();
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode !== "subscription" || !session.subscription) return;
      const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
      const sub = await stripe.subscriptions.retrieve(subId);
      await syncSubscriptionFromStripe(sub, session.client_reference_id ?? session.metadata?.userId ?? null);
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed": {
      await syncSubscriptionFromStripe(event.data.object);
      return;
    }
    case "invoice.paid":
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const ref = invoice.parent?.subscription_details?.subscription;
      const subId = typeof ref === "string" ? ref : ref?.id;
      if (!subId) return;
      const sub = await stripe.subscriptions.retrieve(subId);
      await syncSubscriptionFromStripe(sub);
      return;
    }
    default:
      return;
  }
}
