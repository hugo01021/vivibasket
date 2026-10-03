import { NextResponse } from "next/server";
import { getDb } from "~/server/db";

/**
 * GET /api/reveil — réveille la fonction serverless et ouvre la base
 * pendant que l'utilisateur remplit un formulaire, pour que l'action qui
 * suit (connexion, analyse) tombe sur une instance déjà chaude.
 */
export async function GET() {
  await getDb();
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
