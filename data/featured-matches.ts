import type { ID } from "@/types";

/**
 * Matchs scénarisés autour de la journée courante : ils garantissent des matchs
 * en direct, des résultats et des affiches à venir quel que soit le moment où
 * l'app est ouverte. Le reste du calendrier est généré.
 *
 * `dayOffset` est relatif à la journée sportive courante (0 = aujourd'hui).
 * `time` est l'heure de Paris ; "25:30" signifie 01:30 le lendemain (NBA en nocturne).
 */
export interface FeaturedMatchSeed {
  id: ID;
  competitionId: ID;
  homeTeamId: ID;
  awayTeamId: ID;
  dayOffset: number;
  time: string;
  status: "live" | "finished" | "scheduled";
  /** Scores par période [domicile, extérieur], jusqu'à la période en cours. */
  periods?: Array<[number, number]>;
  clock?: { period: number; timeRemaining: string };
  round?: string;
  broadcast?: string;
  attendance?: number;
}

export const featuredMatches: FeaturedMatchSeed[] = [
  // --- En direct
  {
    id: "nba-bos-nyk-live",
    competitionId: "nba",
    homeTeamId: "bos",
    awayTeamId: "nyk",
    dayOffset: 0,
    time: "25:30",
    status: "live",
    periods: [[28, 26], [30, 25], [20, 23]],
    clock: { period: 3, timeRemaining: "05:42" },
    broadcast: "beIN Sports 1",
    attendance: 19156,
  },
  {
    id: "el-real-madrid-panathinaikos-live",
    competitionId: "euroleague",
    homeTeamId: "real-madrid",
    awayTeamId: "panathinaikos",
    dayOffset: 0,
    time: "20:45",
    status: "live",
    periods: [[22, 19], [18, 24], [21, 20], [18, 18]],
    clock: { period: 4, timeRemaining: "03:15" },
    broadcast: "La Chaîne L'Équipe",
    attendance: 12480,
  },
  {
    id: "be-monaco-paris-live",
    competitionId: "betclic-elite",
    homeTeamId: "monaco",
    awayTeamId: "paris",
    dayOffset: 0,
    time: "20:00",
    status: "live",
    periods: [[24, 21], [17, 17]],
    clock: { period: 2, timeRemaining: "06:30" },
    broadcast: "DAZN",
    attendance: 4360,
  },
  {
    id: "acb-barcelona-valencia-live",
    competitionId: "liga-acb",
    homeTeamId: "barcelona",
    awayTeamId: "valencia",
    dayOffset: 0,
    time: "20:30",
    status: "live",
    periods: [[18, 22]],
    clock: { period: 1, timeRemaining: "02:10" },
    attendance: 6980,
  },

  // --- Terminés (journée sportive d'hier)
  {
    id: "nba-den-okc-finished",
    competitionId: "nba",
    homeTeamId: "den",
    awayTeamId: "okc",
    dayOffset: -1,
    time: "28:00",
    status: "finished",
    periods: [[27, 31], [30, 28], [26, 33], [29, 26]],
    broadcast: "beIN Sports 1",
    attendance: 19842,
  },
  {
    id: "el-fenerbahce-olympiacos-finished",
    competitionId: "euroleague",
    homeTeamId: "fenerbahce",
    awayTeamId: "olympiacos",
    dayOffset: -1,
    time: "20:15",
    status: "finished",
    periods: [[21, 18], [19, 22], [24, 20], [21, 20]],
    attendance: 13200,
  },
  {
    id: "be-dijon-strasbourg-finished",
    competitionId: "betclic-elite",
    homeTeamId: "dijon",
    awayTeamId: "strasbourg",
    dayOffset: -1,
    time: "20:00",
    status: "finished",
    periods: [[19, 22], [20, 20], [18, 24], [21, 18]],
    attendance: 4120,
  },

  // --- À venir (aujourd'hui)
  { id: "nba-lal-gsw-scheduled", competitionId: "nba", homeTeamId: "lal", awayTeamId: "gsw", dayOffset: 0, time: "28:30", status: "scheduled", broadcast: "beIN Sports 1" },
  { id: "el-anadolu-efes-bayern-scheduled", competitionId: "euroleague", homeTeamId: "anadolu-efes", awayTeamId: "bayern", dayOffset: 0, time: "20:30", status: "scheduled" },
  { id: "el-zalgiris-virtus-scheduled", competitionId: "euroleague", homeTeamId: "zalgiris", awayTeamId: "virtus-bologna", dayOffset: 0, time: "19:00", status: "scheduled" },
  { id: "be-asvel-le-mans-scheduled", competitionId: "betclic-elite", homeTeamId: "asvel", awayTeamId: "le-mans", dayOffset: 0, time: "20:00", status: "scheduled", broadcast: "DAZN" },
  { id: "be-cholet-nanterre-scheduled", competitionId: "betclic-elite", homeTeamId: "cholet", awayTeamId: "nanterre", dayOffset: 0, time: "20:00", status: "scheduled" },
  { id: "acb-unicaja-baskonia-scheduled", competitionId: "liga-acb", homeTeamId: "unicaja", awayTeamId: "baskonia", dayOffset: 0, time: "20:45", status: "scheduled" },
  { id: "ec-jl-bourg-gran-canaria-scheduled", competitionId: "eurocup", homeTeamId: "jl-bourg", awayTeamId: "gran-canaria", dayOffset: 0, time: "20:00", status: "scheduled" },
];

export const featuredMatchById = new Map(featuredMatches.map((m) => [m.id, m]));
