import Link from "next/link";
import { cn } from "@/lib/utils";

/** Pictogramme original : ballon stylisé (cercle + coutures) en orange. */
export function BallGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("h-7 w-7", className)}>
      <circle cx="16" cy="16" r="14" fill="var(--color-accent)" />
      <path
        d="M2.5 16h27M16 2.5v27M6.3 6.3c5.4 5.4 5.4 14 0 19.4M25.7 6.3c-5.4 5.4-5.4 14 0 19.4"
        stroke="var(--color-bg)"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)} aria-label="Basket Analytics — accueil">
      <BallGlyph />
      <span className="text-[17px] font-extrabold tracking-tight">
        Basket<span className="text-accent">Analytics</span>
      </span>
    </Link>
  );
}
