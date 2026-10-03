import { NextResponse, type NextRequest } from "next/server";
import { safeInternalPath } from "~/lib/utils";
import { destroySession } from "~/server/auth/session";

/** Supprime le cookie de session (même invalide) puis renvoie vers la connexion. */
export async function GET(request: NextRequest) {
  await destroySession();
  const next = safeInternalPath(request.nextUrl.searchParams.get("next"), "/analyser");
  return NextResponse.redirect(new URL(`/connexion?next=${encodeURIComponent(next)}`, request.nextUrl));
}
