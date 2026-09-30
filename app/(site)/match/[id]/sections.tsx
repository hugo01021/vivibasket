import Link from "next/link";
import type { AdvancedTeamStats, ID, MatchDetails, Player, ShootingLine, TeamBoxScore, TeamSeasonStats } from "@/types";
import { formatNumber, formatPct, formatSigned } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AiInsights, WinProbabilityBar, type KeyPlayerCard } from "@/components/analysis/AiInsights";
import { buildScoreProgression } from "@/components/analysis/score-progression";
import { ScoreProgressionChart } from "@/components/analysis/ScoreProgressionChart";
import { StatComparison, StatComparisonGroup } from "@/components/analysis/StatComparison";
import { BoxScoreTable } from "@/components/match/BoxScoreTable";
import { HeadToHeadList } from "@/components/match/HeadToHeadList";
import { matchTabHref } from "@/components/match/MatchTabs";
import { PlayByPlayList } from "@/components/match/PlayByPlayList";
import { TopPerformers } from "@/components/match/TopPerformers";
import { FormIndicator } from "@/components/team/FormIndicator";
import { EmptyState } from "@/components/ui/EmptyState";

export interface MatchPageData {
  details: MatchDetails;
  /** Joueurs des deux effectifs (et joueurs clés), indexés par ID. */
  players: Map<ID, Player>;
  /** Stats de saison des deux équipes dans la compétition du match. */
  season: { home?: TeamSeasonStats; away?: TeamSeasonStats };
  keyPlayers: { home?: KeyPlayerCard; away?: KeyPlayerCard };
}

const isLive = (d: MatchDetails) => d.match.status === "live" || d.match.status === "halftime";

/** Sur-titres des cartes (charte). */
const LABEL = "text-[11px] uppercase tracking-[0.08em] text-fg-muted";

function pct(line: ShootingLine): number {
  return line.attempted > 0 ? line.made / line.attempted : 0;
}

function shootingDisplay(line: ShootingLine) {
  return (
    <>
      {formatPct(pct(line))}
      <span className="ml-1 text-[11px] font-normal text-fg-subtle">
        {line.made}/{line.attempted}
      </span>
    </>
  );
}

function PendingNotice({ what, data }: { what: string; data: MatchPageData }) {
  const { status } = data.details.match;
  if (status === "postponed" || status === "cancelled") {
    return (
      <EmptyState title={status === "postponed" ? "Match reporté" : "Match annulé"}>
        {what} seront publiées si le match est disputé.
      </EmptyState>
    );
  }
  return (
    <EmptyState title={`${what} disponibles au coup d’envoi`}>
      Ce match n’a pas encore commencé. Consultez le Résumé et l’Analyse pour l’avant-match.
    </EmptyState>
  );
}

function ProvisionalNote({ data }: { data: MatchPageData }) {
  if (!isLive(data.details)) return null;
  return <p className="text-xs text-fg-subtle">Statistiques provisoires, mises à jour pendant le match.</p>;
}

/* ------------------------------------------------------------------ */
/* Comparaisons réutilisées                                            */
/* ------------------------------------------------------------------ */

function KeyTeamStats({ data, home, away }: { data: MatchPageData; home: TeamBoxScore; away: TeamBoxScore }) {
  const { homeTeam, awayTeam } = data.details;
  return (
    <StatComparisonGroup title="Stats clés" homeTeam={homeTeam} awayTeam={awayTeam}>
      <StatComparison label="Tirs" home={pct(home.fieldGoals)} away={pct(away.fieldGoals)} homeDisplay={shootingDisplay(home.fieldGoals)} awayDisplay={shootingDisplay(away.fieldGoals)} max={1} />
      <StatComparison label="3 points" home={pct(home.threePointers)} away={pct(away.threePointers)} homeDisplay={shootingDisplay(home.threePointers)} awayDisplay={shootingDisplay(away.threePointers)} max={1} />
      <StatComparison label="Lancers francs" home={pct(home.freeThrows)} away={pct(away.freeThrows)} homeDisplay={shootingDisplay(home.freeThrows)} awayDisplay={shootingDisplay(away.freeThrows)} max={1} />
      <StatComparison label="Rebonds" home={home.rebounds} away={away.rebounds} />
      <StatComparison label="Passes décisives" home={home.assists} away={away.assists} />
      <StatComparison label="Balles perdues" home={home.turnovers} away={away.turnovers} lowerIsBetter />
      <StatComparison label="Points dans la raquette" home={home.pointsInPaint} away={away.pointsInPaint} />
      <StatComparison label="Points du banc" home={home.benchPoints} away={away.benchPoints} />
    </StatComparisonGroup>
  );
}

