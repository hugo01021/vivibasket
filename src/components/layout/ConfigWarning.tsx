import { isEphemeralDatabase } from "~/server/db";

/** Bandeau visible quand l'hébergement n'a pas de base de données persistante (aperçu). */
export function ConfigWarning() {
  if (!isEphemeralDatabase()) return null;
  return (
    <div role="status" className="border-b border-info/40 bg-info/10 px-4 py-2 text-center text-xs text-fg-muted">
      <strong className="text-fg">Aperçu sans base de données.</strong> Vos données (compte, abonnement de démonstration, analyses) sont conservées dans ce
      navigateur uniquement. Pour la production, définissez <code>DATABASE_URL</code> ou installez l&apos;intégration Turso sur Vercel.
    </div>
  );
}
