/**
 * Données fictives de l'accueil : équipes (autocomplétion) et matchs du jour.
 *
 * Pour brancher une vraie API, il suffit de fournir des objets aux mêmes formes
 * (`HomeCompetition`, `HomeTeam`, `TodayMatch`) : les composants n'importent que ces types.
 */

export type HomeCompetitionId = "nba" | "euroleague" | "betclic-elite";

export interface HomeCompetition {
  id: HomeCompetitionId;
  label: string;
}

export interface HomeTeam {
  name: string;
  /** Abréviation affichée dans les espaces serrés (probabilité favorite, H2H). */
  short: string;
  competitions: HomeCompetitionId[];
}

export interface TodayMatch {
  id: string;
  competition: HomeCompetitionId;
  /** Heure de Paris, "HH:MM". */
  time: string;
  home: string;
  away: string;
  /** Probabilité de victoire de l'équipe à domicile, en %. */
  homeWinProb: number;
}

export const HOME_COMPETITIONS: HomeCompetition[] = [
  { id: "nba", label: "NBA" },
  { id: "euroleague", label: "EuroLeague" },
  { id: "betclic-elite", label: "Betclic Élite" },
];

const NBA: [string, string][] = [
  ["Atlanta Hawks", "ATL"],
  ["Boston Celtics", "BOS"],
  ["Brooklyn Nets", "BKN"],
  ["Charlotte Hornets", "CHA"],
  ["Chicago Bulls", "CHI"],
  ["Cleveland Cavaliers", "CLE"],
  ["Dallas Mavericks", "DAL"],
  ["Denver Nuggets", "DEN"],
  ["Detroit Pistons", "DET"],
  ["Golden State Warriors", "GSW"],
  ["Houston Rockets", "HOU"],
  ["Indiana Pacers", "IND"],
  ["LA Clippers", "LAC"],
  ["Los Angeles Lakers", "LAL"],
  ["Memphis Grizzlies", "MEM"],
  ["Miami Heat", "MIA"],
  ["Milwaukee Bucks", "MIL"],
  ["Minnesota Timberwolves", "MIN"],
  ["New Orleans Pelicans", "NOP"],
  ["New York Knicks", "NYK"],
  ["Oklahoma City Thunder", "OKC"],
  ["Orlando Magic", "ORL"],
  ["Philadelphia 76ers", "PHI"],
  ["Phoenix Suns", "PHX"],
  ["Portland Trail Blazers", "POR"],
  ["Sacramento Kings", "SAC"],
  ["San Antonio Spurs", "SAS"],
  ["Toronto Raptors", "TOR"],
  ["Utah Jazz", "UTA"],
  ["Washington Wizards", "WAS"],
];

const EUROLEAGUE: [string, string][] = [
  ["Real Madrid", "RMB"],
  ["FC Barcelona", "BAR"],
  ["Olympiacos", "OLY"],
  ["Panathinaikos", "PAO"],
  ["Fenerbahçe Beko", "FEN"],
  ["Anadolu Efes", "EFS"],
  ["AS Monaco", "MON"],
  ["Paris Basketball", "PAR"],
  ["Maccabi Tel Aviv", "MTA"],
  ["Hapoel Tel Aviv", "HTA"],
  ["Partizan Belgrade", "PTZ"],
  ["Crvena Zvezda", "CZV"],
  ["Žalgiris Kaunas", "ZAL"],
  ["Virtus Bologna", "VIR"],
  ["Olimpia Milano", "EA7"],
  ["Bayern Munich", "BAY"],
  ["Baskonia", "BAS"],
  ["Valencia Basket", "VAL"],
  ["Dubai Basketball", "DUB"],
  ["LDLC ASVEL", "ASV"],
];

