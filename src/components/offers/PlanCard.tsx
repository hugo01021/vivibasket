import { Badge } from "~/components/ui/Badge";
import { IconCheck } from "~/components/ui/icons";
import { SubmitButton } from "~/components/ui/SubmitButton";
import { PLAN_ORDER, type Plan, type PlanId } from "~/lib/plans";
import { cn, formatPrice } from "~/lib/utils";
import { startCheckout } from "~/server/actions/billing";

type Props = {
  plan: Plan;
  currentPlan: PlanId | null;
  analysisId: string | null;
  /** Offre conseillée dans le contexte (ex. : quota dépassé → Pro). */
  recommended?: boolean;
  /** Si défini, l'offre ne permet pas de débloquer l'analyse en cours (bouton désactivé). */
  unavailableReason?: string | null;
};

export function PlanCard({ plan, currentPlan, analysisId, recommended = false, unavailableReason = null }: Props) {
  const isCurrent = currentPlan === plan.id;
  const isUpgrade = currentPlan !== null && PLAN_ORDER.indexOf(plan.id) > PLAN_ORDER.indexOf(currentPlan);
  const isDowngrade = currentPlan !== null && PLAN_ORDER.indexOf(plan.id) < PLAN_ORDER.indexOf(currentPlan);
  const emphasized = plan.highlight || recommended;
  const label = isCurrent ? "Offre actuelle" : isUpgrade ? `Passer à ${plan.name}` : isDowngrade ? `Revenir à ${plan.name}` : `Choisir ${plan.name}`;

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-card border bg-surface p-5 shadow-card",
        emphasized ? "border-accent shadow-glow" : "border-border",
      )}
      aria-label={`Offre ${plan.name}`}
    >
      {emphasized ? (
        <Badge tone="accent" className="absolute -top-3 left-5">
          {recommended && !plan.highlight ? "Conseillée" : "Recommandée"}
        </Badge>
      ) : null}
      <h2 className="font-display text-2xl font-extrabold text-fg">{plan.name}</h2>
      <p className="mt-1 text-sm text-fg-muted">{plan.pitch}</p>
      <p className="mt-4 flex items-baseline gap-1">
        <span className="tabular font-display text-4xl font-extrabold text-fg">{formatPrice(plan.priceCents)}</span>
        <span className="text-sm text-fg-muted">/ mois</span>
      </p>
      <ul className="mt-5 flex-1 space-y-2.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-fg">
            <IconCheck size={18} className="mt-0.5 shrink-0 text-accent" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <form action={startCheckout} className="mt-6">
        <input type="hidden" name="plan" value={plan.id} />
        {analysisId ? <input type="hidden" name="analyse" value={analysisId} /> : null}
        <SubmitButton full size="lg" variant={emphasized ? "primary" : "secondary"} disabled={isCurrent || Boolean(unavailableReason)} pendingLabel="Ouverture du paiement…">
          {label}
        </SubmitButton>
      </form>
      <p className={cn("mt-3 text-center text-xs", unavailableReason ? "text-loss" : "text-fg-subtle")}>
        {unavailableReason ?? "Sans engagement · résiliable en ligne à tout moment"}
      </p>
    </article>
  );
}
