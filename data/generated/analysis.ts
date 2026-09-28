import type {
  AdvancedTeamStats,
  AnalysisInsight,
  Competition,
  ID,
  Match,
  MatchAnalysis,
  MomentumPoint,
  PlayerBoxScoreLine,
  Team,
  TeamBoxScore,
  TeamSeasonStats,
} from "@/types";
import { fullPlayerName } from "@/lib/format";
import type { PlayerSeed } from "../players";

export interface AnalysisInput {
  match: Match;
  competition: Competition;
  homeTeam: Team;
  awayTeam: Team;
  homeStrength: number;
  awayStrength: number;
  homeSeason?: TeamSeasonStats;
  awaySeason?: TeamSeasonStats;
  teamStats?: { home: TeamBoxScore; away: TeamBoxScore };
  advanced?: { home: AdvancedTeamStats; away: AdvancedTeamStats };
  boxScore?: { home: PlayerBoxScoreLine[]; away: PlayerBoxScoreLine[] };
  players: Map<ID, PlayerSeed>;
}

/** Texte rédigé à la main qui remplace le résumé et les points clés générés. */
export interface AnalysisOverride {
  summary: string;
  insights: AnalysisInsight[];
}

interface Candidate extends AnalysisInsight {
  weight: number;
}

const pct = (v: number) => `${Math.round(v * 1000) / 10} %`;
const signed = (v: number) => (v > 0 ? `+${v}` : `${v}`);

function bestPlayer(lines: PlayerBoxScoreLine[] | undefined): PlayerBoxScoreLine | undefined {
  if (!lines?.length) return undefined;
  return [...lines].sort((a, b) => b.efficiency - a.efficiency || b.points - a.points)[0];
}

function topScorer(roster: PlayerSeed[]): PlayerSeed | undefined {
  return [...roster].sort((a, b) => b.profile.ppg - a.profile.ppg)[0];
}

function winProbability(input: AnalysisInput): { home: number; away: number } {
  const isNba = input.competition.gameMinutes === 48;
  const homeAdvantage = isNba ? 2.5 : 3.5;
  const formDelta = ((input.homeSeason?.formScore ?? 5) - (input.awaySeason?.formScore ?? 5)) * 0.6;
  const margin = (input.homeStrength - input.awayStrength) * 0.38 + homeAdvantage + formDelta;
  const home = 1 / (1 + Math.exp(-margin / 6));
  return { home: Math.round(home * 100) / 100, away: Math.round((1 - home) * 100) / 100 };
}

function momentum(match: Match, home: Team, away: Team): MomentumPoint[] {
  let runningHome = 0;
  let runningAway = 0;
  return match.periods.map((p) => {
    runningHome += p.home;
    runningAway += p.away;
    const diff = p.home - p.away;
    const total = runningHome - runningAway;
    const leader: MomentumPoint["leader"] = diff >= 3 ? "home" : diff <= -3 ? "away" : "even";
    const who = leader === "home" ? home.shortName : leader === "away" ? away.shortName : null;
    const note = who
      ? `${p.label} : ${who} remporte la période ${p.home}-${p.away} (${signed(total)} au cumul)`
      : `${p.label} : période équilibrée ${p.home}-${p.away} (${signed(total)} au cumul)`;
    return { period: p.period, leader, note };
  });
}

function preMatchInsights(input: AnalysisInput): Candidate[] {
  const { homeTeam, awayTeam, homeSeason, awaySeason, players } = input;
  const out: Candidate[] = [];
  const teams = [
    { team: homeTeam, season: homeSeason },
    { team: awayTeam, season: awaySeason },
  ];
  for (const { team, season } of teams) {
    if (!season) continue;
    if (season.streak.count >= 3) {
      out.push({
        title: `${team.shortName} sur une série de ${season.streak.count} ${season.streak.type === "W" ? "victoires" : "défaites"}`,
        body: `Forme ${season.formScore}/10 sur les cinq derniers matchs, bilan ${season.wins}-${season.losses} dans la compétition.`,
        tone: season.streak.type === "W" ? "positive" : "negative",
        teamId: team.id,
        weight: 3 + season.streak.count,
      });
    }
    if (season.netRating >= 6) {
      out.push({
        title: `${team.shortName} domine des deux côtés du terrain`,
        body: `Net rating ${signed(season.netRating)} : ${season.offensiveRating} pts marqués et ${season.defensiveRating} encaissés pour 100 possessions.`,
        tone: "positive",
        teamId: team.id,
        weight: 4,
      });
    }
    if (season.threePointPct >= 0.38) {
      out.push({
        title: `${team.shortName} fait mal de loin`,
        body: `${pct(season.threePointPct)} à 3 points cette saison : la défense du périmètre sera déterminante.`,
        tone: "neutral",
        teamId: team.id,
        weight: 3,
      });
    }
  }
  if (homeSeason && awaySeason) {
    const paceDiff = homeSeason.pace - awaySeason.pace;
    if (Math.abs(paceDiff) >= 3) {
      const fast = paceDiff > 0 ? homeTeam : awayTeam;
      const slow = paceDiff > 0 ? awayTeam : homeTeam;
      out.push({
        title: "Duel de rythmes",
        body: `${fast.shortName} joue vite (${Math.max(homeSeason.pace, awaySeason.pace)} possessions par match) quand ${slow.shortName} préfère ralentir (${Math.min(homeSeason.pace, awaySeason.pace)}). Celui qui impose son tempo prend l'avantage.`,
        tone: "neutral",
        weight: 3,
      });
    }
  }
  const homeRoster = [...players.values()].filter((p) => p.teamId === homeTeam.id);
  const awayRoster = [...players.values()].filter((p) => p.teamId === awayTeam.id);
  const hs = topScorer(homeRoster);
  const as = topScorer(awayRoster);
  if (hs && as) {
    out.push({
      title: "Les hommes à suivre",
      body: `${fullPlayerName(hs)} (${hs.profile.ppg} pts de moyenne) face à ${fullPlayerName(as)} (${as.profile.ppg} pts) : le duel des leaders offensifs.`,
      tone: "neutral",
      weight: 2,
    });
  }
  return out;
}

