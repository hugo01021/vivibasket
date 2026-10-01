import type { ReactNode } from "react";
import { AppHeader } from "~/components/layout/AppHeader";
import { SiteFooter } from "~/components/layout/SiteFooter";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main id="contenu" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
