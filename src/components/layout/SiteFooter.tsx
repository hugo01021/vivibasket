import Link from "next/link";
import { Logo } from "~/components/brand/Logo";
import { ROUTES, SITE } from "~/lib/site";

const LEGAL_LINKS = [
  { href: ROUTES.legal.terms, label: "CGU" },
  { href: ROUTES.legal.sales, label: "CGV" },
  { href: ROUTES.legal.notice, label: "Mentions légales" },
  { href: ROUTES.legal.privacy, label: "Confidentialité" },
  { href: ROUTES.legal.cancel, label: "Résiliation en ligne" },
  { href: ROUTES.legal.responsible, label: "Jeu responsable" },
];

export function AgeBadge({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-fg text-[11px] font-extrabold tracking-tight ${className ?? ""}`}
      aria-label="Interdit aux moins de 18 ans"
    >
      18+
    </span>
  );
}

export function SiteFooter({ transparent = false }: { transparent?: boolean }) {
  return (
    <footer className={transparent ? "border-t border-border bg-bg/60 backdrop-blur-sm" : "border-t border-border bg-bg"}>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm space-y-3">
            <Logo />
            <p className="text-sm text-fg-muted">
              {SITE.name} est un outil d&apos;analyse statistique indépendant. Il ne propose aucun pari et n&apos;est affilié à aucune
              ligue ni aucun club cités.
            </p>
          </div>
          <nav aria-label="Informations légales">
            <ul className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-fg-muted hover:text-fg">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-card border border-border bg-surface p-4">
          <AgeBadge />
          <p className="text-xs leading-relaxed text-fg-muted">
            <strong className="text-fg">Réservé aux adultes.</strong> Nos analyses sont des estimations statistiques, jamais une garantie de
            résultat. Si vous pariez, fixez-vous des limites. Jouer comporte des risques : endettement, isolement, dépendance. Pour être aidé,
            appelez le <a href={`tel:${SITE.helplinePhone.replace(/\s/g, "")}`} className="font-semibold text-fg underline-offset-2 hover:underline">{SITE.helplinePhone}</a>{" "}
            (appel non surtaxé).
          </p>
        </div>

        <p className="mt-6 text-xs text-fg-subtle">
          © {new Date().getFullYear()} {SITE.name}. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
