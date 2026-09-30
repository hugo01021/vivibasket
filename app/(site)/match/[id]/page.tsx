import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { Competition, ID, MatchDetails, Player, PlayerBoxScoreLine, TeamSeasonStats } from "@/types";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import type { KeyPlayerCard } from "@/components/analysis/AiInsights";
import { MatchTabs, parseMatchTab } from "@/components/match/MatchTabs";
import { ScoreHeader } from "@/components/match/ScoreHeader";
import { AnalysisTab, PlayByPlayTab, PlayersTab, StatsTab, SummaryTab, type MatchPageData } from "./sections";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/** Dédoublonne l'appel entre generateMetadata et la page. */
const getMatchDetails = cache((id: string) => api.getMatch(id));

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const details = await getMatchDetails(id);
  if (!details) return { title: "Match introuvable" };
  const { match, homeTeam, awayTeam, competition } = details;
  const played = match.status === "finished" || match.status === "live" || match.status === "halftime";
  const score = played ? ` (${match.homeScore}-${match.awayScore})` : "";
  return {
    title: `${homeTeam.shortName} – ${awayTeam.shortName}`,
    description: `${homeTeam.name} – ${awayTeam.name}${score}, ${competition.name} · ${match.round} : score, statistiques, box score, analyse et play-by-play.`,
  };
}

function pickSeason(stats: TeamSeasonStats[], competitionId: ID): TeamSeasonStats | undefined {
  return stats.find((s) => s.competitionId === competitionId);
}

function gameLine(line: PlayerBoxScoreLine): string {
  return `${line.points} pts · ${line.rebounds} reb · ${line.assists} pd`;
}

async function keyPlayerCard(
  playerId: ID | undefined,
  lines: PlayerBoxScoreLine[],
  players: Map<ID, Player>,
  competition: Competition,
  live: boolean,
): Promise<KeyPlayerCard | undefined> {
  if (!playerId) return undefined;
  const player = players.get(playerId);
  if (!player) return undefined;
  const line = lines.find((l) => l.playerId === playerId);
  if (line) return { player, statLine: gameLine(line), context: live ? "Sur ce match (en cours)" : "Sur ce match" };
  const season = (await api.getPlayerSeasonStats(playerId)).find((s) => s.competitionId === competition.id);
  if (!season) return { player, statLine: "—", context: "Pas encore de statistiques cette saison" };
  return {
    player,
    statLine: `${formatNumber(season.pointsPerGame)} pts · ${formatNumber(season.reboundsPerGame)} reb · ${formatNumber(season.assistsPerGame)} pd`,
    context: `Moyennes en ${competition.name}`,
  };
}

async function loadPageData(details: MatchDetails): Promise<MatchPageData> {
  const { match, homeTeam, awayTeam, competition, boxScore, analysis } = details;
  const [homeRoster, awayRoster, homeSeason, awaySeason] = await Promise.all([
    api.getTeamRoster(homeTeam.id),
    api.getTeamRoster(awayTeam.id),
    api.getTeamSeasonStats(homeTeam.id),
    api.getTeamSeasonStats(awayTeam.id),
  ]);

  const players = new Map<ID, Player>();
  for (const p of [...homeRoster, ...awayRoster]) players.set(p.id, p);

  // Joueurs absents des effectifs actuels (transfert, sélection nationale…) : chargés à l'unité.
  const referenced = new Set<ID>([
    ...boxScore.home.map((l) => l.playerId),
    ...boxScore.away.map((l) => l.playerId),
    analysis.keyPlayers.home,
    analysis.keyPlayers.away,
  ]);
  const missing = [...referenced].filter((id) => id && !players.has(id));
  const extra = await Promise.all(missing.map((id) => api.getPlayer(id)));
  for (const p of extra) if (p) players.set(p.id, p);

  const live = match.status === "live" || match.status === "halftime";
  const [homeKey, awayKey] = await Promise.all([
    keyPlayerCard(analysis.keyPlayers.home, boxScore.home, players, competition, live),
    keyPlayerCard(analysis.keyPlayers.away, boxScore.away, players, competition, live),
  ]);

  return {
    details,
    players,
    season: { home: pickSeason(homeSeason, competition.id), away: pickSeason(awaySeason, competition.id) },
    keyPlayers: { home: homeKey, away: awayKey },
  };
}

export default async function MatchPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const details = await getMatchDetails(id);
  if (!details) notFound();

  const tab = parseMatchTab(query.onglet);
  const scoringOnly = query.actions === "paniers";
  const data = await loadPageData(details);
  const { match, homeTeam, awayTeam } = details;

  return (
    <div className="space-y-4">
      <h1 className="sr-only">
        {homeTeam.name} – {awayTeam.name}
      </h1>
      <ScoreHeader details={details} />
      <MatchTabs matchId={match.id} active={tab} />
      <div id="onglet" className="pt-1">
        {tab === "resume" && <SummaryTab data={data} />}
        {tab === "stats" && <StatsTab data={data} />}
        {tab === "joueurs" && <PlayersTab data={data} />}
        {tab === "analyse" && <AnalysisTab data={data} />}
        {tab === "play-by-play" && <PlayByPlayTab data={data} scoringOnly={scoringOnly} />}
      </div>
    </div>
  );
}
