import type { Metadata } from "next";
import Link from "next/link";
import { formatNumber, formatSigned } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FormIndicator } from "@/components/team/FormIndicator";
import { TeamBadge } from "@/components/team/TeamBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatCard } from "@/components/ui/StatCard";
import { AnalysisPageHeader, StreakChip } from "../_components/AnalysisPageHeader";
import { CompetitionChips } from "@/components/competition/CompetitionChips";
import { analysisHref, loadCompetitionTeamStats } from "../_lib/data";

export const metadata: Metadata = {
  title: "Forme des équipes",
  description: "Classement des équipes selon leur forme récente : 5 derniers matchs, série en cours et net rating.",
};

type SearchParams = Promise<{ competition?: string | string[] }>;

/** Couleur de la barre selon l'indice de forme /10. */
function formTone(score: number): { bar: string; text: string } {
  if (score >= 7) return { bar: "bg-win", text: "text-win" };
  if (score >= 4) return { bar: "bg-accent", text: "text-accent" };
  return { bar: "bg-loss", text: "text-loss" };
}

export default async function FormPage({ searchParams }: { searchParams: SearchParams }) {
  const { competition: raw } = await searchParams;
  const slug = Array.isArray(raw) ? raw[0] : raw;
  const { competition, stats, teams, options } = await loadCompetitionTeamStats(slug);
  const ranked = [...stats].sort((a, b) => b.formScore - a.formScore || b.netRating - a.netRating);
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  const longestWin = [...stats].filter((s) => s.streak.type === "W").sort((a, b) => b.streak.count - a.streak.count)[0];
  const teamName = (id: string) => teams.get(id)?.name ?? id;

  return (
    <div className="space-y-6">
      <AnalysisPageHeader title="Forme des équipes">
        Classement par indice de forme /10 : résultats des 5 derniers matchs pondérés (les plus récents comptent davantage)
        et écarts de score.
      </AnalysisPageHeader>

      <CompetitionChips
        options={options}
        active={competition.slug}
        buildHref={(value) => analysisHref("/analyses/forme", { competition: value })}
      />

      {ranked.length === 0 ? (
        <EmptyState title={`${competition.name} : pas encore de match joué`}>
          Le classement de forme apparaîtra après les premières rencontres.
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="La plus en forme"
              value={<span className="text-win">{formatNumber(best.formScore)}</span>}
              hint={teamName(best.teamId)}
            />
            <StatCard
              label="En difficulté"
              value={<span className="text-loss">{formatNumber(worst.formScore)}</span>}
              hint={teamName(worst.teamId)}
            />
            {longestWin ? (
              <StatCard
                label="Meilleure série"
                value={`${longestWin.streak.count} V`}
                hint={teamName(longestWin.teamId)}
              />
            ) : (
              <StatCard label="Meilleure série" value="—" />
            )}
          </div>

          <section aria-labelledby="titre-forme">
            <SectionTitle count={ranked.length}>
              <span id="titre-forme">Classement de forme · {competition.name}</span>
            </SectionTitle>
            <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
              <div className="hidden grid-cols-[2rem_minmax(0,1.4fr)_7.5rem_3rem_4rem_minmax(0,1fr)] items-center gap-3 border-b border-border px-4 py-2 text-xs font-semibold text-fg-subtle md:grid">
                <span className="text-right">#</span>
                <span>Équipe</span>
                <span>5 derniers</span>
                <span>Série</span>
                <span className="text-right">Net</span>
                <span>Indice de forme</span>
              </div>
              <ol className="divide-y divide-border">
                {ranked.map((s, index) => {
                  const team = teams.get(s.teamId);
                  if (!team) return null;
                  const tone = formTone(s.formScore);
                  return (
                    <li key={s.teamId}>
                      <Link
                        href={`/equipes/${team.id}`}
                        className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-2.5 text-sm transition-colors hover:bg-surface-2 md:grid-cols-[2rem_minmax(0,1.4fr)_7.5rem_3rem_4rem_minmax(0,1fr)]"
                      >
                        <span className={cn("text-right text-xs font-bold tabular", index < 3 ? "text-accent" : "text-fg-subtle")}>
                          {index + 1}
                        </span>
                        <span className="flex min-w-0 items-center gap-2.5">
                          <TeamBadge team={team} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold">{team.name}</span>
                            <span className="block text-xs text-fg-muted tabular">
                              {s.wins}-{s.losses}
                            </span>
                          </span>
                        </span>
                        <FormIndicator form={s.form} className="justify-self-end md:justify-self-start" />
                        {/* Mobile : série, net et barre sur une 2e ligne ; ≥ md : colonnes dédiées (display: contents) */}
                        <span className="col-span-2 col-start-2 flex items-center gap-3 md:contents">
                          <StreakChip type={s.streak.type} count={s.streak.count} />
                          <span
                            className={cn(
                              "shrink-0 text-xs font-semibold tabular md:text-right md:text-sm",
                              s.netRating > 0 ? "text-win" : s.netRating < 0 ? "text-loss" : "text-fg-muted",
                            )}
                          >
                            <span className="md:sr-only">Net </span>
                            {formatSigned(s.netRating)}
                          </span>
                          <span className="flex min-w-0 flex-1 items-center gap-2">
                            <span
                              className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3"
                              role="meter"
                              aria-valuemin={0}
                              aria-valuemax={10}
                              aria-valuenow={s.formScore}
                              aria-label={`Indice de forme ${formatNumber(s.formScore)} sur 10`}
                            >
                              <span className={cn("block h-full rounded-full", tone.bar)} style={{ width: `${Math.max(2, s.formScore * 10)}%` }} />
                            </span>
                            <span className={cn("w-8 text-right text-sm font-extrabold tabular", tone.text)}>
                              {formatNumber(s.formScore)}
                            </span>
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </div>
            <p className="mt-2 text-xs text-fg-subtle">
              Net rating : différence entre points marqués et encaissés pour 100 possessions sur la saison.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
