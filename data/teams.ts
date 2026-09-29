import type { ID, Team } from "@/types";

/**
 * Équipe + indice de force (0-100) utilisé uniquement par le simulateur de données mockées.
 * L'indice n'est jamais exposé dans l'UI.
 */
export interface TeamSeed extends Team {
  strength: number;
}

type ClubExtra = Partial<Pick<Team, "arena" | "coach" | "founded" | "groups">>;

function club(
  id: ID,
  name: string,
  shortName: string,
  abbreviation: string,
  city: string,
  country: string,
  competitionIds: ID[],
  primary: string,
  secondary: string,
  strength: number,
  extra: ClubExtra = {},
): TeamSeed {
  return {
    id,
    name,
    shortName,
    abbreviation,
    city,
    country,
    kind: "club",
    competitionIds,
    colors: { primary, secondary },
    strength,
    ...extra,
  };
}

function nba(
  id: ID,
  name: string,
  shortName: string,
  abbreviation: string,
  city: string,
  conference: "Est" | "Ouest",
  primary: string,
  secondary: string,
  strength: number,
  arena: string,
  coach: string,
): TeamSeed {
  return club(id, name, shortName, abbreviation, city, "USA", ["nba"], primary, secondary, strength, {
    arena,
    coach,
    groups: { nba: conference },
  });
}

function national(
  id: ID,
  name: string,
  abbreviation: string,
  country: string,
  primary: string,
  secondary: string,
  strength: number,
  worldCupGroup: string,
  olympicGroup: string,
  coach?: string,
): TeamSeed {
  return {
    id,
    name,
    shortName: name,
    abbreviation,
    city: "",
    country,
    kind: "national",
    competitionIds: ["fiba-world-cup", "olympics"],
    groups: { "fiba-world-cup": worldCupGroup, olympics: olympicGroup },
    colors: { primary, secondary },
    strength,
    coach,
  };
}

