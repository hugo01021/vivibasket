import Link from "next/link";
import { useId } from "react";
import { SITE } from "~/lib/site";
import { cn } from "~/lib/utils";

/**
 * Marque DunkOne : un ballon de basket qui rebondit, avec sa traînée de
 * mouvement effilée vers le point d'impact. Dessin original, une seule
 * couleur d'accent.
 */
export function BrandMark({ className, size = 32 }: { className?: string; size?: number }) {
  const clip = useId();
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" className={className}>
      <defs>
        <clipPath id={clip}>
          <circle cx="21" cy="11" r="8.6" />
        </clipPath>
      </defs>
      {/* traînée de mouvement */}
      <path d="M13.6 15.2 C 9.6 17.4, 6.2 21.8, 3.6 27.6 C 7.4 23.4, 12 20.6, 18.4 19 Z" fill="var(--color-accent)" opacity="0.92" />
      <path d="M12.2 18.8 C 9.6 20.4, 7.4 22.9, 5.8 25.7 C 8.4 23.6, 11 22.2, 14.2 21.3 Z" fill="var(--color-accent)" opacity="0.45" />
      {/* impact */}
      <path d="M2.6 28.6h5.6" stroke="currentColor" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
      {/* ballon */}
      <circle cx="21" cy="11" r="8.6" fill="var(--color-accent)" />
      <g clipPath={`url(#${clip})`} fill="none" stroke="var(--color-accent-ink)" strokeWidth="1.55" strokeLinecap="round">
        <path d="M21 1.5v19" />
        <path d="M11.5 11h19" />
        <path d="M14.6 3.8 Q 20.1 11 14.6 18.2" />
        <path d="M27.4 3.8 Q 21.9 11 27.4 18.2" />
      </g>
      <path d="M15.9 6.9 Q 17.8 4.8 20.2 4.2" stroke="#ffc08a" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.85" clipPath={`url(#${clip})`} />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-[21px] font-extrabold tracking-tight text-fg", className)}>
      Dunk<span className="text-accent">One</span>
    </span>
  );
}

export function Logo({ asLink = true, className, size = 30 }: { asLink?: boolean; className?: string; size?: number }) {
  const content = (
    <>
      <BrandMark size={size} className="text-fg" />
      <Wordmark />
    </>
  );
  if (!asLink) {
    return <span className={cn("inline-flex items-center gap-2.5", className)}>{content}</span>;
  }
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5", className)} aria-label={`${SITE.name} — accueil`}>
      {content}
    </Link>
  );
}
