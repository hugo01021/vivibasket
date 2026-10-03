import Link from "next/link";
import { BrandMark } from "~/components/brand/Logo";
import { Badge } from "~/components/ui/Badge";
import { buttonClasses } from "~/components/ui/Button";
import { IconLock } from "~/components/ui/icons";

type Props = {
  analysisId: string;
  home: string;
  away: string;
  leagueName: string;
  phase: string;
};

/**
 * Étape 5 : seuls les noms des équipes sont lisibles. Le reste est un gabarit
 * flouté (aucune donnée réelle n'est transmise au navigateur) et l'unique action
 * possible est le bouton de déblocage.
 */
export function LockedResult({ analysisId, home, away, leagueName, phase }: Props) {
  return (
    <div className="relative min-h-dvh bg-bg">
      <header className="flex h-14 items-center justify-center border-b border-border">
        <span className="inline-flex items-center gap-2.5" aria-label="DunkOne">
          <BrandMark size={28} className="text-fg" />
          <span className="font-display text-lg font-extrabold">
            Dunk<span className="text-accent">One</span>
          </span>
        </span>
      </header>

      <main id="contenu" className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 sm:px-6">
        <div className="flex items-center gap-2">
          <Badge tone="accent">{leagueName}</Badge>
          <span className="text-xs text-fg-muted">{phase}</span>
        </div>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-fg sm:text-4xl">
          {home} <span className="text-fg-subtle">vs</span> {away}
        </h1>

        {/* Cadenas + action unique, visibles sans défiler */}
        <div className="mt-5 rounded-card border border-border-strong bg-surface p-6 text-center shadow-card">
          <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-ink shadow-glow">
            <IconLock size={30} />
          </span>
          <h2 className="mt-4 font-display text-2xl font-extrabold text-fg">Analyse prête</h2>
          <p className="mt-2 text-sm text-fg-muted">
            Les probabilités, le score projeté, les huit facteurs et le résumé sont masqués. Choisissez une offre pour les afficher.
          </p>
          <Link href={`/offres?analyse=${encodeURIComponent(analysisId)}`} className={buttonClasses({ size: "lg", full: true, className: "mt-5" })}>
            Débloquer l&apos;analyse
          </Link>
        </div>

        {/* Gabarit flouté et inerte (aucune donnée réelle) */}
        <div className="locked-blur mt-6 space-y-4" aria-hidden="true">
          <div className="rounded-card border border-border bg-surface p-5">
            <div className="flex justify-between font-display text-4xl font-extrabold">
              <span>5█ %</span>
              <span>4█ %</span>
            </div>
            <div className="mt-3 h-3 rounded-full bg-surface-3">
              <div className="h-3 w-[58%] rounded-full bg-accent" />
            </div>
            <p className="mt-3 text-sm text-fg-muted">Indice de confiance ██ · score projeté ███ – ███</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Forme récente", "Domicile / extérieur", "Confrontations", "Attaque", "Défense", "Rythme", "Fatigue", "Blessures"].map((label) => (
              <div key={label} className="rounded-card border border-border bg-surface p-4">
                <div className="flex justify-between text-sm font-semibold">
                  <span>{label}</span>
                  <span>█████</span>
                </div>
                <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full w-[55%] bg-accent" />
                </div>
                <p className="mt-2 text-xs text-fg-muted">████████████ ████ ███ ████████</p>
              </div>
            ))}
          </div>
          <div className="rounded-card border border-border bg-surface p-5">
            <p className="text-sm font-semibold">Résumé rédigé par l&apos;IA</p>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              ████ ██████ ████████ ██ ███████ ███ ████ ████████ ████████ ███ ██ ████████ ████████. ██████ ███ ██████ ████ ███ ███████ ██████
              ████████ ██ ████ ███████ ████ ██████.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