// ---------------------------------------------------------------------------
// NBA
// ---------------------------------------------------------------------------
const nbaTeams: TeamSeed[] = [
  nba("atl", "Atlanta Hawks", "Hawks", "ATL", "Atlanta", "Est", "#C8102E", "#FDB927", 78, "State Farm Arena", "Quin Snyder"),
  nba("bos", "Boston Celtics", "Celtics", "BOS", "Boston", "Est", "#007A33", "#BA9653", 86, "TD Garden", "Joe Mazzulla"),
  nba("bkn", "Brooklyn Nets", "Nets", "BKN", "Brooklyn", "Est", "#000000", "#FFFFFF", 60, "Barclays Center", "Jordi Fernández"),
  nba("cha", "Charlotte Hornets", "Hornets", "CHA", "Charlotte", "Est", "#1D1160", "#00788C", 64, "Spectrum Center", "Charles Lee"),
  nba("chi", "Chicago Bulls", "Bulls", "CHI", "Chicago", "Est", "#CE1141", "#000000", 70, "United Center", "Billy Donovan"),
  nba("cle", "Cleveland Cavaliers", "Cavaliers", "CLE", "Cleveland", "Est", "#860038", "#FDBB30", 87, "Rocket Arena", "Kenny Atkinson"),
  nba("det", "Detroit Pistons", "Pistons", "DET", "Détroit", "Est", "#C8102E", "#1D42BA", 80, "Little Caesars Arena", "J.B. Bickerstaff"),
  nba("ind", "Indiana Pacers", "Pacers", "IND", "Indianapolis", "Est", "#002D62", "#FDBB30", 74, "Gainbridge Fieldhouse", "Rick Carlisle"),
  nba("mia", "Miami Heat", "Heat", "MIA", "Miami", "Est", "#98002E", "#F9A01B", 74, "Kaseya Center", "Erik Spoelstra"),
  nba("mil", "Milwaukee Bucks", "Bucks", "MIL", "Milwaukee", "Est", "#00471B", "#EEE1C6", 77, "Fiserv Forum", "Doc Rivers"),
  nba("nyk", "New York Knicks", "Knicks", "NYK", "New York", "Est", "#006BB6", "#F58426", 86, "Madison Square Garden", "Mike Brown"),
  nba("orl", "Orlando Magic", "Magic", "ORL", "Orlando", "Est", "#0077C0", "#C4CED4", 80, "Kia Center", "Jamahl Mosley"),
  nba("phi", "Philadelphia 76ers", "76ers", "PHI", "Philadelphie", "Est", "#006BB6", "#ED174C", 77, "Xfinity Mobile Arena", "Nick Nurse"),
  nba("tor", "Toronto Raptors", "Raptors", "TOR", "Toronto", "Est", "#CE1141", "#000000", 72, "Scotiabank Arena", "Darko Rajaković"),
  nba("was", "Washington Wizards", "Wizards", "WAS", "Washington", "Est", "#002B5C", "#E31837", 60, "Capital One Arena", "Brian Keefe"),
  nba("dal", "Dallas Mavericks", "Mavericks", "DAL", "Dallas", "Ouest", "#00538C", "#B8C4CA", 74, "American Airlines Center", "Jason Kidd"),
  nba("den", "Denver Nuggets", "Nuggets", "DEN", "Denver", "Ouest", "#0E2240", "#FEC524", 87, "Ball Arena", "David Adelman"),
  nba("gsw", "Golden State Warriors", "Warriors", "GSW", "San Francisco", "Ouest", "#1D428A", "#FFC72C", 78, "Chase Center", "Steve Kerr"),
  nba("hou", "Houston Rockets", "Rockets", "HOU", "Houston", "Ouest", "#CE1141", "#000000", 85, "Toyota Center", "Ime Udoka"),
  nba("lac", "Los Angeles Clippers", "Clippers", "LAC", "Los Angeles", "Ouest", "#C8102E", "#1D428A", 78, "Intuit Dome", "Tyronn Lue"),
  nba("lal", "Los Angeles Lakers", "Lakers", "LAL", "Los Angeles", "Ouest", "#552583", "#FDB927", 83, "Crypto.com Arena", "JJ Redick"),
  nba("mem", "Memphis Grizzlies", "Grizzlies", "MEM", "Memphis", "Ouest", "#5D76A9", "#12173F", 76, "FedExForum", "Tuomas Iisalo"),
  nba("min", "Minnesota Timberwolves", "Timberwolves", "MIN", "Minneapolis", "Ouest", "#0C2340", "#236192", 83, "Target Center", "Chris Finch"),
  nba("nop", "New Orleans Pelicans", "Pelicans", "NOP", "La Nouvelle-Orléans", "Ouest", "#0C2340", "#C8102E", 66, "Smoothie King Center", "Willie Green"),
  nba("okc", "Oklahoma City Thunder", "Thunder", "OKC", "Oklahoma City", "Ouest", "#007AC1", "#EF5133", 93, "Paycom Center", "Mark Daigneault"),
  nba("phx", "Phoenix Suns", "Suns", "PHX", "Phoenix", "Ouest", "#1D1160", "#E56020", 70, "Mortgage Matchup Center", "Jordan Ott"),
  nba("por", "Portland Trail Blazers", "Trail Blazers", "POR", "Portland", "Ouest", "#E03A3E", "#000000", 70, "Moda Center", "Tiago Splitter"),
  nba("sac", "Sacramento Kings", "Kings", "SAC", "Sacramento", "Ouest", "#5A2D81", "#63727A", 68, "Golden 1 Center", "Doug Christie"),
  nba("sas", "San Antonio Spurs", "Spurs", "SAS", "San Antonio", "Ouest", "#C4CED4", "#000000", 81, "Frost Bank Center", "Mitch Johnson"),
  nba("uta", "Utah Jazz", "Jazz", "UTA", "Salt Lake City", "Ouest", "#002B5C", "#F9A01B", 62, "Delta Center", "Will Hardy"),
];

