import type { League, LeagueId, Team } from "./types";

export const LEAGUES: Record<LeagueId, League> = {
  nba: { id: "nba", name: "NBA", short: "NBA", homeAdvantage: 2.4, marginSigma: 12.5, avgRating: 114, avgPace: 99, minutes: 48 },
  euroleague: {
    id: "euroleague",
    name: "EuroLeague",
    short: "EL",
    homeAdvantage: 3.2,
    marginSigma: 10.5,
    avgRating: 113,
    avgPace: 72,
    minutes: 40,
  },
  betclic: {
    id: "betclic",
    name: "Betclic Élite",
    short: "BE",
    homeAdvantage: 3.6,
    marginSigma: 11,
    avgRating: 108,
    avgPace: 74,
    minutes: 40,
  },
};

export const LEAGUE_ORDER: LeagueId[] = ["nba", "euroleague", "betclic"];

type Row = [id: string, name: string, short: string, city: string, arena: string, off: number, def: number, pace: number, aliases?: string[]];

function build(league: LeagueId, rows: Row[]): Team[] {
  return rows.map(([id, name, short, city, arena, off, def, pace, aliases]) => ({
    id: `${league}-${id}`,
    league,
    name,
    short,
    city,
    arena,
    off,
    def,
    pace,
    aliases,
  }));
}

/* Ratings fictifs mais plausibles : points pour 100 possessions, possessions par match. */
const NBA = build("nba", [
  ["atl", "Atlanta Hawks", "ATL", "Atlanta", "State Farm Arena", 115.2, 115.8, 100.9, ["hawks"]],
  ["bos", "Boston Celtics", "BOS", "Boston", "TD Garden", 119.4, 110.6, 97.8, ["celtics"]],
  ["bkn", "Brooklyn Nets", "BKN", "Brooklyn", "Barclays Center", 109.1, 116.9, 98.4, ["nets"]],
  ["cha", "Charlotte Hornets", "CHA", "Charlotte", "Spectrum Center", 110.3, 117.4, 99.6, ["hornets"]],
  ["chi", "Chicago Bulls", "CHI", "Chicago", "United Center", 113.6, 116.2, 101.8, ["bulls"]],
  ["cle", "Cleveland Cavaliers", "CLE", "Cleveland", "Rocket Arena", 120.1, 111.9, 98.2, ["cavaliers", "cavs"]],
  ["dal", "Dallas Mavericks", "DAL", "Dallas", "American Airlines Center", 114.7, 113.5, 98.9, ["mavericks", "mavs"]],
  ["den", "Denver Nuggets", "DEN", "Denver", "Ball Arena", 118.9, 114.1, 98.6, ["nuggets"]],
  ["det", "Detroit Pistons", "DET", "Detroit", "Little Caesars Arena", 114.2, 112.4, 99.3, ["pistons"]],
  ["gsw", "Golden State Warriors", "GSW", "San Francisco", "Chase Center", 115.0, 111.8, 99.9, ["warriors", "golden state"]],
  ["hou", "Houston Rockets", "HOU", "Houston", "Toyota Center", 116.3, 110.9, 100.2, ["rockets"]],
  ["ind", "Indiana Pacers", "IND", "Indianapolis", "Gainbridge Fieldhouse", 117.2, 114.9, 101.5, ["pacers"]],
  ["lac", "Los Angeles Clippers", "LAC", "Los Angeles", "Intuit Dome", 114.9, 111.2, 97.6, ["clippers", "la clippers"]],
  ["lal", "Los Angeles Lakers", "LAL", "Los Angeles", "Crypto.com Arena", 116.1, 113.9, 98.7, ["lakers", "la lakers"]],
  ["mem", "Memphis Grizzlies", "MEM", "Memphis", "FedExForum", 117.0, 113.2, 103.1, ["grizzlies"]],
  ["mia", "Miami Heat", "MIA", "Miami", "Kaseya Center", 112.6, 112.1, 97.2, ["heat"]],
  ["mil", "Milwaukee Bucks", "MIL", "Milwaukee", "Fiserv Forum", 116.4, 112.9, 99.1, ["bucks"]],
  ["min", "Minnesota Timberwolves", "MIN", "Minneapolis", "Target Center", 115.6, 110.4, 97.9, ["timberwolves", "wolves"]],
  ["nop", "New Orleans Pelicans", "NOP", "La Nouvelle-Orléans", "Smoothie King Center", 111.8, 116.6, 99.8, ["pelicans"]],
  ["nyk", "New York Knicks", "NYK", "New York", "Madison Square Garden", 117.8, 113.0, 97.4, ["knicks"]],
  ["okc", "Oklahoma City Thunder", "OKC", "Oklahoma City", "Paycom Center", 119.9, 107.6, 100.4, ["thunder", "okc"]],
  ["orl", "Orlando Magic", "ORL", "Orlando", "Kia Center", 110.9, 109.8, 97.1, ["magic"]],
  ["phi", "Philadelphia 76ers", "PHI", "Philadelphie", "Xfinity Mobile Arena", 113.3, 114.4, 98.3, ["76ers", "sixers"]],
  ["phx", "Phoenix Suns", "PHX", "Phoenix", "Mortgage Matchup Center", 114.5, 115.6, 98.8, ["suns"]],
  ["por", "Portland Trail Blazers", "POR", "Portland", "Moda Center", 111.4, 115.3, 99.4, ["blazers", "trail blazers"]],
  ["sac", "Sacramento Kings", "SAC", "Sacramento", "Golden 1 Center", 115.3, 115.9, 99.7, ["kings"]],
  ["sas", "San Antonio Spurs", "SAS", "San Antonio", "Frost Bank Center", 114.0, 113.7, 100.6, ["spurs"]],
  ["tor", "Toronto Raptors", "TOR", "Toronto", "Scotiabank Arena", 112.0, 114.8, 98.1, ["raptors"]],
  ["uta", "Utah Jazz", "UTA", "Salt Lake City", "Delta Center", 111.1, 118.2, 100.3, ["jazz"]],
  ["was", "Washington Wizards", "WAS", "Washington", "Capital One Arena", 108.8, 118.9, 100.8, ["wizards"]],
]);

