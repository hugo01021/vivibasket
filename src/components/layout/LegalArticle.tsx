import type { ReactNode } from "react";
import { PageShell, PageTitle } from "./PageShell";

/** Mise en page commune aux pages légales (CGU, CGV, mentions, confidentialité…). */
export function LegalArticle({ title, updated, lead, children }: { title: string; updated: string; lead?: string; children: ReactNode }) {
  return (
    <PageShell className="max-w-3xl">
      <PageTitle eyebrow={`Dernière mise à jour : ${updated}`} title={title} lead={lead} />
      <article
        className={[
          "space-y-4 text-[15px] leading-relaxed text-fg-muted",
          "[&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-fg",
          "[&_h3]:mt-5 [&_h3]:font-display [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-fg",
          "[&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5",
          "[&_strong]:text-fg [&_a]:font-semibold [&_a]:text-fg [&_a]:underline-offset-2 hover:[&_a]:underline",
          "[&_mark]:rounded [&_mark]:bg-accent-soft [&_mark]:px-1 [&_mark]:text-accent",
        ].join(" ")}
      >
        {children}
      </article>
    </PageShell>
  );
}