// ---------------------------------------------------------------------------
// EuroLeague (dont clubs engagés aussi en championnat national)
// ---------------------------------------------------------------------------
const euroleagueTeams: TeamSeed[] = [
  club("real-madrid", "Real Madrid", "Real Madrid", "RMB", "Madrid", "ESP", ["euroleague", "liga-acb"], "#F5F5F5", "#C9A227", 88, { arena: "Movistar Arena", coach: "Sergio Scariolo", founded: 1931 }),
  club("barcelona", "FC Barcelone", "Barça", "FCB", "Barcelone", "ESP", ["euroleague", "liga-acb"], "#1B3D8F", "#A50044", 83, { arena: "Palau Blaugrana", coach: "Xavi Pascual", founded: 1926 }),
  club("baskonia", "Baskonia", "Baskonia", "BAS", "Vitoria-Gasteiz", "ESP", ["euroleague", "liga-acb"], "#0F3E9A", "#F5F5F5", 72, { arena: "Buesa Arena", coach: "Paolo Galbiati", founded: 1959 }),
  club("valencia", "Valencia Basket", "Valencia", "VBC", "Valence", "ESP", ["euroleague", "liga-acb"], "#F47B20", "#111111", 76, { arena: "Roig Arena", coach: "Pedro Martínez", founded: 1986 }),
  club("panathinaikos", "Panathinaïkos", "Panathinaïkos", "PAO", "Athènes", "GRE", ["euroleague"], "#0A7A3E", "#F5F5F5", 88, { arena: "OAKA", coach: "Ergin Ataman", founded: 1919 }),
  club("olympiacos", "Olympiakos", "Olympiakos", "OLY", "Le Pirée", "GRE", ["euroleague"], "#D42127", "#F5F5F5", 88, { arena: "Stade de la Paix et de l'Amitié", coach: "Georgios Bartzokas", founded: 1931 }),
  club("fenerbahce", "Fenerbahçe", "Fenerbahçe", "FEN", "Istanbul", "TUR", ["euroleague"], "#002E6D", "#FFD200", 87, { arena: "Ülker Sports Arena", coach: "Šarūnas Jasikevičius", founded: 1913 }),
  club("anadolu-efes", "Anadolu Efes", "Efes", "EFS", "Istanbul", "TUR", ["euroleague"], "#0A2D6E", "#F5F5F5", 80, { arena: "Basketbol Gelişim Merkezi", coach: "Igor Kokoškov", founded: 1976 }),
  club("bayern", "Bayern Munich", "Bayern", "BAY", "Munich", "GER", ["euroleague"], "#DC052D", "#F5F5F5", 78, { arena: "SAP Garden", coach: "Gordon Herbert", founded: 1946 }),
  club("monaco", "AS Monaco", "Monaco", "MON", "Monaco", "MCO", ["euroleague", "betclic-elite"], "#D2232A", "#F5F5F5", 85, { arena: "Salle Gaston-Médecin", coach: "Vassilis Spanoulis", founded: 1928 }),
  club("paris", "Paris Basketball", "Paris", "PRS", "Paris", "FRA", ["euroleague", "betclic-elite"], "#1D1D1B", "#F2C94C", 78, { arena: "Adidas Arena", coach: "Francesco Tabellini", founded: 2018 }),
  club("asvel", "LDLC ASVEL", "ASVEL", "ASV", "Villeurbanne", "FRA", ["euroleague", "betclic-elite"], "#2F2F2F", "#C9A227", 68, { arena: "LDLC Arena", coach: "Pierric Poupet", founded: 1948 }),
  club("zalgiris", "Žalgiris Kaunas", "Žalgiris", "ZAL", "Kaunas", "LTU", ["euroleague"], "#0F7B3F", "#F5F5F5", 76, { arena: "Žalgiris Arena", coach: "Tomas Masiulis", founded: 1944 }),
  club("partizan", "Partizan Belgrade", "Partizan", "PAR", "Belgrade", "SRB", ["euroleague"], "#111111", "#F5F5F5", 75, { arena: "Beogradska Arena", coach: "Željko Obradović", founded: 1945 }),
  club("crvena-zvezda", "Étoile Rouge de Belgrade", "Étoile Rouge", "CZV", "Belgrade", "SRB", ["euroleague"], "#E4002B", "#F5F5F5", 76, { arena: "Aleksandar Nikolić Hall", coach: "Ioannis Sfairopoulos", founded: 1945 }),
  club("olimpia-milano", "Olimpia Milan", "Milan", "MLN", "Milan", "ITA", ["euroleague", "lega-a"], "#C8102E", "#F5F5F5", 76, { arena: "Unipol Forum", coach: "Ettore Messina", founded: 1936 }),
  club("virtus-bologna", "Virtus Bologne", "Virtus", "VIR", "Bologne", "ITA", ["euroleague", "lega-a"], "#111111", "#F5F5F5", 74, { arena: "Virtus Arena", coach: "Duško Ivanović", founded: 1929 }),
  club("maccabi", "Maccabi Tel-Aviv", "Maccabi", "MTA", "Tel-Aviv", "ISR", ["euroleague"], "#FFD200", "#0033A0", 72, { arena: "Menora Mivtachim Arena", coach: "Oded Kattash", founded: 1932 }),
  club("hapoel-tel-aviv", "Hapoel Tel-Aviv", "Hapoel TA", "HTA", "Tel-Aviv", "ISR", ["euroleague"], "#E4002B", "#F5F5F5", 78, { arena: "Drive in Arena", coach: "Dimitris Itoudis", founded: 1935 }),
  club("dubai", "Dubai Basketball", "Dubai", "DUB", "Dubaï", "UAE", ["euroleague"], "#1F2937", "#D4AF37", 74, { arena: "Coca-Cola Arena", coach: "Jurica Golemac", founded: 2023 }),
];