const EUROLEAGUE = build("euroleague", [
  ["efes", "Anadolu Efes", "EFS", "Istanbul", "Basketbol Gelişim Merkezi", 114.8, 111.9, 72.4, ["efes", "anadolu"]],
  ["monaco", "AS Monaco", "MON", "Monaco", "Salle Gaston Médecin", 117.5, 110.8, 71.2, ["monaco", "roca team"]],
  ["baskonia", "Baskonia", "BKN", "Vitoria-Gasteiz", "Fernando Buesa Arena", 112.1, 114.7, 74.6, ["baskonia", "vitoria"]],
  ["zvezda", "Étoile Rouge Belgrade", "CZV", "Belgrade", "Belgrade Arena", 111.6, 112.9, 72.1, ["etoile rouge", "crvena zvezda", "zvezda"]],
  ["dubai", "Dubaï Basketball", "DUB", "Dubaï", "Coca-Cola Arena", 110.9, 113.8, 73.0, ["dubai"]],
  ["milan", "Olimpia Milan", "MIL", "Milan", "Unipol Forum", 113.9, 112.6, 71.8, ["milan", "milano", "olimpia", "armani"]],
  ["barca", "FC Barcelone", "BAR", "Barcelone", "Palau Blaugrana", 116.2, 111.4, 72.8, ["barcelone", "barcelona", "barca", "fc barcelone"]],
  ["bayern", "Bayern Munich", "BAY", "Munich", "SAP Garden", 113.4, 112.2, 71.5, ["bayern", "munich"]],
  ["fener", "Fenerbahçe", "FEN", "Istanbul", "Ülker Sports Arena", 117.9, 109.6, 71.9, ["fenerbahce", "fener"]],
  ["hapoel", "Hapoel Tel-Aviv", "HAP", "Tel-Aviv", "Menora Mivtachim Arena", 112.8, 114.1, 74.2, ["hapoel"]],
  ["asvel", "ASVEL", "ASV", "Villeurbanne", "LDLC Arena", 110.4, 114.3, 72.6, ["asvel", "villeurbanne", "lyon"]],
  ["maccabi", "Maccabi Tel-Aviv", "MTA", "Tel-Aviv", "Menora Mivtachim Arena", 114.1, 115.2, 75.1, ["maccabi"]],
  ["oly", "Olympiakos", "OLY", "Le Pirée", "Stade de la Paix et de l'Amitié", 117.1, 108.9, 70.9, ["olympiakos", "olympiacos", "piree"]],
  ["pao", "Panathinaïkos", "PAO", "Athènes", "OAKA", 118.3, 110.2, 72.3, ["panathinaikos", "pao", "athenes"]],
  ["paris", "Paris Basketball", "PAR", "Paris", "Adidas Arena", 115.4, 113.6, 76.2, ["paris"]],
  ["partizan", "Partizan Belgrade", "PAR", "Belgrade", "Belgrade Arena", 113.2, 112.8, 73.4, ["partizan"]],
  ["real", "Real Madrid", "RMB", "Madrid", "Movistar Arena", 117.6, 109.9, 72.0, ["real", "madrid", "real madrid"]],
  ["valencia", "Valence Basket", "VAL", "Valence", "Roig Arena", 114.6, 113.1, 74.8, ["valence", "valencia"]],
  ["virtus", "Virtus Bologne", "VIR", "Bologne", "Virtus Arena", 111.9, 113.4, 71.6, ["virtus", "bologne", "bologna"]],
  ["zalgiris", "Žalgiris Kaunas", "ZAL", "Kaunas", "Žalgiris Arena", 113.7, 111.7, 71.3, ["zalgiris", "kaunas"]],
]);

