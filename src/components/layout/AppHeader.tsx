import Link from "next/link";
import { Logo } from "~/components/brand/Logo";
import { IconUser } from "~/components/ui/icons";
import { getCurrentUser } from "~/server/auth/dal";

/** En-tête : logo + icône compte (navigation secondaire sur grand écran). */
export async function AppHeader() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Navigation" className="flex items-center gap-1">
          <Link href="/matchs" className="hidden rounded-full px-3 py-1.5 text-sm font-semibold text-fg-muted hover:bg-surface-2 hover:text-fg sm:inline-flex">
            Matchs du jour
          </Link>
          <Link href="/offres" className="hidden rounded-full px-3 py-1.5 text-sm font-semibold text-fg-muted hover:bg-surface-2 hover:text-fg sm:inline-flex">
            Offres
          </Link>
          <Link
            href={user ? "/compte" : "/connexion"}
            aria-label={user ? "Mon compte" : "Se connecter"}
            className="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-fg-muted hover:border-accent hover:text-accent"
          >
            <IconUser size={20} />
            {user ? <span className="sr-only">{user.email}</span> : null}
          </Link>
        </nav>
      </div>
    </header>
  );
}
