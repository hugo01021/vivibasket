"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

interface NavItem {
  href: string;
  label: string;
  /** Libellé plus court sur mobile, si différent. */
  short?: string;
  /** Masqué sur mobile (hors menu). */
  desktopOnly?: boolean;
}

/** Accueil : deux ancres et la connexion, rien de plus. */
const HOME_NAV: NavItem[] = [
  { href: "/#matchs", label: "Matchs du jour", short: "Matchs" },
  { href: "/#analyser", label: "Analyser", desktopOnly: true },
];

/** Reste du site : navigation complète, repliée dans un menu sur mobile. */
const SITE_NAV: NavItem[] = [
  { href: "/matchs", label: "Matchs" },
  { href: "/competitions", label: "Compétitions" },
  { href: "/equipes", label: "Équipes" },
  { href: "/joueurs", label: "Joueurs" },
  { href: "/analyses", label: "Analyses" },
  { href: "/favoris", label: "Favoris" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/matchs") return pathname === "/matchs" || pathname.startsWith("/match/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Header fin et discret : logo texte à gauche, liens à droite.
 * Fond transparent en haut de page, noir (avec un filet) dès qu'on défile.
 */
export function Header({ variant = "site" }: { variant?: "home" | "site" }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  // Le menu est « ouvert pour un chemin donné » : toute navigation le referme sans effet.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenAt(null);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const home = variant === "home";
  const items = home ? HOME_NAV : SITE_NAV;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 border-b transition-colors duration-200",
          scrolled || open ? "border-border bg-bg" : "border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />

          <nav aria-label="Navigation principale" className="flex items-center gap-5 text-sm sm:gap-6">
            {items.map((item) => {
              const active = !home && isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "transition-colors hover:text-fg",
                    active ? "text-fg" : "text-fg-muted",
                    home ? (item.desktopOnly ? "hidden sm:inline" : "") : "hidden lg:inline",
                  )}
                >
                  {item.short ? (
                    <>
                      <span className="sm:hidden">{item.short}</span>
                      <span className="hidden sm:inline">{item.label}</span>
                    </>
                  ) : (
                    item.label
                  )}
                </Link>
              );
            })}

            {!home && (
              <Link
                href="/recherche"
                aria-label="Rechercher"
                className="hidden text-fg-muted transition-colors hover:text-fg lg:inline-flex"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="9" cy="9" r="6" />
                  <path d="m14 14 4 4" strokeLinecap="round" />
                </svg>
              </Link>
            )}

            <a href="#" className="rounded-[4px] border border-border px-3 py-1.5 text-fg transition-colors hover:border-border-strong">
              Connexion
            </a>

            {!home && (
              <button
                type="button"
                onClick={() => setOpenAt(open ? null : pathname)}
                aria-expanded={open}
                aria-controls="menu-mobile"
                aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
                className="-mr-1 flex h-8 w-8 items-center justify-center text-fg-muted hover:text-fg lg:hidden"
              >
                <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  {open ? <path d="m5 5 10 10M15 5 5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
                </svg>
              </button>
            )}
          </nav>
        </div>
      </header>

      {!home && (
        // Menu mobile : frère du header pour rester au-dessus du contenu, sous la barre
        <div id="menu-mobile" hidden={!open} className="fixed inset-x-0 bottom-0 top-14 z-30 overflow-y-auto bg-bg lg:hidden">
          <nav aria-label="Navigation mobile" className="px-4 py-2 sm:px-6">
            <ul className="divide-y divide-border">
              {[...items, { href: "/recherche", label: "Recherche" }].map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn("block py-3.5 font-display text-2xl font-bold uppercase leading-none", active ? "text-accent" : "text-fg")}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
