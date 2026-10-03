import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { readSessionUser } from "./session";
import type { User } from "~/server/db/schema";

/** Utilisateur courant (mémorisé pour la durée de la requête). */
export const getCurrentUser = cache(async (): Promise<User | null> => readSessionUser());

/**
 * Exige un utilisateur connecté. Si le cookie existe mais que la session est
 * invalide, on passe par une route qui supprime le cookie avant de rediriger,
 * sinon le proxy renverrait l'utilisateur en boucle vers la page protégée.
 */
export async function requireUser(nextPath: string): Promise<User> {
  const user = await getCurrentUser();
  if (user) return user;
  redirect(`/api/auth/sortie?next=${encodeURIComponent(nextPath)}`);
}

export type PublicUser = { id: string; email: string };

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email };
}