// ---------------------------------------------------------------------------
// EuroCup
// ---------------------------------------------------------------------------
const eurocupTeams: TeamSeed[] = [
  club("jl-bourg", "JL Bourg-en-Bresse", "JL Bourg", "JLB", "Bourg-en-Bresse", "FRA", ["eurocup", "betclic-elite"], "#B71C1C", "#F5F5F5", 70, { arena: "Ekinox", coach: "Frédéric Fauthoux", founded: 1910 }),
  club("gran-canaria", "Dreamland Gran Canaria", "Gran Canaria", "GCA", "Las Palmas", "ESP", ["eurocup", "liga-acb"], "#FFD700", "#1E3A8A", 70, { arena: "Gran Canaria Arena", coach: "Jaka Lakovič", founded: 1963 }),
  club("joventut", "Joventut Badalone", "Joventut", "JOV", "Badalone", "ESP", ["eurocup", "liga-acb"], "#0E7A3C", "#111111", 68, { arena: "Palau Olímpic de Badalona", coach: "Daniel Miret", founded: 1930 }),
  club("hapoel-jerusalem", "Hapoel Jérusalem", "Hapoel Jérusalem", "HJE", "Jérusalem", "ISR", ["eurocup"], "#C8102E", "#111111", 66, { coach: "Yonatan Alon" }),
  club("turk-telekom", "Türk Telekom Ankara", "Türk Telekom", "TTA", "Ankara", "TUR", ["eurocup"], "#0A3D91", "#F5F5F5", 66, { coach: "Erdem Can" }),
  club("bahcesehir", "Bahçeşehir College", "Bahçeşehir", "BAH", "Istanbul", "TUR", ["eurocup"], "#1E3A8A", "#F5F5F5", 64, { coach: "Dejan Radonjić" }),
  club("cedevita-olimpija", "Cedevita Olimpija", "Olimpija", "CED", "Ljubljana", "SLO", ["eurocup"], "#F58220", "#0B6E4F", 62, { coach: "Zvezdan Mitrović" }),
  club("cluj", "U-BT Cluj-Napoca", "Cluj", "CLJ", "Cluj-Napoca", "ROU", ["eurocup"], "#111111", "#F5F5F5", 62, { coach: "Mihai Silvășan" }),
  club("ulm", "ratiopharm Ulm", "Ulm", "ULM", "Ulm", "GER", ["eurocup"], "#F58220", "#111111", 64, { coach: "Ty Harrelson" }),
  club("lietkabelis", "Lietkabelis Panevėžys", "Lietkabelis", "LIE", "Panevėžys", "LTU", ["eurocup"], "#0B3D91", "#F5F5F5", 58, { coach: "Nenad Čanak" }),
];

