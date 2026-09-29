import type { RoundSpec, ScheduleSpec } from "./generated/schedule";

const rounds = (offsets: number[], prefix = "Journée"): RoundSpec[] =>
  offsets.map((offset, i) => ({ offset, label: `${prefix} ${i + 1}` }));

/** Calendrier mock de chaque compétition, en jours relatifs à la journée courante. */
export const scheduleSpecs: ScheduleSpec[] = [
  {
    competitionId: "nba",
    mode: "daily",
    stage: "Saison régulière",
    daily: { from: -30, to: 14, minGames: 4, maxGames: 9 },
    times: ["25:00", "25:30", "26:00", "26:30", "27:00", "27:30", "28:00", "28:30"],
  },
  {
    competitionId: "euroleague",
    mode: "rounds",
    stage: "Saison régulière",
    spreadDays: 2,
    rounds: rounds([-43, -40, -36, -33, -29, -26, -22, -19, -15, -12, -8, -5, -1, 3, 6, 10, 13, 17, 20, 24, 27, 31, 34, 38]),
    times: ["18:45", "19:00", "20:00", "20:30", "20:45", "21:00"],
  },
  {
    competitionId: "eurocup",
    mode: "rounds",
    stage: "Saison régulière",
    spreadDays: 2,
    rounds: rounds([-43, -36, -29, -22, -15, -8, -1, 6, 13, 20, 27, 34]),
    times: ["18:00", "19:00", "20:00", "20:30"],
  },
  {
    competitionId: "liga-acb",
    mode: "rounds",
    stage: "Saison régulière",
    spreadDays: 2,
    rounds: rounds([-50, -43, -36, -29, -22, -15, -8, -1, 6, 13, 20, 27, 34, 41]),
    times: ["12:30", "17:00", "18:00", "19:00", "20:45"],
  },
  {
    competitionId: "betclic-elite",
    mode: "rounds",
    stage: "Saison régulière",
    spreadDays: 2,
    rounds: rounds([-50, -43, -36, -29, -22, -15, -8, -1, 6, 13, 20, 27, 34, 41]),
    times: ["16:00", "18:30", "19:00", "20:00"],
  },
  {
    competitionId: "lega-a",
    mode: "rounds",
    stage: "Saison régulière",
    spreadDays: 2,
    rounds: rounds([-43, -36, -29, -22, -15, -8, -1, 6, 13, 20, 27, 34]),
    times: ["17:00", "18:15", "19:30", "20:00"],
  },
  {
    competitionId: "bcl",
    mode: "groups",
    stage: "Phase de groupes",
    doubleLeg: true,
    rounds: rounds([-31, -24, -17, -10, -3, 4]),
    times: ["18:00", "19:00", "20:30"],
  },
  {
    competitionId: "fiba-world-cup",
    mode: "groups",
    stage: "Qualifications",
    doubleLeg: true,
    rounds: [
      { offset: -92, label: "Fenêtre 1 · J1" },
      { offset: -89, label: "Fenêtre 1 · J2" },
      { offset: -64, label: "Fenêtre 2 · J1" },
      { offset: -61, label: "Fenêtre 2 · J2" },
      { offset: 50, label: "Fenêtre 3 · J1" },
      { offset: 53, label: "Fenêtre 3 · J2" },
    ],
    times: ["17:00", "19:00", "20:30"],
  },
  {
    competitionId: "olympics",
    mode: "groups",
    stage: "Phase de groupes",
    rounds: rounds([665, 667, 669]),
    times: ["17:00", "20:00", "23:00"],
  },
];
