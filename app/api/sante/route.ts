import { NextResponse } from "next/server";
import { isStripeConfigured } from "~/server/billing/stripe";
import { getDb } from "~/server/db";

/** GET /api/sante — état du service (supervision). */
export async function GET() {
  let database = "ok";
  try {
    await getDb();
  } catch (error) {
    database = error instanceof Error ? error.message : "erreur";
  }
  return NextResponse.json({ ok: database === "ok", database, stripe: isStripeConfigured() ? "configuré" : "mode démonstration", time: new Date().toISOString() });
}