function SeasonComparison({ data }: { data: MatchPageData }) {
  const { homeTeam, awayTeam, competition } = data.details;
  const { home, away } = data.season;
  if (!home || !away) {
    return (
      <EmptyState title="Comparaison de saison indisponible">
        Les deux équipes n’ont pas encore assez de matchs joués en {competition.name}.
      </EmptyState>
    );
  }
  const winPct = (s: TeamSeasonStats) => (s.gamesPlayed > 0 ? s.wins / s.gamesPlayed : 0);
  return (
    <StatComparisonGroup
      title={`Saison · ${competition.name}`}
      homeTeam={homeTeam}
      awayTeam={awayTeam}
      footer={
        <div className="flex items-center justify-between gap-3">
          <FormIndicator form={home.form} />
          <span>5 derniers matchs</span>
          <FormIndicator form={away.form} />
        </div>
      }
    >
      <StatComparison label="Bilan" home={winPct(home)} away={winPct(away)} homeDisplay={`${home.wins}-${home.losses}`} awayDisplay={`${away.wins}-${away.losses}`} max={1} />
      <StatComparison label="Forme" hint="/10" home={home.formScore} away={away.formScore} homeDisplay={formatNumber(home.formScore)} awayDisplay={formatNumber(away.formScore)} max={10} />
      <StatComparison label="Points marqués" home={home.pointsPerGame} away={away.pointsPerGame} homeDisplay={formatNumber(home.pointsPerGame)} awayDisplay={formatNumber(away.pointsPerGame)} />
      <StatComparison label="Points encaissés" home={home.pointsAllowedPerGame} away={away.pointsAllowedPerGame} homeDisplay={formatNumber(home.pointsAllowedPerGame)} awayDisplay={formatNumber(away.pointsAllowedPerGame)} lowerIsBetter />
      <StatComparison label="Rating offensif" home={home.offensiveRating} away={away.offensiveRating} homeDisplay={formatNumber(home.offensiveRating)} awayDisplay={formatNumber(away.offensiveRating)} />
      <StatComparison label="Rating défensif" home={home.defensiveRating} away={away.defensiveRating} homeDisplay={formatNumber(home.defensiveRating)} awayDisplay={formatNumber(away.defensiveRating)} lowerIsBetter />
      <StatComparison label="Net rating" home={home.netRating} away={away.netRating} homeDisplay={formatSigned(home.netRating)} awayDisplay={formatSigned(away.netRating)} />
      <StatComparison label="Rythme" hint="poss./match" home={home.pace} away={away.pace} homeDisplay={formatNumber(home.pace)} awayDisplay={formatNumber(away.pace)} neutral />
      <StatComparison label="eFG%" home={home.effectiveFieldGoalPct} away={away.effectiveFieldGoalPct} homeDisplay={formatPct(home.effectiveFieldGoalPct)} awayDisplay={formatPct(away.effectiveFieldGoalPct)} max={1} />
      <StatComparison label="3 points" home={home.threePointPct} away={away.threePointPct} homeDisplay={formatPct(home.threePointPct)} awayDisplay={formatPct(away.threePointPct)} max={1} />
      <StatComparison label="Rebonds" home={home.reboundsPerGame} away={away.reboundsPerGame} homeDisplay={formatNumber(home.reboundsPerGame)} awayDisplay={formatNumber(away.reboundsPerGame)} />
      <StatComparison label="Passes décisives" home={home.assistsPerGame} away={away.assistsPerGame} homeDisplay={formatNumber(home.assistsPerGame)} awayDisplay={formatNumber(away.assistsPerGame)} />
      <StatComparison label="Balles perdues" home={home.turnoversPerGame} away={away.turnoversPerGame} homeDisplay={formatNumber(home.turnoversPerGame)} awayDisplay={formatNumber(away.turnoversPerGame)} lowerIsBetter />
    </StatComparisonGroup>
  );
}

