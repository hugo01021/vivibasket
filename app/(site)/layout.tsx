import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

/** Layout des pages de l'application (matchs, compétitions, équipes…). L'accueil a le sien. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-20 sm:px-6 sm:pt-24">
        {children}
      </main>
      <Footer />
    </>
  );
}
