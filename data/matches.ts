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
  /** Nom court pour les écrans étroits (« Knicks », « Le Mans »). */
  shortName: string;
  /** Abréviation à trois lettres (écusson, H2H). */
  short: string;
  competitions: HomeCompetitionId[];
}

export type TodayMatchStatus = "scheduled" | "live" | "finished";

export interface TodayMatch {
  id: string;
  competition: HomeCompetitionId;
  /** Heure de Paris, "HH:MM". */
  time: string;
  home: string;
  away: string;
  status: TodayMatchStatus;
  /** Scores présents dès que le match a commencé. */
  homeScore?: number;
  awayScore?: number;
  /** Période et chrono d'un match en cours ("Q3 05:42", "Mi-temps"). */
  clock?: string;
  /** Probabilité de victoire de l'équipe à domicile, en % (utilisée par l'analyse). */
  homeWinProb: number;
}

/** [nom complet, abréviation, nom court facultatif (sinon le nom complet)] */
type TeamSeed = [string, string] | [string, string, string];

export const HOME_COMPETITIONS: HomeCompetition[] = [
  { id: "nba", label: "NBA" },
  { id: "euroleague", label: "EuroLeague" },
  { id: "betclic-elite", label: "Betclic Élite" },
];

const NBA: TeamSeed[] = [
  ["Atlanta Hawks", "ATL", "Hawks"],
  ["Boston Celtics", "BOS", "Celtics"],
  ["Brooklyn Nets", "BKN", "Nets"],
  ["Charlotte Hornets", "CHA", "Hornets"],
  ["Chicago Bulls", "CHI", "Bulls"],
  ["Cleveland Cavaliers", "CLE", "Cavaliers"],
  ["Dallas Mavericks", "DAL", "Mavericks"],
  ["Denver Nuggets", "DEN", "Nuggets"],
  ["Detroit Pistons", "DET", "Pistons"],
  ["Golden State Warriors", "GSW", "Warriors"],
  ["Houston Rockets", "HOU", "Rockets"],
  ["Indiana Pacers", "IND", "Pacers"],
  ["LA Clippers", "LAC", "Clippers"],
  ["Los Angeles Lakers", "LAL", "Lakers"],
  ["Memphis Grizzlies", "MEM", "Grizzlies"],
  ["Miami Heat", "MIA", "Heat"],
  ["Milwaukee Bucks", "MIL", "Bucks"],
  ["Minnesota Timberwolves", "MIN", "Timberwolves"],
  ["New Orleans Pelicans", "NOP", "Pelicans"],
  ["New York Knicks", "NYK", "Knicks"],
  ["Oklahoma City Thunder", "OKC", "Thunder"],
  ["Orlando Magic", "ORL", "Magic"],
  ["Philadelphia 76ers", "PHI", "76ers"],
  ["Phoenix Suns", "PHX", "Suns"],
  ["Portland Trail Blazers", "POR", "Trail Blazers"],
  ["Sacramento Kings", "SAC", "Kings"],
  ["San Antonio Spurs", "SAS", "Spurs"],
  ["Toronto Raptors", "TOR", "Raptors"],
  ["Utah Jazz", "UTA", "Jazz"],
  ["Washington Wizards", "WAS", "Wizards"],
];

const EUROLEAGUE: TeamSeed[] = [
  ["Real Madrid", "RMB"],
  ["FC Barcelona", "BAR"],
  ["Olympiacos", "OLY"],
  ["Panathinaikos", "PAO"],
  ["Fenerbahçe Beko", "FEN", "Fenerbahçe"],
  ["Anadolu Efes", "EFS", "Efes"],
  ["AS Monaco", "MON", "Monaco"],
  ["Paris Basketball", "PAR", "Paris"],
  ["Maccabi Tel Aviv", "MTA", "Maccabi"],
  ["Hapoel Tel Aviv", "HTA", "Hapoel TA"],
  ["Partizan Belgrade", "PTZ", "Partizan"],
  ["Crvena Zvezda", "CZV", "Étoile Rouge"],
  ["Žalgiris Kaunas", "ZAL", "Žalgiris"],
  ["Virtus Bologna", "VIR", "Virtus"],
  ["Olimpia Milano", "EA7", "Milano"],
  ["Bayern Munich", "BAY", "Bayern"],
  ["Baskonia", "BAS"],
  ["Valencia Basket", "VAL", "Valencia"],
  ["Dubai Basketball", "DUB", "Dubai"],
  ["LDLC ASVEL", "ASV", "ASVEL"],
];

