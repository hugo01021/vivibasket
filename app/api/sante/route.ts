import { NextResponse } from "next/server";
import { isRealDataEnabled } from "~/lib/basket/api";
import { isStripeConfigured } from "~/server/billing/stripe";
import { getDb, isEphemeralDatabase } from "~/server/db";

/** GET /api/sante — état du service (supervision). */
export async function GET() {
  let database = "ok";
  try {
    await getDb();
  } catch (error) {
    database = error instanceof Error ? error.message : "erreur";
  }
  let data = isRealDataEnabled() ? "api-sports" : "données fictives";
  if (isRealDataEnabled()) {
    const { getLastDataError } = await import("~/lib/basket/providers/api-sports");
    const err = getLastDataError();
    if (err) data = `api-sports (dernière erreur : ${err})`;
  }
  return NextResponse.json({
    ok: database === "ok" && !isEphemeralDatabase(),
    database: isEphemeralDatabase() ? "éphémère (/tmp) + cookie signé : configurez DATABASE_URL pour la production" : database,
    stripe: isStripeConfigured() ? "configuré" : "mode démonstration",
    data,
    time: new Date().toISOString(),
  });
}
