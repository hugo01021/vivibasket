import "server-only";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb, newId, schema } from "~/server/db";
import { SESSION_COOKIE, SESSION_TTL_MS, sha256Hex, signSessionToken, verifySessionToken } from "./token";

export { SESSION_COOKIE };

/** Crée une session en base et pose le cookie signé. */
export async function createSession(userId: string): Promise<void> {
  const db = await getDb();
  const raw = crypto.randomUUID() + crypto.randomUUID();
  const sid = await sha256Hex(raw);
  const now = Date.now();
  const exp = now + SESSION_TTL_MS;
  await db.insert(schema.sessions).values({ id: sid, userId, expiresAt: exp, createdAt: now });
  const token = await signSessionToken({ sid, exp });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(exp),
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const payload = await verifySessionToken(token);
  if (payload) {
    const db = await getDb();
    await db.delete(schema.sessions).where(eq(schema.sessions.id, payload.sid));
  }
  store.delete(SESSION_COOKIE);
}

/** Utilisateur rattaché au cookie courant, ou null. */
export async function readSessionUser() {
  const store = await cookies();
  const payload = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  const db = await getDb();
  const rows = await db
    .select({ user: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.id, payload.sid), gt(schema.sessions.expiresAt, Date.now())))
    .limit(1);
  return rows[0]?.user ?? null;
}

export function userIdPrefix(): string {
  return newId("usr");
}
