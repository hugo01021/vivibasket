import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, PageTitle } from "~/components/layout/PageShell";
import { MatchList } from "~/components/match/MatchList";
import { SearchForm } from "~/components/match/SearchForm";
import { Badge } from "~/components/ui/Badge";
import { IconArrowRight } from "~/components/ui/icons";
import { SubmitButton } from "~/components/ui/SubmitButton";
import { basketApi } from "~/lib/basket/api";
import { LEAGUES } from "~/lib/basket/teams";
import { analyzeFixtureAction } from "~/server/actions/analyses";
import { requireUser } from "~/server/auth/dal";
import { getEntitlement } from "~/server/billing/entitlements";

export const metadata: Metadata = {
  title: "Choisir un match",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Search = { q?: string; match?: string; erreur?: string };

export default async function ChooseMatchPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { q, match, erreur } = await searchParams;
  const user = await requireUser("/analyser");
  const now = new Date();
  const [fixtures, entitlement] = await Promise.all([basketApi.getTodayFixtures(now), getEntitlement(user.id)]);
  const selected = match ? await basketApi.getFixture(match, now) : undefined;

  return (
    <PageShell>
      <PageTitle
        eyebrow="Étape 3"
        title="Choisissez un match"
        lead="Tapez une affiche librement ou touchez « analyser » sur un match du jour."
      />

      {entitlement.plan ? (
        <p className="mb-5 flex flex-wrap items-center gap-2 text-sm text-fg-muted">
          <Badge tone="accent">Offre {entitlement.plan.name}</Badge>
          {entitlement.quota !== null ? (
            <span className="tabular">
              {entitlement.remaining} analyse{entitlement.remaining === 1 ? "" : "s"} restante{entitlement.remaining === 1 ? "" : "s"} ce mois-ci
            </span>
          ) : (
            <span>Analyses illimitées</span>
          )}
        </p>
      ) : null}

      {erreur === "match-introuvable" ? (
        <p role="alert" className="mb-5 rounded-xl border border-loss/40 bg-loss/10 p-3 text-sm">
          Ce match n&apos;est plus disponible. Choisissez-en un autre ci-dessous.
        </p>
      ) : null}

      <section className="rounded-card border border-border bg-surface p-5 shadow-card" aria-labelledby="recherche-titre">
        <h2 id="recherche-titre" className="sr-only">
          Recherche libre
        </h2>
        <SearchForm initialQuery={q ?? ""} />
      </section>

      {selected ? (
        <section className="mt-5 rounded-card border border-accent bg-accent-soft/40 p-5 shadow-glow" aria-labelledby="selection-titre">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Match sélectionné</p>
          <h2 id="selection-titre" className="mt-1 font-display text-xl font-extrabold">
            {selected.home.name} <span className="text-fg-subtle">vs</span> {selected.away.name}
          </h2>
          <p className="mt-1 text-sm text-fg-muted">
            {LEAGUES[selected.league].name} · {selected.phase} · {selected.venue}
          </p>
          <form action={analyzeFixtureAction} className="mt-4">
            <input type="hidden" name="matchId" value={selected.id} />
            <SubmitButton size="lg" pendingLabel="Préparation…">
              Lancer l&apos;analyse
              <IconArrowRight size={18} />
            </SubmitButton>
          </form>
        </section>
      ) : null}

      <section className="mt-8" aria-labelledby="jour-titre">
        <div className="mb-4 flex items-end justify-between">
          <h2 id="jour-titre" className="font-display text-2xl font-extrabold">
            Matchs du jour
          </h2>
          <Link href="/matchs" className="text-sm font-semibold text-fg-muted hover:text-fg">
            Vue publique
          </Link>
        </div>
        <MatchList fixtures={fixtures} highlightId={selected?.id ?? null} />
      </section>
    </PageShell>
  );
}