// ---------------------------------------------------------------------------
// Liga ACB (clubs non déjà listés)
// ---------------------------------------------------------------------------
const acbTeams: TeamSeed[] = [
  club("unicaja", "Unicaja Málaga", "Unicaja", "UNI", "Malaga", "ESP", ["liga-acb", "bcl"], "#0A6E3C", "#F5F5F5", 76, { arena: "Martín Carpena", coach: "Ibon Navarro", founded: 1977 }),
  club("tenerife", "La Laguna Tenerife", "Tenerife", "TEN", "San Cristóbal de La Laguna", "ESP", ["liga-acb", "bcl"], "#4B2E83", "#FFD700", 74, { arena: "Pabellón Santiago Martín", coach: "Txus Vidorreta", founded: 1939 }),
  club("bilbao", "Surne Bilbao Basket", "Bilbao", "BIL", "Bilbao", "ESP", ["liga-acb"], "#111111", "#E41F26", 62, { coach: "Jaume Ponsarnau" }),
  club("manresa", "Baxi Manresa", "Manresa", "MAN", "Manresa", "ESP", ["liga-acb"], "#C8102E", "#F5F5F5", 64, { coach: "Diego Ocampo" }),
  club("girona", "Bàsquet Girona", "Girona", "GIR", "Gérone", "ESP", ["liga-acb"], "#E31E24", "#F5F5F5", 60, { coach: "Moncho Fernández" }),
  club("murcia", "UCAM Murcia", "Murcia", "MUR", "Murcie", "ESP", ["liga-acb"], "#7A1E1E", "#FFD700", 68, { coach: "Sito Alonso" }),
  club("zaragoza", "Casademont Zaragoza", "Zaragoza", "ZAR", "Saragosse", "ESP", ["liga-acb"], "#B2181E", "#F5F5F5", 62, { coach: "Jesús Ramírez" }),
  club("breogan", "Río Breogán", "Breogán", "BRE", "Lugo", "ESP", ["liga-acb"], "#1B4F9C", "#F5F5F5", 60, { coach: "Luis Casimiro" }),
  club("andorra", "MoraBanc Andorra", "Andorra", "AND", "Andorre-la-Vieille", "AND", ["liga-acb"], "#0B3D91", "#F5F5F5", 58, { coach: "Joan Plaza" }),
  club("lleida", "Hiopos Lleida", "Lleida", "LLE", "Lérida", "ESP", ["liga-acb"], "#8A1C1C", "#F5F5F5", 56, { coach: "Gerard Encuentra" }),
  club("burgos", "San Pablo Burgos", "Burgos", "BUR", "Burgos", "ESP", ["liga-acb"], "#0E2A5C", "#F5F5F5", 55, { coach: "Bruno Savignani" }),
  club("granada", "Coviran Granada", "Granada", "GRA", "Grenade", "ESP", ["liga-acb"], "#C8102E", "#F5F5F5", 55, { coach: "Ramón Díaz" }),
];

