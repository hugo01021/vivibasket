import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "~/server/auth/token";

/** Parcours protégé : étapes 3 à 7 et le compte. */
const PROTECTED_PREFIXES = ["/analyser", "/analyse", "/compte", "/paiement"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Vérification optimiste de la session (signature + expiration du cookie, sans
 * base de données). La vérification complète a lieu dans les pages et actions.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (isProtected(pathname) && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    const response = NextResponse.redirect(url);
    if (request.cookies.has(SESSION_COOKIE)) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  if (pathname === "/connexion" && session) {
    const next = request.nextUrl.searchParams.get("next");
    const url = request.nextUrl.clone();
    url.search = "";
    url.pathname = next && next.startsWith("/") && !next.startsWith("//") ? next.split("?")[0] : "/analyser";
    if (next && next.includes("?")) url.search = next.slice(next.indexOf("?"));
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|sw\\.js|manifest\\.webmanifest|icons/|.*\\.(?:png|svg|ico|txt|xml|webmanifest|woff2?)$).*)"],
};