const BETCLIC = build("betclic", [
  ["monaco", "AS Monaco", "MON", "Monaco", "Salle Gaston Médecin", 114.9, 103.2, 73.1, ["monaco", "roca team"]],
  ["asvel", "ASVEL", "ASV", "Villeurbanne", "LDLC Arena", 110.8, 105.6, 73.8, ["asvel", "villeurbanne", "lyon"]],
  ["paris", "Paris Basketball", "PAR", "Paris", "Adidas Arena", 112.6, 106.4, 76.9, ["paris"]],
  ["lemans", "Le Mans Sarthe Basket", "MSB", "Le Mans", "Antarès", 109.7, 106.1, 74.2, ["le mans", "msb"]],
  ["dijon", "JDA Dijon", "JDA", "Dijon", "Palais des Sports Jean-Michel Geoffroy", 107.9, 106.8, 72.6, ["dijon", "jda"]],
  ["cholet", "Cholet Basket", "CHO", "Cholet", "La Meilleraie", 108.4, 108.9, 75.3, ["cholet"]],
  ["nanterre", "Nanterre 92", "NAN", "Nanterre", "Palais des Sports Maurice Thorez", 107.2, 109.3, 74.0, ["nanterre"]],
  ["sig", "SIG Strasbourg", "SIG", "Strasbourg", "Rhénus Sport", 108.8, 107.7, 73.6, ["strasbourg", "sig"]],
  ["limoges", "Limoges CSP", "CSP", "Limoges", "Palais des Sports de Beaublanc", 106.1, 108.4, 72.9, ["limoges", "csp"]],
  ["chalon", "Élan Chalon", "ELA", "Chalon-sur-Saône", "Le Colisée", 108.1, 109.1, 75.8, ["chalon", "elan chalon"]],
  ["leportel", "ESSM Le Portel", "ESS", "Le Portel", "Le Chaudron", 104.6, 109.9, 72.2, ["le portel", "essm"]],
  ["boulazac", "Boulazac Basket Dordogne", "BBD", "Boulazac", "Le Palio", 105.3, 110.6, 73.3, ["boulazac"]],
  ["saintquentin", "Saint-Quentin Basket-Ball", "SQB", "Saint-Quentin", "Palais des Sports Pierre Ratte", 106.7, 108.2, 74.5, ["saint quentin", "sqbb"]],
  ["bourg", "JL Bourg", "JLB", "Bourg-en-Bresse", "Ekinox", 110.2, 106.9, 74.9, ["bourg", "jl bourg", "bourg en bresse"]],
  ["gravelines", "BCM Gravelines-Dunkerque", "BCM", "Gravelines", "Sportica", 106.4, 109.7, 73.9, ["gravelines", "dunkerque", "bcm"]],
  ["nancy", "SLUC Nancy", "SLU", "Nancy", "Palais des Sports Jean Weille", 107.6, 108.6, 74.4, ["nancy", "sluc"]],
]);

export const TEAMS: Team[] = [...NBA, ...EUROLEAGUE, ...BETCLIC];

const BY_ID = new Map(TEAMS.map((t) => [t.id, t]));

export function getTeam(id: string): Team | undefined {
  return BY_ID.get(id);
}

export function teamsOf(league: LeagueId): Team[] {
  return TEAMS.filter((t) => t.league === league);
}

export function isLeagueId(value: unknown): value is LeagueId {
  return value === "nba" || value === "euroleague" || value === "betclic";
}