// ---------------------------------------------------------------------------
// Betclic Élite (clubs non déjà listés)
// ---------------------------------------------------------------------------
const betclicTeams: TeamSeed[] = [
  club("le-mans", "Le Mans Sarthe Basket", "Le Mans", "LMS", "Le Mans", "FRA", ["betclic-elite", "bcl"], "#F58220", "#1D1D1B", 70, { arena: "Antarès", coach: "Guillaume Vizade", founded: 1939 }),
  club("cholet", "Cholet Basket", "Cholet", "CHO", "Cholet", "FRA", ["betclic-elite"], "#E4002B", "#F5F5F5", 64, { arena: "La Meilleraie", coach: "Fabrice Lefrançois" }),
  club("limoges", "Limoges CSP", "Limoges", "CSP", "Limoges", "FRA", ["betclic-elite"], "#0B7A3B", "#FFD200", 62, { arena: "Palais des Sports de Beaublanc", coach: "Jean-Marc Dupraz", founded: 1929 }),
  club("nanterre", "Nanterre 92", "Nanterre", "NAN", "Nanterre", "FRA", ["betclic-elite"], "#0A9E4A", "#F5F5F5", 66, { arena: "Palais des Sports Maurice-Thorez", coach: "Julien Mahé" }),
  club("dijon", "JDA Dijon", "Dijon", "DIJ", "Dijon", "FRA", ["betclic-elite"], "#C8102E", "#F5F5F5", 62, { arena: "Palais des Sports Jean-Michel Geoffroy", coach: "Laurent Legname" }),
  club("strasbourg", "SIG Strasbourg", "Strasbourg", "SIG", "Strasbourg", "FRA", ["betclic-elite"], "#E30613", "#F5F5F5", 64, { arena: "Rhénus Sport", coach: "Massimo Cancellieri" }),
  club("le-portel", "ESSM Le Portel", "Le Portel", "LPO", "Le Portel", "FRA", ["betclic-elite"], "#1A5CB8", "#F5F5F5", 56, { arena: "Le Chaudron", coach: "Éric Girard" }),
  club("gravelines", "BCM Gravelines-Dunkerque", "Gravelines", "GRV", "Gravelines", "FRA", ["betclic-elite"], "#F47920", "#003E7E", 60, { arena: "Sportica", coach: "Jean-Christophe Prat" }),
  club("chalon", "Élan Chalon", "Chalon", "ELC", "Chalon-sur-Saône", "FRA", ["betclic-elite"], "#C8102E", "#F5F5F5", 62, { arena: "Le Colisée", coach: "Elric Delord" }),
  club("nancy", "SLUC Nancy", "Nancy", "SLU", "Nancy", "FRA", ["betclic-elite"], "#BE1E2D", "#F5F5F5", 58, { arena: "Palais des Sports Jean Weille", coach: "Sylvain Lautié" }),
  club("saint-quentin", "SQBB Saint-Quentin", "Saint-Quentin", "SQB", "Saint-Quentin", "FRA", ["betclic-elite"], "#E30613", "#F5F5F5", 58, { arena: "Palais des Sports Pierre Ratte", coach: "Julien Mahé" }),
  club("boulazac", "Boulazac Basket Dordogne", "Boulazac", "BBD", "Boulazac", "FRA", ["betclic-elite"], "#3B8ED0", "#F5F5F5", 52, { arena: "Le Palio", coach: "Alexandre Ménard" }),
];

// ---------------------------------------------------------------------------
// « Autres » : Lega Serie A et Basketball Champions League
// ---------------------------------------------------------------------------
const otherTeams: TeamSeed[] = [
  club("trapani", "Trapani Shark", "Trapani", "TRA", "Trapani", "ITA", ["lega-a"], "#7B2CBF", "#F5F5F5", 66, { coach: "Jasmin Repeša" }),
  club("brescia", "Germani Brescia", "Brescia", "BSC", "Brescia", "ITA", ["lega-a"], "#0057B8", "#F5F5F5", 66, { coach: "Matteo Cotelli" }),
  club("venezia", "Reyer Venise", "Venise", "VEN", "Venise", "ITA", ["lega-a"], "#7A1F3D", "#F7C948", 64, { coach: "Neven Spahija" }),
  club("trento", "Dolomiti Energia Trente", "Trente", "TNT", "Trente", "ITA", ["lega-a"], "#1A1A1A", "#F5F5F5", 62, { coach: "Massimo Cancellieri" }),
  club("tortona", "Bertram Derthona Tortona", "Tortona", "DER", "Tortona", "ITA", ["lega-a"], "#111111", "#F5F5F5", 60, { coach: "Mario Fioretti" }),
  club("trieste", "Pallacanestro Trieste", "Trieste", "TRI", "Trieste", "ITA", ["lega-a"], "#C8102E", "#F5F5F5", 58, { coach: "Jamion Christian" }),
  club("aek", "AEK Athènes", "AEK", "AEK", "Athènes", "GRE", ["bcl"], "#FFD200", "#111111", 66, { coach: "Ilias Papatheodorou" }),
  club("galatasaray", "Galatasaray", "Galatasaray", "GAL", "Istanbul", "TUR", ["bcl"], "#FDB913", "#A90432", 68, { coach: "Yakup Sekizkök" }),
  club("rytas", "Rytas Vilnius", "Rytas", "RYT", "Vilnius", "LTU", ["bcl"], "#C8102E", "#111111", 62, { coach: "Giedrius Žibėnas" }),
  club("bonn", "Telekom Baskets Bonn", "Bonn", "BON", "Bonn", "GER", ["bcl"], "#E20074", "#F5F5F5", 60, { coach: "Roel Moors" }),
  club("tofas", "Tofaş Bursa", "Tofaş", "TOF", "Bursa", "TUR", ["bcl"], "#1F3A93", "#F5F5F5", 58, { coach: "Orhun Ene" }),
];