const BETCLIC_ELITE: [string, string][] = [
  ["Paris Basketball", "PAR"],
  ["AS Monaco", "MON"],
  ["LDLC ASVEL", "ASV"],
  ["JL Bourg", "JLB"],
  ["Cholet Basket", "CHO"],
  ["SIG Strasbourg", "SIG"],
  ["Nanterre 92", "NAN"],
  ["Le Mans Sarthe Basket", "MSB"],
  ["BCM Gravelines-Dunkerque", "BCM"],
  ["Limoges CSP", "CSP"],
  ["Élan Chalon", "ELA"],
  ["ESSM Le Portel", "ESS"],
  ["JDA Dijon", "JDA"],
  ["Saint-Quentin Basket", "SQB"],
  ["Boulazac Basket Dordogne", "BBD"],
  ["SLUC Nancy", "SLU"],
];

function buildTeams(): HomeTeam[] {
  const byName = new Map<string, HomeTeam>();
  const add = (list: [string, string][], competition: HomeCompetitionId) => {
    for (const [name, short] of list) {
      const existing = byName.get(name);
      if (existing) existing.competitions.push(competition);
      else byName.set(name, { name, short, competitions: [competition] });
    }
  };
  add(NBA, "nba");
  add(EUROLEAGUE, "euroleague");
  add(BETCLIC_ELITE, "betclic-elite");
  return [...byName.values()];
}

/** Toutes les équipes proposées dans l'autocomplétion (une équipe peut jouer plusieurs compétitions). */
export const HOME_TEAMS: HomeTeam[] = buildTeams();

export const TODAY_MATCHES: TodayMatch[] = [
  // NBA — nuit du jour (heure de Paris)
  { id: "nba-1", competition: "nba", time: "01:00", home: "New York Knicks", away: "Boston Celtics", homeWinProb: 54 },
  { id: "nba-2", competition: "nba", time: "01:00", home: "Orlando Magic", away: "Miami Heat", homeWinProb: 61 },
  { id: "nba-3", competition: "nba", time: "01:30", home: "Cleveland Cavaliers", away: "Detroit Pistons", homeWinProb: 67 },
  { id: "nba-4", competition: "nba", time: "02:00", home: "Oklahoma City Thunder", away: "Denver Nuggets", homeWinProb: 63 },
  { id: "nba-5", competition: "nba", time: "02:30", home: "San Antonio Spurs", away: "Houston Rockets", homeWinProb: 48 },
  { id: "nba-6", competition: "nba", time: "04:00", home: "Golden State Warriors", away: "Los Angeles Lakers", homeWinProb: 52 },
  { id: "nba-7", competition: "nba", time: "04:30", home: "Sacramento Kings", away: "Minnesota Timberwolves", homeWinProb: 38 },

  // EuroLeague
  { id: "el-1", competition: "euroleague", time: "18:30", home: "Anadolu Efes", away: "Olympiacos", homeWinProb: 44 },
  { id: "el-2", competition: "euroleague", time: "19:00", home: "Žalgiris Kaunas", away: "Bayern Munich", homeWinProb: 58 },
  { id: "el-3", competition: "euroleague", time: "20:00", home: "Paris Basketball", away: "Real Madrid", homeWinProb: 47 },
  { id: "el-4", competition: "euroleague", time: "20:30", home: "Olimpia Milano", away: "AS Monaco", homeWinProb: 42 },
  { id: "el-5", competition: "euroleague", time: "20:45", home: "FC Barcelona", away: "Fenerbahçe Beko", homeWinProb: 51 },

  // Betclic Élite
  { id: "be-1", competition: "betclic-elite", time: "19:00", home: "Cholet Basket", away: "Le Mans Sarthe Basket", homeWinProb: 55 },
  { id: "be-2", competition: "betclic-elite", time: "20:00", home: "JL Bourg", away: "SIG Strasbourg", homeWinProb: 64 },
  { id: "be-3", competition: "betclic-elite", time: "20:00", home: "Limoges CSP", away: "Nanterre 92", homeWinProb: 57 },
  { id: "be-4", competition: "betclic-elite", time: "20:30", home: "BCM Gravelines-Dunkerque", away: "LDLC ASVEL", homeWinProb: 36 },
];