function inGameInsights(input: AnalysisInput): Candidate[] {
  const { homeTeam, awayTeam, teamStats, advanced, boxScore, players, match } = input;
  if (!teamStats || !advanced || !boxScore) return [];
  const out: Candidate[] = [];
  const sides = [
    { team: homeTeam, opp: awayTeam, box: teamStats.home, oppBox: teamStats.away, adv: advanced.home, lines: boxScore.home },
    { team: awayTeam, opp: homeTeam, box: teamStats.away, oppBox: teamStats.home, adv: advanced.away, lines: boxScore.away },
  ];

  for (const s of sides) {
    const rebDiff = s.box.rebounds - s.oppBox.rebounds;
    if (rebDiff >= 6) {
      out.push({
        title: `${s.team.shortName} contrôle le rebond`,
        body: `${s.box.rebounds} rebonds contre ${s.oppBox.rebounds}, dont ${s.box.offensiveRebounds} offensifs qui ont rapporté ${s.box.secondChancePoints} points de seconde chance.`,
        tone: "positive",
        teamId: s.team.id,
        weight: 2 + rebDiff / 4,
      });
    }
    const threePct = s.box.threePointers.attempted ? s.box.threePointers.made / s.box.threePointers.attempted : 0;
    if (s.box.threePointers.attempted >= 12 && threePct >= 0.4) {
      out.push({
        title: `Adresse extérieure de ${s.team.shortName}`,
        body: `${s.box.threePointers.made}/${s.box.threePointers.attempted} à 3 points (${pct(threePct)}), un facteur décisif dans l'écart.`,
        tone: "positive",
        teamId: s.team.id,
        weight: 3 + (threePct - 0.4) * 20,
      });
    } else if (s.box.threePointers.attempted >= 12 && threePct <= 0.27) {
      out.push({
        title: `${s.team.shortName} en panne de loin`,
        body: `Seulement ${s.box.threePointers.made}/${s.box.threePointers.attempted} à 3 points (${pct(threePct)}) : l'attaque manque d'espaces.`,
        tone: "negative",
        teamId: s.team.id,
        weight: 3 + (0.27 - threePct) * 20,
      });
    }
    const tovDiff = s.oppBox.turnovers - s.box.turnovers;
    if (tovDiff >= 5) {
      out.push({
        title: `${s.team.shortName} profite des pertes de balle`,
        body: `${s.oppBox.turnovers} ballons perdus par ${s.opp.shortName} contre ${s.box.turnovers}, convertis en ${s.box.pointsOffTurnovers} points.`,
        tone: "positive",
        teamId: s.team.id,
        weight: 2 + tovDiff / 3,
      });
    }
    if (s.box.benchPoints - s.oppBox.benchPoints >= 12) {
      out.push({
        title: `Le banc de ${s.team.shortName} fait la différence`,
        body: `${s.box.benchPoints} points venus du banc contre ${s.oppBox.benchPoints} pour ${s.opp.shortName}.`,
        tone: "positive",
        teamId: s.team.id,
        weight: 2.5,
      });
    }
    if (s.adv.trueShootingPct >= 0.62) {
      out.push({
        title: `Efficacité offensive de ${s.team.shortName}`,
        body: `True shooting ${pct(s.adv.trueShootingPct)} et ${s.adv.offensiveRating} points pour 100 possessions : une attaque bien huilée.`,
        tone: "positive",
        teamId: s.team.id,
        weight: 2.5,
      });
    }
    if (s.box.fastBreakPoints >= 18) {
      out.push({
        title: `${s.team.shortName} punit en transition`,
        body: `${s.box.fastBreakPoints} points en contre-attaque : le rythme (${s.adv.pace} possessions) joue en faveur de ${s.team.shortName}.`,
        tone: "neutral",
        teamId: s.team.id,
        weight: 2,
      });
    }
    const best = bestPlayer(s.lines);
    const bestSeed = best ? players.get(best.playerId) : undefined;
    if (best && bestSeed) {
      const doubleDouble = [best.points, best.rebounds, best.assists].filter((v) => v >= 10).length >= 2;
      const bigScorer = best.points >= (input.competition.gameMinutes === 48 ? 28 : 20);
      if (doubleDouble || bigScorer) {
        out.push({
          title: `${fullPlayerName(bestSeed)} porte ${s.team.shortName}`,
          body: `${best.points} points, ${best.rebounds} rebonds et ${best.assists} passes en ${Math.round(best.minutes)} minutes (${best.fieldGoals.made}/${best.fieldGoals.attempted} aux tirs).`,
          tone: "positive",
          teamId: s.team.id,
          weight: 3 + (doubleDouble ? 1 : 0),
        });
      }
    }
  }

  const margin = Math.abs(match.homeScore - match.awayScore);
  if (match.status !== "scheduled" && margin <= 4 && match.periods.length >= 3) {
    out.push({
      title: "Un money-time sous tension",
      body: `Écart de ${margin} point${margin > 1 ? "s" : ""} : les derniers systèmes et la gestion des fautes décideront de l'issue.`,
      tone: "neutral",
      weight: 3,
    });
  }
  const homeLead = teamStats.home.biggestLead;
  const awayLead = teamStats.away.biggestLead;
  if (Math.max(homeLead, awayLead) >= 15) {
    const team = homeLead >= awayLead ? homeTeam : awayTeam;
    out.push({
      title: `${team.shortName} a compté jusqu'à ${Math.max(homeLead, awayLead)} points d'avance`,
      body: `Le plus grand écart du match est en faveur de ${team.shortName}.`,
      tone: "neutral",
      teamId: team.id,
      weight: 1.5,
    });
  }
  return out;
}

