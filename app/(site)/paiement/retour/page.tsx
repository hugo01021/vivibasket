import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageShell, PageTitle } from "~/components/layout/PageShell";
import { Button } from "~/components/ui/Button";
import { unlockAnalysis } from "~/server/analyses/service";
import { requireUser } from "~/server/auth/dal";
import { getStripe, isStripeConfigured, syncSubscriptionFromStripe } from "~/server/billing/stripe";

export const metadata: Metadata = { title: "Retour de paiement", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Search = { session_id?: string; analyse?: string };

export default async function PaymentReturnPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { session_id: sessionId, analyse } = await searchParams;
  const user = await requireUser("/paiement/retour");
  if (!isStripeConfigured() || !sessionId) redirect("/offres");

  let outcome: "ok" | "pending" | "error" = "error";
  let detail = "";
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
    const owner = session.client_reference_id ?? session.metadata?.userId;
    if (owner && owner !== user.id) {
      detail = "Cette session de paiement appartient à un autre compte.";
    } else if (session.status === "complete" && session.subscription && typeof session.subscription !== "string") {
      await syncSubscriptionFromStripe(session.subscription, user.id);
      outcome = "ok";
    } else if (session.status === "open") {
      outcome = "pending";
    } else {
      detail = "La session de paiement a expiré.";
    }
  } catch (error) {
    console.error("[stripe] retour de paiement", error);
    detail = "Impossible de vérifier le paiement pour le moment.";
  }

  if (outcome === "ok") {
    if (analyse) {
      await unlockAnalysis(user.id, analyse);
      redirect(`/analyse/${analyse}?paiement=ok`);
    }
    redirect("/compte?paiement=ok");
  }

  return (
    <PageShell narrow>
      <PageTitle
        title={outcome === "pending" ? "Paiement en attente" : "Paiement non confirmé"}
        lead={outcome === "pending" ? "Votre paiement n'a pas encore été finalisé. Vous pouvez reprendre là où vous en étiez." : detail}
      />
      <div className="flex flex-col gap-3">
        <Button href={analyse ? `/offres?analyse=${encodeURIComponent(analyse)}` : "/offres"} size="lg">
          Retour aux offres
        </Button>
        <Button href="/compte" variant="secondary" size="lg">
          Mon compte
        </Button>
      </div>
    </PageShell>
  );
}
