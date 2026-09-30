import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Manrope } from "next/font/google";
import type { ReactNode } from "react";
import { SITE } from "@/lib/site";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

/** Police des titres : condensée et grasse, registre « maillot / tableau de score ». */
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} — analyse de matchs de basket`,
    template: `%s · ${SITE.name}`,
  },
  description:
    "Probabilités, forme, confrontations directes et statistiques pour analyser les matchs de NBA, EuroLeague et Betclic Élite.",
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
  width: "device-width",
  initialScale: 1,
};

/** Les données (direct, calendrier) évoluent en continu : rendu à la demande. */
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${manrope.variable} ${barlowCondensed.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-bg text-fg">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-ink"
        >
          Aller au contenu
        </a>
        {/* Grain très léger sur tout le site (voir .grain dans globals.css) */}
        <div className="grain" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