function AnalysisTeaser({ data, withProbability }: { data: MatchPageData; withProbability: boolean }) {
  const { analysis, homeTeam, awayTeam, match } = data.details;
  return (
    <section aria-labelledby="titre-analyse-resume" className="rounded-md border border-border bg-surface p-4">
      <header className="mb-2 flex items-center justify-between gap-3">
        <h3 id="titre-analyse-resume" className={LABEL}>
          Analyse
        </h3>
        <Link
          href={matchTabHref(match.id, "analyse")}
          scroll={false}
          className="-my-2 inline-flex min-h-10 items-center text-xs font-semibold text-fg-muted transition-colors hover:text-fg sm:min-h-0"
        >
          Analyse complète ›
        </Link>
      </header>
      <p className="text-sm leading-relaxed text-fg">{analysis.summary}</p>
      {withProbability && (
        <div className="mt-4 border-t border-border pt-3">
          <p className={cn(LABEL, "mb-2")}>Probabilité de victoire</p>
          <WinProbabilityBar probability={analysis.winProbability} homeTeam={homeTeam} awayTeam={awayTeam} />
        </div>
      )}
    </section>
  );
}

function KeyPlayersPreview({ data }: { data: MatchPageData }) {
  const { homeTeam, awayTeam } = data.details;
  const cards = [
    { card: data.keyPlayers.home, team: homeTeam },
    { card: data.keyPlayers.away, team: awayTeam },
  ].filter((c): c is { card: KeyPlayerCard; team: typeof homeTeam } => Boolean(c.card));
  if (cards.length === 0) return null;
  return (
    <section aria-labelledby="titre-joueurs-a-suivre" className="rounded-md border border-border bg-surface">
      <h3 id="titre-joueurs-a-suivre" className={cn(LABEL, "border-b border-border px-4 py-2.5")}>
        Joueurs à suivre
      </h3>
      <ul className="divide-y divide-border">
        {cards.map(({ card, team }) => (
          <li key={card.player.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <div className="min-w-0">
              <Link href={`/joueurs/${card.player.id}`} className="block truncate text-sm font-semibold transition-colors hover:text-accent">
                {card.player.firstName} {card.player.lastName}
              </Link>
              <p className="text-xs text-fg-subtle">
                {team.shortName} · {card.context}
              </p>
            </div>
            <span className="shrink-0 text-sm text-fg tabular">{card.statLine}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Onglets                                                             */
/* ------------------------------------------------------------------ */

export function SummaryTab({ data }: { data: MatchPageData }) {
  const { details } = data;
  const { match, homeTeam, awayTeam, teamStats, boxScore, headToHead } = details;
  const h2h = <HeadToHeadList matches={headToHead} homeTeam={homeTeam} awayTeam={awayTeam} currentMatchId={match.id} />;

  if (!teamStats) {
    // Avant-match : analyse, probabilité, comparaison de saison, confrontations
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <AnalysisTeaser data={data} withProbability />
          <SeasonComparison data={data} />
        </div>
        <div className="space-y-4">
          <KeyPlayersPreview data={data} />
          {h2h}
        </div>
      </div>
    );
  }

  const hasBox = boxScore.home.length > 0 || boxScore.away.length > 0;
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <KeyTeamStats data={data} home={teamStats.home} away={teamStats.away} />
        <ProvisionalNote data={data} />
      </div>
      <div className="space-y-4">
        <AnalysisTeaser data={data} withProbability={false} />
        {hasBox && <TopPerformers homeTeam={homeTeam} awayTeam={awayTeam} home={boxScore.home} away={boxScore.away} players={data.players} />}
        {h2h}
      </div>
    </div>
  );
}

function AdvancedComparison({ data, home, away }: { data: MatchPageData; home: AdvancedTeamStats; away: AdvancedTeamStats }) {
  const { homeTeam, awayTeam } = data.details;
  const n = (v: number) => formatNumber(v);
  const tov = (v: number) => `${formatNumber(v)} %`;
  return (
    <StatComparisonGroup
      title="Stats avancées"
      homeTeam={homeTeam}
      awayTeam={awayTeam}
      footer={
        <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
          {[
            ["Rythme", "possessions ramenées à la durée réglementaire"],
            ["ORTG / DRTG", "points marqués / encaissés pour 100 possessions"],
            ["eFG%", "adresse pondérée (un tir à 3 pts vaut 1,5 tir)"],
            ["TS%", "adresse réelle, lancers francs inclus"],
            ["TOV%", "balles perdues pour 100 possessions"],
            ["ORB%", "part des rebonds offensifs disponibles captés"],
            ["Taux de LF", "lancers francs tentés par tir tenté"],
          ].map(([term, def]) => (
            <div key={term}>
              <dt className="inline font-semibold text-fg-muted">{term}</dt> <dd className="inline">: {def}</dd>
            </div>
          ))}
        </dl>
      }
    >
      <StatComparison label="Possessions" home={home.possessions} away={away.possessions} homeDisplay={n(home.possessions)} awayDisplay={n(away.possessions)} neutral />
      <StatComparison label="Rythme" hint="pace" home={home.pace} away={away.pace} homeDisplay={n(home.pace)} awayDisplay={n(away.pace)} neutral />
      <StatComparison label="Rating offensif" hint="ORTG" home={home.offensiveRating} away={away.offensiveRating} homeDisplay={n(home.offensiveRating)} awayDisplay={n(away.offensiveRating)} />
      <StatComparison label="Rating défensif" hint="DRTG" home={home.defensiveRating} away={away.defensiveRating} homeDisplay={n(home.defensiveRating)} awayDisplay={n(away.defensiveRating)} lowerIsBetter />
      <StatComparison label="Net rating" home={home.netRating} away={away.netRating} homeDisplay={formatSigned(home.netRating)} awayDisplay={formatSigned(away.netRating)} />
      <StatComparison label="eFG%" home={home.effectiveFieldGoalPct} away={away.effectiveFieldGoalPct} homeDisplay={formatPct(home.effectiveFieldGoalPct)} awayDisplay={formatPct(away.effectiveFieldGoalPct)} max={1} />
      <StatComparison label="TS%" home={home.trueShootingPct} away={away.trueShootingPct} homeDisplay={formatPct(home.trueShootingPct)} awayDisplay={formatPct(away.trueShootingPct)} max={1} />
      <StatComparison label="Pertes de balle" hint="TOV%" home={home.turnoverPct} away={away.turnoverPct} homeDisplay={tov(home.turnoverPct)} awayDisplay={tov(away.turnoverPct)} lowerIsBetter />
      <StatComparison label="Rebond offensif" hint="ORB%" home={home.offensiveReboundPct} away={away.offensiveReboundPct} homeDisplay={formatPct(home.offensiveReboundPct)} awayDisplay={formatPct(away.offensiveReboundPct)} max={1} />
      <StatComparison label="Taux de lancers francs" hint="FTA/FGA" home={home.freeThrowRate} away={away.freeThrowRate} homeDisplay={formatNumber(home.freeThrowRate, 2)} awayDisplay={formatNumber(away.freeThrowRate, 2)} />
      <StatComparison label="Paniers sur passe" hint="AST%" home={home.assistPct} away={away.assistPct} homeDisplay={formatPct(home.assistPct)} awayDisplay={formatPct(away.assistPct)} max={1} />
      <StatComparison label="Part de tirs à 3 pts" home={home.threePointRate} away={away.threePointRate} homeDisplay={formatPct(home.threePointRate)} awayDisplay={formatPct(away.threePointRate)} max={1} neutral />
    </StatComparisonGroup>
  );
}

export function StatsTab({ data }: { data: MatchPageData }) {
  const { homeTeam, awayTeam, teamStats, advanced } = data.details;
  if (!teamStats) return <PendingNotice what="Statistiques d’équipe" data={data} />;
  const { home, away } = teamStats;
  return (
    <div className="space-y-3">
      <ProvisionalNote data={data} />
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <StatComparisonGroup title="Box score d’équipe" homeTeam={homeTeam} awayTeam={awayTeam}>
          <StatComparison label="Points" home={home.points} away={away.points} />
          <StatComparison label="Tirs" home={pct(home.fieldGoals)} away={pct(away.fieldGoals)} homeDisplay={shootingDisplay(home.fieldGoals)} awayDisplay={shootingDisplay(away.fieldGoals)} max={1} />
          <StatComparison label="3 points" home={pct(home.threePointers)} away={pct(away.threePointers)} homeDisplay={shootingDisplay(home.threePointers)} awayDisplay={shootingDisplay(away.threePointers)} max={1} />
          <StatComparison label="Lancers francs" home={pct(home.freeThrows)} away={pct(away.freeThrows)} homeDisplay={shootingDisplay(home.freeThrows)} awayDisplay={shootingDisplay(away.freeThrows)} max={1} />
          <StatComparison label="Rebonds" home={home.rebounds} away={away.rebounds} />
          <StatComparison label="Rebonds offensifs" home={home.offensiveRebounds} away={away.offensiveRebounds} />
          <StatComparison label="Rebonds défensifs" home={home.defensiveRebounds} away={away.defensiveRebounds} />
          <StatComparison label="Passes décisives" home={home.assists} away={away.assists} />
          <StatComparison label="Interceptions" home={home.steals} away={away.steals} />
          <StatComparison label="Contres" home={home.blocks} away={away.blocks} />
          <StatComparison label="Balles perdues" home={home.turnovers} away={away.turnovers} lowerIsBetter />
          <StatComparison label="Fautes" home={home.fouls} away={away.fouls} lowerIsBetter />
          <StatComparison label="Points dans la raquette" home={home.pointsInPaint} away={away.pointsInPaint} />
          <StatComparison label="Points en contre-attaque" home={home.fastBreakPoints} away={away.fastBreakPoints} />
          <StatComparison label="Points de seconde chance" home={home.secondChancePoints} away={away.secondChancePoints} />
          <StatComparison label="Points après balle perdue" home={home.pointsOffTurnovers} away={away.pointsOffTurnovers} />
          <StatComparison label="Points du banc" home={home.benchPoints} away={away.benchPoints} />
          <StatComparison label="Plus gros écart" home={home.biggestLead} away={away.biggestLead} />
        </StatComparisonGroup>
        {advanced ? (
          <AdvancedComparison data={data} home={advanced.home} away={advanced.away} />
        ) : (
          <EmptyState title="Stats avancées indisponibles">Elles seront calculées dès que suffisamment de possessions auront été jouées.</EmptyState>
        )}
      </div>
    </div>
  );
}

export function PlayersTab({ data }: { data: MatchPageData }) {
  const { homeTeam, awayTeam, boxScore, teamStats } = data.details;
  if (boxScore.home.length === 0 && boxScore.away.length === 0) return <PendingNotice what="Statistiques des joueurs" data={data} />;
  const live = isLive(data.details);
  return (
    <div className="space-y-4">
      <ProvisionalNote data={data} />
      <BoxScoreTable team={homeTeam} lines={boxScore.home} totals={teamStats?.home} players={data.players} live={live} />
      <BoxScoreTable team={awayTeam} lines={boxScore.away} totals={teamStats?.away} players={data.players} live={live} />
      <p className="text-xs leading-relaxed text-fg-muted">
        MIN : minutes · PTS : points · REB : rebonds (offensifs-défensifs) · PD : passes décisives · INT : interceptions · CT : contres · BP : balles
        perdues · F : fautes · TIRS / 3 PTS / LF : réussis-tentés · +/− : écart au score avec le joueur sur le terrain · EVAL : évaluation (PIR).
        {live && " Le point orange signale les joueurs sur le terrain."}
      </p>
    </div>
  );
}

export function AnalysisTab({ data }: { data: MatchPageData }) {
  const { details, season, keyPlayers } = data;
  const { analysis, homeTeam, awayTeam, match, competition, playByPlay } = details;
  return (
    <div className="space-y-4">
      <AiInsights
        analysis={analysis}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        status={match.status}
        keyPlayers={keyPlayers}
        form={{ home: season.home?.form, away: season.away?.form }}
      />
      <section aria-labelledby="titre-evolution" className="rounded-md border border-border bg-surface p-4">
        <h3 id="titre-evolution" className={cn(LABEL, "mb-3")}>
          Évolution du score
        </h3>
        {playByPlay.length === 0 ? (
          <EmptyState title="Évolution du score disponible au coup d’envoi">La courbe se construit action après action pendant le match.</EmptyState>
        ) : (
          <ScoreProgressionChart
            data={buildScoreProgression(playByPlay, competition.gameMinutes)}
            home={{ name: homeTeam.shortName, abbreviation: homeTeam.abbreviation }}
            away={{ name: awayTeam.shortName, abbreviation: awayTeam.abbreviation }}
          />
        )}
      </section>
    </div>
  );
}

export function PlayByPlayTab({ data, scoringOnly }: { data: MatchPageData; scoringOnly: boolean }) {
  const { match, homeTeam, awayTeam, playByPlay } = data.details;
  if (playByPlay.length === 0) return <PendingNotice what="Actions du match" data={data} />;
  const base = matchTabHref(match.id, "play-by-play");
  return (
    <PlayByPlayList
      events={playByPlay}
      homeTeam={homeTeam}
      awayTeam={awayTeam}
      scoringOnly={scoringOnly}
      allHref={base}
      scoringHref={`${base}&actions=paniers`}
    />
  );
}
