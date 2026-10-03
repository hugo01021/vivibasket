import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, PageTitle } from "~/components/layout/PageShell";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Card, CardHeader } from "~/components/ui/Card";
import { IconBell, IconLogout } from "~/components/ui/icons";
import { SubmitButton } from "~/components/ui/SubmitButton";
import { LEAGUES } from "~/lib/basket/teams";
import { PLANS } from "~/lib/plans";
import { formatDateShort, formatDateTime, formatPrice } from "~/lib/utils";
import { listAnalysesForUser } from "~/server/analyses/service";
import { logout } from "~/server/actions/auth";
import { cancelSubscription, openBillingPortal, resumeSubscription, setPriorityAlerts } from "~/server/actions/billing";
import { requireUser } from "~/server/auth/dal";
import { getEntitlement, getLatestSubscription } from "~/server/billing/entitlements";
import { isStripeConfigured } from "~/server/billing/stripe";

export const metadata: Metadata = { title: "Mon compte", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Search = { paiement?: string; resiliation?: string; reprise?: string; alertes?: string; maj?: string };

const NOTICES: Record<string, string> = {
  paiement: "Paiement confirmé : votre abonnement est actif.",
  resiliation: "Résiliation prise en compte. Votre accès reste ouvert jusqu'à la fin de la période payée.",
  reprise: "Abonnement repris : le renouvellement automatique est rétabli.",
  alertes: "Préférence d'alertes enregistrée.",
  maj: "Votre offre a été mise à jour.",
};

export default async function AccountPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const user = await requireUser("/compte");
  const [entitlement, latest, history] = await Promise.all([getEntitlement(user.id), getLatestSubscription(user.id), listAnalysesForUser(user.id, 30)]);
  const sub = entitlement.subscription ?? latest;
  const plan = sub ? PLANS[sub.plan] : null;
  const notice = Object.keys(NOTICES).find((k) => sp[k as keyof Search] === "ok");
  const stripePortal = isStripeConfigured() && sub?.provider === "stripe";
  const visibleHistory = entitlement.plan?.access.history ? history : history.slice(0, 3);

  return (
    <PageShell>
      <PageTitle title="Mon compte" lead={user.email} />
      {notice ? (
        <p role="status" className="mb-5 rounded-xl border border-win/40 bg-win/10 p-3 text-sm text-fg">
          {NOTICES[notice]}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5">
          <CardHeader title="Mon abonnement" aside={entitlement.active && plan ? <Badge tone="accent">{plan.name}</Badge> : <Badge tone="muted">Aucun</Badge>} />
          {sub && plan ? (
            <div className="mt-4 space-y-3 text-sm">
              <p className="font-display text-2xl font-extrabold">
                {formatPrice(plan.priceCents)} <span className="text-base font-semibold text-fg-muted">/ mois</span>
              </p>
              <p className="text-fg-muted">
                Statut :{" "}
                <strong className="text-fg">
                  {!entitlement.active
                    ? "inactif"
                    : sub.cancelAtPeriodEnd
                      ? `résiliation programmée le ${formatDateShort(sub.currentPeriodEnd)}`
                      : sub.status === "past_due"
                        ? "en attente de paiement"
                        : `actif, renouvellement le ${formatDateShort(sub.currentPeriodEnd)}`}
                </strong>
                {sub.provider === "demo" ? " · démonstration" : ""}
              </p>
              {entitlement.quota !== null ? (
                <div>
                  <div className="flex justify-between text-xs text-fg-muted">
                    <span>Analyses ce mois-ci</span>
                    <span className="tabular">
                      {entitlement.used} / {entitlement.quota}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
                    <div className="h-full bg-accent" style={{ width: `${Math.min(100, (entitlement.used / entitlement.quota) * 100)}%` }} />
                  </div>
                </div>
              ) : (
                <p className="text-fg-muted">Analyses illimitées · {entitlement.used} réalisée{entitlement.used > 1 ? "s" : ""} sur la période.</p>
              )}
              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap">
                <Button href="/offres" variant="secondary" size="sm">
                  Changer d&apos;offre
                </Button>
                {stripePortal ? (
                  <form action={openBillingPortal}>
                    <SubmitButton variant="secondary" size="sm" pendingLabel="Ouverture…">
                      Factures et moyen de paiement
                    </SubmitButton>
                  </form>
                ) : null}
                {entitlement.active ? (
                  sub.cancelAtPeriodEnd ? (
                    <form action={resumeSubscription}>
                      <SubmitButton variant="outline" size="sm" pendingLabel="Reprise…">
                        Reprendre l&apos;abonnement
                      </SubmitButton>
                    </form>
                  ) : (
                    <form action={cancelSubscription}>
                      <SubmitButton variant="danger" size="sm" pendingLabel="Résiliation…">
                        Résilier mon abonnement
                      </SubmitButton>
                    </form>
                  )
                ) : null}
              </div>
              <p className="text-xs text-fg-subtle">
                La résiliation prend effet à la fin de la période payée, sans frais.{" "}
                <Link href="/resiliation" className="underline-offset-2 hover:underline">
                  Comment ça marche
                </Link>
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3 text-sm text-fg-muted">
              <p>Vous n&apos;avez pas encore d&apos;abonnement. Les analyses lancées restent en attente jusqu&apos;au choix d&apos;une offre.</p>
              <Button href="/offres" size="sm">
                Voir les offres
              </Button>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          {entitlement.plan?.access.priorityAlerts ? (
            <Card className="p-5">
              <CardHeader title="Alertes prioritaires" subtitle="Soyez prévenu en premier quand une value apparaît ou qu'un match bascule." />
              <form action={setPriorityAlerts} className="mt-4 flex items-center justify-between gap-3">
                <label className="flex items-center gap-3 text-sm">
                  <input type="checkbox" name="enabled" defaultChecked={user.priorityAlerts} className="h-5 w-5 rounded accent-[var(--color-accent)]" />
                  <span className="inline-flex items-center gap-1.5">
                    <IconBell size={16} /> Activer les alertes
                  </span>
                </label>
                <SubmitButton size="sm" variant="secondary" pendingLabel="Enregistrement…">
                  Enregistrer
                </SubmitButton>
              </form>
            </Card>
          ) : null}

          <Card className="p-5">
            <CardHeader title="Session" />
            <form action={logout} className="mt-4">
              <SubmitButton variant="outline" size="sm" pendingLabel="Déconnexion…">
                <IconLogout size={16} /> Se déconnecter
              </SubmitButton>
            </form>
          </Card>
        </div>
      </div>

      <Card className="mt-4 p-5">
        <CardHeader
          title="Mes analyses"
          subtitle={entitlement.plan?.access.history ? "Historique complet." : "Les trois dernières. L'historique complet est inclus dans Pro et Elite."}
        />
        {visibleHistory.length === 0 ? (
          <p className="mt-4 text-sm text-fg-muted">Aucune analyse pour le moment.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {visibleHistory.map((a) => (
              <li key={a.id}>
                <Link href={`/analyse/${a.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-accent">
                  <span>
                    <span className="block font-semibold">
                      {a.homeTeam} <span className="text-fg-subtle">vs</span> {a.awayTeam}
                    </span>
                    <span className="block text-xs text-fg-muted">
                      {LEAGUES[a.league].name} · {formatDateTime(a.createdAt)}
                    </span>
                  </span>
                  <Badge tone={a.unlocked ? "win" : "muted"}>{a.unlocked ? "Débloquée" : "Verrouillée"}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </PageShell>
  );
}
