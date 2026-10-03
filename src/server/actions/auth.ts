"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { safeInternalPath } from "~/lib/utils";
import { hashPassword, verifyPassword } from "~/server/auth/password";
import { createSession, destroySession } from "~/server/auth/session";
import { getDb, newId, schema } from "~/server/db";

export type AuthState = {
  error?: string;
  fieldErrors?: Partial<Record<"email" | "password" | "terms", string>>;
  email?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* Limitation d'essais très simple, en mémoire (par e-mail et adresse IP). */
const attempts = new Map<string, { count: number; until: number }>();
function tooManyAttempts(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.until < now) return false;
  return entry.count >= 8;
}
function recordAttempt(key: string): void {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.until < now) attempts.set(key, { count: 1, until: now + 10 * 60_000 });
  else entry.count += 1;
}

/** Connexion ou inscription en un seul geste : si l'e-mail est inconnu, le compte est créé. */
export async function continueWithEmail(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const terms = formData.get("terms") === "on";
  const next = safeInternalPath(String(formData.get("next") ?? ""), "/analyser");

  const fieldErrors: AuthState["fieldErrors"] = {};
  if (!EMAIL_RE.test(email)) fieldErrors.email = "Saisissez une adresse e-mail valide.";
  if (password.length < 8) fieldErrors.password = "8 caractères minimum.";
  if (!terms) fieldErrors.terms = "Vous devez accepter les CGU pour continuer.";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, email };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `${email}|${ip}`;
  if (tooManyAttempts(key)) {
    return { error: "Trop de tentatives. Réessayez dans quelques minutes.", email };
  }

  const db = await getDb();
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  let userId: string;
  if (existing[0]) {
    const ok = await verifyPassword(password, existing[0].passwordHash);
    if (!ok) {
      recordAttempt(key);
      return { error: "Mot de passe incorrect pour ce compte.", email };
    }
    userId = existing[0].id;
  } else {
    userId = newId("usr");
    await db.insert(schema.users).values({
      id: userId,
      email,
      passwordHash: await hashPassword(password),
      termsAcceptedAt: Date.now(),
      createdAt: Date.now(),
    });
  }
  await createSession(userId);
  redirect(next);
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}
