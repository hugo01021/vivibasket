import "server-only";
import { desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";
import { basketApi } from "~/lib/basket/api";
import { analyzeFixture } from "~/lib/basket/engine";
import { isPlanId } from "~/lib/plans";
import { getDb, isEphemeralDatabase, schema } from "~/server/db";
import type { Subscription } from "~/server/db/schema";
import { signJson, verifyJson } from "~/server/auth/token";

/**
 * Repli « sans base de données » (aperçu Vercel sans DATABASE_URL).
 *
 * La base SQLite de /tmp change d'une fonction serverless à l'autre. Pour que
 * le parcours reste cohérent, l'état de l'utilisateur courant (compte,
 * abonnement, dernières analyses) est sérialisé dans un cookie signé après
 * chaque mutation, puis réinjecté dans la base locale au début de chaque
 * requête. Le résultat d'une analyse n'est pas stocké : il est recalculé de
 * façon déterministe à partir de l'identifiant du match.
 */
export const STATE_COOKIE = "rebond_state";
const MAX_ANALYSES = 12;

type Snapshot = {
  v: 1;
  u: { id: string; e: string; h: string; t: number; c: number; a: 0 | 1 };
  s: null | { id: string; p: string; st: string; pr: string; ps: number; pe: number; ca: 0 | 1; c: number };
  a: Array<{ id: string; m: string; c: number; u: 0 | 1; ua: number | null }>;
};

/** Réinjecte l'état du cookie dans la base locale (une fois par requête). */
export const hydrateFromCookie = cache(async (sessionId: string, sessionExpiresAt: number): Promise<void> => {
  if (!isEphemeralDatabase()) return;
  const store = await cookies();
  const snapshot = await verifyJson<Snapshot>(store.get(STATE_COOKIE)?.value);
  if (!snapshot || snapshot.v !== 1) return;
  const db = await getDb();
  const now = Date.now();

  await db
    .insert(schema.users)
    .values({
      id: snapshot.u.id,
      email: snapshot.u.e,
      passwordHash: snapshot.u.h,
      termsAcceptedAt: snapshot.u.t,
      createdAt: snapshot.u.c,
      priorityAlerts: snapshot.u.a === 1,
    })
    .onConflictDoNothing();

  await db
    .insert(schema.sessions)
    .values({ id: sessionId, userId: snapshot.u.id, expiresAt: sessionExpiresAt, createdAt: now })
    .onConflictDoNothing();

  if (snapshot.s && isPlanId(snapshot.s.p)) {
    await db
      .insert(schema.subscriptions)
      .values({
        id: snapshot.s.id,
        userId: snapshot.u.id,
        plan: snapshot.s.p,
        status: snapshot.s.st as Subscription["status"],
        provider: snapshot.s.pr as Subscription["provider"],
        stripeSubscriptionId: null,
        stripePriceId: null,
        currentPeriodStart: snapshot.s.ps,
        currentPeriodEnd: snapshot.s.pe,
        cancelAtPeriodEnd: snapshot.s.ca === 1,
        createdAt: snapshot.s.c,
        updatedAt: now,
      })
      .onConflictDoNothing();
  }

  for (const a of snapshot.a) {
    const fixture = await basketApi.getFixture(a.m);
    if (!fixture) continue;
    const result = analyzeFixture(fixture);
    await db
      .insert(schema.analyses)
      .values({
        id: a.id,
        userId: snapshot.u.id,
        matchId: a.m,
        league: fixture.league,
        homeTeam: fixture.home.name,
        awayTeam: fixture.away.name,
        query: null,
        resultJson: JSON.stringify(result),
        unlocked: a.u === 1,
        unlockedAt: a.ua,
        createdAt: a.c,
      })
      .onConflictDoNothing();
  }
});

/** Sérialise l'état courant de l'utilisateur dans le cookie signé (à appeler après une mutation). */
export async function persistToCookie(userId: string): Promise<void> {
  if (!isEphemeralDatabase()) return;
  const db = await getDb();
  const user = (await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1))[0];
  if (!user) return;
  const sub = (
    await db.select().from(schema.subscriptions).where(eq(schema.subscriptions.userId, userId)).orderBy(desc(schema.subscriptions.updatedAt)).limit(1)
  )[0];
  const analyses = await db
    .select()
    .from(schema.analyses)
    .where(eq(schema.analyses.userId, userId))
    .orderBy(desc(schema.analyses.createdAt))
    .limit(MAX_ANALYSES);

  const snapshot: Snapshot = {
    v: 1,
    u: { id: user.id, e: user.email, h: user.passwordHash, t: user.termsAcceptedAt, c: user.createdAt, a: user.priorityAlerts ? 1 : 0 },
    s: sub
      ? {
          id: sub.id,
          p: sub.plan,
          st: sub.status,
          pr: sub.provider,
          ps: sub.currentPeriodStart,
          pe: sub.currentPeriodEnd,
          ca: sub.cancelAtPeriodEnd ? 1 : 0,
          c: sub.createdAt,
        }
      : null,
    a: analyses.map((a) => ({ id: a.id, m: a.matchId, c: a.createdAt, u: a.unlocked ? 1 : 0, ua: a.unlockedAt })),
  };
  const store = await cookies();
  store.set(STATE_COOKIE, await signJson(snapshot), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.VERCEL !== undefined,
    path: "/",
    maxAge: 30 * 24 * 3600,
  });
}

export async function clearCookieState(): Promise<void> {
  const store = await cookies();
  if (store.has(STATE_COOKIE)) store.delete(STATE_COOKIE);
}