// ---------------------------------------------------------------------------
// Sélections nationales (Coupe du Monde FIBA 2027 — qualifications, JO 2028)
// ---------------------------------------------------------------------------
const nationalTeams: TeamSeed[] = [
  national("fra", "France", "FRA", "FRA", "#0B3B8C", "#F5F5F5", 88, "Groupe A", "Groupe A", "Frédéric Fauthoux"),
  national("esp", "Espagne", "ESP", "ESP", "#C8102E", "#FFD200", 82, "Groupe A", "Groupe C", "Chus Mateo"),
  national("ltu", "Lituanie", "LTU", "LTU", "#0E7A3C", "#FFD200", 82, "Groupe A", "Groupe C", "Rimas Kurtinaitis"),
  national("lat", "Lettonie", "LAT", "LAT", "#9E1B32", "#F5F5F5", 76, "Groupe A", "Groupe A", "Luca Banchi"),
  national("usa", "États-Unis", "USA", "USA", "#0A3161", "#B31942", 96, "Groupe B", "Groupe A", "Erik Spoelstra"),
  national("can", "Canada", "CAN", "CAN", "#D80621", "#F5F5F5", 87, "Groupe B", "Groupe B", "Gordon Herbert"),
  national("bra", "Brésil", "BRA", "BRA", "#0E7A3C", "#FFD200", 74, "Groupe B", "Groupe A", "Aleksandar Petrović"),
  national("aus", "Australie", "AUS", "AUS", "#0E5E3C", "#FFD200", 84, "Groupe B", "Groupe B", "Adam Caporn"),
  national("srb", "Serbie", "SRB", "SRB", "#C6363C", "#0C4076", 90, "Groupe C", "Groupe B", "Svetislav Pešić"),
  national("ger", "Allemagne", "GER", "GER", "#111111", "#FFCC00", 88, "Groupe C", "Groupe C", "Álex Mumbrú"),
  national("gre", "Grèce", "GRE", "GRE", "#0D5EAF", "#F5F5F5", 82, "Groupe C", "Groupe B", "Vassilis Spanoulis"),
  national("slo", "Slovénie", "SLO", "SLO", "#0B5FA5", "#F5F5F5", 80, "Groupe C", "Groupe C", "Aleksander Sekulić"),
];

export const teamSeeds: TeamSeed[] = [
  ...nbaTeams,
  ...euroleagueTeams,
  ...eurocupTeams,
  ...acbTeams,
  ...betclicTeams,
  ...otherTeams,
  ...nationalTeams,
];

/** Équipes exposées à l'app (sans l'indice de force). */
export const teams: Team[] = teamSeeds.map(({ strength: _strength, ...team }) => team);

export const teamById = new Map(teams.map((t) => [t.id, t]));

export const teamStrength: Record<ID, number> = Object.fromEntries(
  teamSeeds.map((t) => [t.id, t.strength]),
);

export function teamsInCompetition(competitionId: ID): Team[] {
  return teams.filter((t) => t.competitionIds.includes(competitionId));
}
