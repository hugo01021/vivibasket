import Link from "next/link";
import { SITE } from "~/lib/site";
import { cn } from "~/lib/utils";

/**
 * Marque DunkOne : un ballon qui rebondit, sa trajectoire en pointillés et le
 * point d'impact. Dessin original, une seule couleur d'accent.
 */
export function BrandMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" className={className}>
      {/* sol */}
      <path d="M3 27.5h26" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.6" strokeLinecap="round" />
      {/* trajectoire du rebond */}
      <path
        d="M6 27c3-9 7-13 10-13.2 3.3-.2 6.6 3.4 9.5 10.6"
        stroke="var(--color-accent)"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeDasharray="2.2 3.2"
        fill="none"
      />
      {/* ballon */}
      <circle cx="21.5" cy="10" r="7" fill="var(--color-accent)" />
      <path
        d="M14.6 9.2c4.2.6 7.5 2.1 10.3 4.9M18.6 3.9c-1.2 3.9-.7 8.1 1.9 12.6M21.5 3v14"
        stroke="var(--color-accent-ink)"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
        opacity="0.75"
      />
      {/* impact */}
      <circle cx="6" cy="27.5" r="1.6" fill="var(--color-accent)" />
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