function generatedSummary(input: AnalysisInput, probability: { home: number; away: number }): string {
  const { match, homeTeam, awayTeam, boxScore, players } = input;
  if (match.status === "scheduled") {
    const favourite = probability.home >= probability.away ? homeTeam : awayTeam;
    const p = Math.round(Math.max(probability.home, probability.away) * 100);
    return `${homeTeam.name} reçoit ${awayTeam.name} (${match.round}). Notre modèle donne ${favourite.shortName} favori à ${p} %, ${
      favourite.id === homeTeam.id ? "porté par l'avantage du terrain" : "malgré le déplacement"
    }.`;
  }
  const leader = match.homeScore >= match.awayScore ? homeTeam : awayTeam;
  const trailer = leader.id === homeTeam.id ? awayTeam : homeTeam;
  const margin = Math.abs(match.homeScore - match.awayScore);
  const best = bestPlayer(leader.id === homeTeam.id ? boxScore?.home : boxScore?.away);
  const bestSeed = best ? players.get(best.playerId) : undefined;
  const star = best && bestSeed ? ` ${fullPlayerName(bestSeed)} termine meilleur joueur avec ${best.points} points, ${best.rebounds} rebonds et ${best.assists} passes.` : "";
  if (match.status === "finished") {
    const verb = margin >= 15 ? "domine largement" : margin >= 8 ? "s'impose nettement face à" : "l'emporte de justesse contre";
    return `${leader.name} ${verb} ${trailer.name} ${match.homeScore}-${match.awayScore} (${match.round}).${star}`;
  }
  const clock = match.clock ? `${match.clock.periodLabel}, ${match.clock.timeRemaining}` : "";
  return `${leader.name} mène ${Math.max(match.homeScore, match.awayScore)}-${Math.min(match.homeScore, match.awayScore)} face à ${trailer.name} (${clock}).${
    margin <= 5 ? " Le match reste totalement ouvert." : ""
  }${star}`;
}

/** Analyse « IA » (règles) d'un match, joué, en cours ou à venir. */
export function buildAnalysis(input: AnalysisInput, override?: AnalysisOverride): MatchAnalysis {
  const probability = winProbability(input);
  const candidates = input.match.status === "scheduled" ? preMatchInsights(input) : inGameInsights(input);
  const insights = candidates
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)
    .map(({ weight: _weight, ...insight }) => insight);
  const bestHome = bestPlayer(input.boxScore?.home);
  const bestAway = bestPlayer(input.boxScore?.away);
  const homeRoster = [...input.players.values()].filter((p) => p.teamId === input.homeTeam.id);
  const awayRoster = [...input.players.values()].filter((p) => p.teamId === input.awayTeam.id);
  return {
    matchId: input.match.id,
    generatedAt: new Date().toISOString(),
    source: "mock",
    summary: override?.summary ?? generatedSummary(input, probability),
    insights: override?.insights ?? insights,
    keyPlayers: {
      home: bestHome?.playerId ?? topScorer(homeRoster)?.id ?? "",
      away: bestAway?.playerId ?? topScorer(awayRoster)?.id ?? "",
    },
    form: { home: input.homeSeason?.formScore ?? 5, away: input.awaySeason?.formScore ?? 5 },
    winProbability: probability,
    momentum: momentum(input.match, input.homeTeam, input.awayTeam),
  };
}