const BETCLIC_ELITE: TeamSeed[] = [
  ["Paris Basketball", "PAR", "Paris"],
  ["AS Monaco", "MON", "Monaco"],
  ["LDLC ASVEL", "ASV", "ASVEL"],
  ["JL Bourg", "JLB", "Bourg"],
  ["Cholet Basket", "CHO", "Cholet"],
  ["SIG Strasbourg", "SIG", "Strasbourg"],
  ["Nanterre 92", "NAN", "Nanterre"],
  ["Le Mans Sarthe Basket", "MSB", "Le Mans"],
  ["BCM Gravelines-Dunkerque", "BCM", "Gravelines"],
  ["Limoges CSP", "CSP", "Limoges"],
  ["Élan Chalon", "ELA", "Chalon"],
  ["ESSM Le Portel", "ESS", "Le Portel"],
  ["JDA Dijon", "JDA", "Dijon"],
  ["Saint-Quentin Basket", "SQB", "Saint-Quentin"],
  ["Boulazac Basket Dordogne", "BBD", "Boulazac"],
  ["SLUC Nancy", "SLU", "Nancy"],
];

function buildTeams(): HomeTeam[] {
  const byName = new Map<string, HomeTeam>();
  const add = (list: TeamSeed[], competition: HomeCompetitionId) => {
    for (const [name, short, shortName = name] of list) {
      const existing = byName.get(name);
      if (existing) existing.competitions.push(competition);
      else byName.set(name, { name, shortName, short, competitions: [competition] });
    }
  };
  add(NBA, "nba");
  add(EUROLEAGUE, "euroleague");
  add(BETCLIC_ELITE, "betclic-elite");
  return [...byName.values()];
}

/** Toutes les équipes proposées dans l'autocomplétion (une équipe peut jouer plusieurs compétitions). */
export const HOME_TEAMS: HomeTeam[] = buildTeams();

/** Programme fictif d'une journée, vu vers 20 h 15 (heure de Paris) : la NBA de la nuit est terminée, l'Europe joue. */
export const TODAY_MATCHES: TodayMatch[] = [
  // NBA — nuit précédente (heure de Paris)
  { id: "nba-1", competition: "nba", time: "01:00", home: "New York Knicks", away: "Boston Celtics", status: "finished", homeScore: 112, awayScore: 108, homeWinProb: 54 },
  { id: "nba-2", competition: "nba", time: "01:00", home: "Orlando Magic", away: "Miami Heat", status: "finished", homeScore: 99, awayScore: 104, homeWinProb: 61 },
  { id: "nba-3", competition: "nba", time: "01:30", home: "Cleveland Cavaliers", away: "Detroit Pistons", status: "finished", homeScore: 121, awayScore: 109, homeWinProb: 67 },
  { id: "nba-4", competition: "nba", time: "02:00", home: "Oklahoma City Thunder", away: "Denver Nuggets", status: "finished", homeScore: 118, awayScore: 115, homeWinProb: 63 },
  { id: "nba-5", competition: "nba", time: "02:30", home: "San Antonio Spurs", away: "Houston Rockets", status: "finished", homeScore: 103, awayScore: 111, homeWinProb: 48 },
  { id: "nba-6", competition: "nba", time: "04:00", home: "Golden State Warriors", away: "Los Angeles Lakers", status: "finished", homeScore: 124, awayScore: 119, homeWinProb: 52 },
  { id: "nba-7", competition: "nba", time: "04:30", home: "Sacramento Kings", away: "Minnesota Timberwolves", status: "finished", homeScore: 97, awayScore: 106, homeWinProb: 38 },

  // EuroLeague — soirée en cours
  { id: "el-1", competition: "euroleague", time: "18:30", home: "Anadolu Efes", away: "Olympiacos", status: "finished", homeScore: 79, awayScore: 84, homeWinProb: 44 },
  { id: "el-2", competition: "euroleague", time: "19:00", home: "Žalgiris Kaunas", away: "Bayern Munich", status: "live", clock: "Q4 02:18", homeScore: 74, awayScore: 70, homeWinProb: 58 },
  { id: "el-3", competition: "euroleague", time: "20:00", home: "Paris Basketball", away: "Real Madrid", status: "live", clock: "Q1 03:51", homeScore: 14, awayScore: 19, homeWinProb: 47 },
  { id: "el-4", competition: "euroleague", time: "20:30", home: "Olimpia Milano", away: "AS Monaco", status: "scheduled", homeWinProb: 42 },
  { id: "el-5", competition: "euroleague", time: "20:45", home: "FC Barcelona", away: "Fenerbahçe Beko", status: "scheduled", homeWinProb: 51 },

  // Betclic Élite
  { id: "be-1", competition: "betclic-elite", time: "19:00", home: "Cholet Basket", away: "Le Mans Sarthe Basket", status: "live", clock: "Q4 06:40", homeScore: 68, awayScore: 71, homeWinProb: 55 },
  { id: "be-2", competition: "betclic-elite", time: "20:00", home: "JL Bourg", away: "SIG Strasbourg", status: "live", clock: "Q1 01:12", homeScore: 22, awayScore: 17, homeWinProb: 64 },
  { id: "be-3", competition: "betclic-elite", time: "20:00", home: "Limoges CSP", away: "Nanterre 92", status: "live", clock: "Mi-temps", homeScore: 41, awayScore: 38, homeWinProb: 57 },
  { id: "be-4", competition: "betclic-elite", time: "20:30", home: "BCM Gravelines-Dunkerque", away: "LDLC ASVEL", status: "scheduled", homeWinProb: 36 },
];
