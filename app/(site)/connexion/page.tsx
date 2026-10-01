import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "~/components/auth/LoginForm";
import { PageShell, PageTitle } from "~/components/layout/PageShell";
import { safeInternalPath } from "~/lib/utils";
import { getCurrentUser } from "~/server/auth/dal";

export const metadata: Metadata = {
  title: "Connexion ou inscription",
  description: "Accédez à Rebond avec votre e-mail et un mot de passe. Le compte est créé automatiquement à la première connexion.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const target = safeInternalPath(next, "/analyser");
  const user = await getCurrentUser();
  if (user) redirect(target);
  return (
    <PageShell narrow>
      <PageTitle
        eyebrow="Étape 2"
        title="Connexion ou inscription"
        lead="Un e-mail, un mot de passe, et c'est parti. Si le compte n'existe pas encore, il est créé à l'instant."
      />
      <LoginForm next={target} />
      <p className="mt-6 text-xs text-fg-subtle">Session mémorisée sur cet appareil pendant 30 jours. Vous pourrez vous déconnecter depuis votre compte.</p>
    </PageShell>
  );
}
