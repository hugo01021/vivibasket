import Link from "next/link";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Logo texte : première partie en blanc cassé, seconde en orange. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${SITE.name} — accueil`}
      className={cn("font-display text-2xl font-extrabold uppercase leading-none tracking-tight", className)}
    >
      {SITE.logo[0]}
      <span className="text-accent">{SITE.logo[1]}</span>
    </Link>
  );
}
