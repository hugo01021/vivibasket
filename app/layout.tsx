import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Basket Analytics — résultats, direct et analyses",
    template: "%s · Basket Analytics",
  },
  description:
    "Scores en direct, résultats et analyses avancées de basket : NBA, EuroLeague, EuroCup, Liga ACB, Betclic Élite, FIBA.",
};

export const viewport: Viewport = {
  themeColor: "#0b0b0d",
  width: "device-width",
  initialScale: 1,
};

/** Les données (direct, calendrier) évoluent en continu : rendu à la demande. */
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${manrope.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-bg text-fg">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-ink"
        >
          Aller au contenu
        </a>
        <Header />
        <main id="contenu" className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-4 sm:px-6 lg:px-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
