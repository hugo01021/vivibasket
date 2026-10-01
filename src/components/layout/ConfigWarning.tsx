import { isEphemeralDatabase } from "~/server/db";

/** Bandeau visible quand l'hébergement n'a pas de base de données persistante. */
export function ConfigWarning() {
  if (!isEphemeralDatabase()) return null;
  return (
    <div role="alert" className="border-b border-loss/40 bg-loss/15 px-4 py-2 text-center text-xs text-fg">
      <strong>Base de données non configurée.</strong> Sur cet hébergement, comptes, sessions et analyses ne survivent pas d&apos;une requête à
      l&apos;autre. Définissez <code>DATABASE_URL</code> (et <code>DATABASE_AUTH_TOKEN</code>) vers une base libSQL, par exemple Turso.
    </div>
  );
}
