import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "~/components/auth/LoginForm";
import { PageShell, PageTitle } from "~/components/layout/PageShell";
import { Prewarm } from "~/components/pwa/Prewarm";

export const metadata: Metadata = {
  title: "Connexion ou inscription",
  description: "Accédez à Rebond avec votre e-mail et un mot de passe. Le compte est créé automatiquement à la première connexion.",
  robots: { index: false, follow: false },
};

/**
 * Page statique (servie par le CDN) : le proxy renvoie déjà les utilisateurs
 * connectés vers leur destination, et le paramètre `next` est lu côté client.
 */
export default function LoginPage() {
  return (
    <PageShell narrow>
      <Prewarm />
      <PageTitle
        eyebrow="Étape 2"
        title="Connexion ou inscription"
        lead="Un e-mail, un mot de passe, et c'est parti. Si le compte n'existe pas encore, il est créé à l'instant."
      />
      <Suspense fallback={<div className="h-80 animate-pulse rounded-card bg-surface" aria-hidden="true" />}>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-xs text-fg-subtle">Session mémorisée sur cet appareil pendant 30 jours. Vous pourrez vous déconnecter depuis votre compte.</p>
    </PageShell>
  );
}
