import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell, PageTitle } from "~/components/layout/PageShell";
import { Badge } from "~/components/ui/Badge";
import { IconShield } from "~/components/ui/icons";
import { SubmitButton } from "~/components/ui/SubmitButton";
import { PLANS, isPlanId } from "~/lib/plans";
import { formatPrice } from "~/lib/utils";
import { confirmDemoPayment } from "~/server/actions/billing";
import { requireUser } from "~/server/auth/dal";
import { isStripeConfigured } from "~/server/billing/stripe";

export const metadata: Metadata = { title: "Paiement (démonstration)", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Search = { plan?: string; analyse?: string };

const FIELD = "h-12 w-full rounded-xl border border-border bg-surface-2 px-4 text-base text-fg-muted";

export default async function DemoPaymentPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { plan, analyse } = await searchParams;
  if (isStripeConfigured() || !isPlanId(plan)) redirect("/offres");
  const user = await requireUser(`/paiement/demo?plan=${plan}${analyse ? `&analyse=${encodeURIComponent(analyse)}` : ""}`);
  const def = PLANS[plan];

  return (
    <PageShell narrow>
      <PageTitle eyebrow="Étape 7" title="Paiement" lead="Abonnement mensuel, renouvelé automatiquement, résiliable en ligne à tout moment." />

      <div className="mb-5 rounded-card border border-info/40 bg-info/10 p-4 text-sm text-fg">
        <Badge tone="info">Mode démonstration</Badge>
        <p className="mt-2 text-fg-muted">
          Stripe n&apos;est pas configuré sur cet environnement : le paiement est simulé et aucun montant n&apos;est débité. En production, cette
          étape est prise en charge par Stripe Checkout.
        </p>
      </div>

      <div className="rounded-card border border-border bg-surface p-5 shadow-card">
        <div className="flex items-baseline justify-between">
          <p className="font-display text-xl font-extrabold">Rebond {def.name}</p>
          <p className="tabular font-display text-xl font-extrabold">
            {formatPrice(def.priceCents)} <span className="text-sm font-semibold text-fg-muted">/ mois</span>
          </p>
        </div>
        <p className="mt-1 text-sm text-fg-muted">{def.pitch}</p>

        <form action={confirmDemoPayment} className="mt-5 space-y-4">
          <input type="hidden" name="plan" value={plan} />
          {analyse ? <input type="hidden" name="analyse" value={analyse} /> : null}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold" htmlFor="demo-email">
              E-mail
            </label>
            <input id="demo-email" className={FIELD} value={user.email} readOnly />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold" htmlFor="demo-card">
              Carte bancaire (fictive)
            </label>
            <input id="demo-card" className={`${FIELD} tabular`} value="4242 4242 4242 4242" readOnly />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input aria-label="Expiration" className={`${FIELD} tabular`} value="12 / 34" readOnly />
            <input aria-label="Cryptogramme" className={`${FIELD} tabular`} value="123" readOnly />
          </div>
          <SubmitButton full size="lg" pendingLabel="Validation…">
            Payer {formatPrice(def.priceCents)} / mois (simulation)
          </SubmitButton>
        </form>
        <p className="mt-3 flex items-center gap-2 text-xs text-fg-subtle">
          <IconShield size={14} /> En validant, vous acceptez les{" "}
          <Link href="/cgv" className="underline-offset-2 hover:underline">
            CGV
          </Link>{" "}
          et confirmez avoir 18 ans ou plus.
        </p>
      </div>
      <p className="mt-4 text-center text-sm">
        <Link href={analyse ? `/offres?analyse=${encodeURIComponent(analyse)}` : "/offres"} className="text-fg-muted hover:text-fg">
          Annuler et revenir aux offres
        </Link>
      </p>
    </PageShell>
  );
}
