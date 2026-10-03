import { createRng } from "./rng";
import { LEAGUES } from "./teams";
import type { AnalysisData, AnalysisResult, Factor, Fixture, H2HGame, StatLine, TeamSheet } from "./types";

/** Φ(x) approchée par une logistique. */
function normalCdf(x: number): number {
  return 1 / (1 + Math.exp(-1.702 * x));
}

function pct(v: number): number {
  return Math.round(v * 1000) / 10;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function toScore(diff: number, scale: number): { home: number; away: number } {
  // diff > 0 favorise l'équipe à domicile ; scores symétriques autour de 50.
  const h = clamp(50 + (diff / scale) * 50, 8, 92);
  return { home: Math.round(h), away: Math.round(100 - h) };
}

function edgeOf(home: number, away: number, tolerance = 6): Factor["edge"] {
  if (Math.abs(home - away) <= tolerance) return "even";
  return home > away ? "home" : "away";
}

function wins(form: Array<"V" | "D">): number {
  return form.filter((r) => r === "V").length;
}

function injuryPenalty(sheet: TeamSheet): number {
  return sheet.injuries.reduce((acc, inj) => {
    const base = inj.impact === "fort" ? 3 : inj.impact === "modéré" ? 1.6 : 0.6;
    const factor = inj.status === "absent" ? 1 : inj.status === "incertain" ? 0.6 : 0.35;
    return acc + base * factor;
  }, 0);
}

/** Confrontations directes fictives (fournisseur mock). */
export function generateH2H(fixture: Fixture): H2HGame[] {
  const ids = [fixture.home.id, fixture.away.id].sort();
  const rng = createRng(`${ids.join("|")}:h2h`);
  const league = LEAGUES[fixture.league];
  const games: H2HGame[] = [];
  const base = new Date(fixture.tipoff).getTime();
  for (let i = 0; i < 5; i++) {
    const homeIsFixtureHome = i % 2 === 0;
    const home = homeIsFixtureHome ? fixture.home : fixture.away;
    const away = homeIsFixtureHome ? fixture.away : fixture.home;
    const pace = (home.pace + away.pace) / 2;
    const expHome = (pace * (home.off + away.def)) / 200 + league.homeAdvantage / 2;
    const expAway = (pace * (away.off + home.def)) / 200 - league.homeAdvantage / 2;
    const daysAgo = 40 + i * 95 + rng.int(-10, 10);
    games.push({
      date: new Date(base - daysAgo * 86_400_000).toISOString(),
      homeTeamId: home.id,
      awayTeamId: away.id,
      homeScore: Math.round(expHome + rng.gauss(0, 8)),
      awayScore: Math.round(expAway + rng.gauss(0, 8)),
    });
  }
  return games;
}

function h2hWins(games: H2HGame[], teamId: string): number {
  return games.filter((g) => (g.homeTeamId === teamId ? g.homeScore > g.awayScore : g.awayScore > g.homeScore)).length;
}

function recordPct(r: { wins: number; losses: number }): number {
  const total = r.wins + r.losses;
  return total === 0 ? 0.5 : r.wins / total;
}

/** Analyse complète d'un match à partir des fiches des deux équipes. */
export function analyzeFixture(fixture: Fixture, data: AnalysisData, now: Date = new Date()): AnalysisResult {
  const league = LEAGUES[fixture.league];
  const { home, away, h2h } = data;
  const rng = createRng(`${fixture.id}:analysis`);

  const homeForm = wins(home.form);
  const awayForm = wins(away.form);
  const homeH2H = h2hWins(h2h, fixture.home.id);
  const awayH2H = h2h.length - homeH2H;

  // Marge attendue (domicile − extérieur), en points.
  const netDiff = (home.off - home.def - (away.off - away.def)) * (((home.pace + away.pace) / 2) / 100);
  const formAdj = (homeForm - awayForm) * 0.7;
  const venueAdj = league.homeAdvantage + (recordPct(home.homeRecord) - recordPct(away.awayRecord)) * 2.5;
  const fatigueAdj = (away.backToBack ? 1.4 : 0) - (home.backToBack ? 1.4 : 0) + clamp(home.restDays - away.restDays, -2, 2) * 0.3;
  const injuryAdj = injuryPenalty(away) - injuryPenalty(home);
  const h2hAdj = (homeH2H - awayH2H) * 0.25;
  const margin = netDiff * 0.55 + formAdj + venueAdj + fatigueAdj + injuryAdj + h2hAdj;

  const pHome = clamp(normalCdf(margin / league.marginSigma), 0.05, 0.95);
  const pAway = 1 - pHome;

  const pace = (home.pace + away.pace) / 2;
  const projHome = (pace * (home.off + away.def)) / 200 + margin / 2;
  const projAway = (pace * (away.off + home.def)) / 200 - margin / 2;
  const projectedScore = {
    home: Math.round(projHome),
    away: Math.round(projAway),
    total: Math.round(projHome + projAway),
    spread: Math.round((projHome - projAway) * 2) / 2,
  };

  const factors: Factor[] = [
    (() => {
      const s = toScore(homeForm - awayForm, 5);
      return {
        key: "forme",
        label: "Forme récente",
        ...s,
        edge: edgeOf(s.home, s.away),
        note: `${fixture.home.short} ${homeForm} V sur 5 · ${fixture.away.short} ${awayForm} V sur 5`,
      } satisfies Factor;
    })(),
    (() => {
      const s = toScore(recordPct(home.homeRecord) - recordPct(away.awayRecord), 1.1);
      return {
        key: "terrain",
        label: "Domicile / extérieur",
        ...s,
        edge: edgeOf(s.home, s.away),
        note: `${fixture.home.short} ${home.homeRecord.wins}-${home.homeRecord.losses} à domicile · ${fixture.away.short} ${away.awayRecord.wins}-${away.awayRecord.losses} à l'extérieur`,
      } satisfies Factor;
    })(),
    (() => {
      const s = toScore(homeH2H - awayH2H, 8);
      return {
        key: "h2h",
        label: "Confrontations directes",
        ...s,
        edge: edgeOf(s.home, s.away),
        note: h2h.length === 0 ? "Aucune confrontation récente connue" : `${homeH2H} succès ${fixture.home.short} · ${awayH2H} succès ${fixture.away.short} sur les ${h2h.length} derniers duels`,
      } satisfies Factor;
    })(),
    (() => {
      const s = toScore(home.off - away.off, 10);
      return {
        key: "attaque",
        label: "Attaque",
        ...s,
        edge: edgeOf(s.home, s.away),
        note: `${home.off.toFixed(1)} vs ${away.off.toFixed(1)} points pour 100 possessions`,
      } satisfies Factor;
    })(),
    (() => {
      const s = toScore(away.def - home.def, 10);
      return {
        key: "defense",
        label: "Défense",
        ...s,
        edge: edgeOf(s.home, s.away),
        note: `${home.def.toFixed(1)} vs ${away.def.toFixed(1)} points concédés pour 100 possessions`,
      } satisfies Factor;
    })(),
    (() => {
      // Le rythme profite à l'équipe la plus efficace en attaque si le match s'emballe.
      const fast = pace > league.avgPace + 1;
      const slow = pace < league.avgPace - 1;
      const better = home.off - home.def > away.off - away.def ? 1 : -1;
      const s = toScore(fast ? better * 0.8 : slow ? -better * 0.4 : 0, 2);
      return {
        key: "rythme",
        label: "Rythme",
        ...s,
        edge: edgeOf(s.home, s.away),
        note: `${pace.toFixed(1)} possessions attendues (${fast ? "rythme élevé" : slow ? "rythme lent" : "rythme moyen"} pour la ligue)`,
      } satisfies Factor;
    })(),
    (() => {
      const s = toScore(fatigueAdj, 2.5);
      const fmt = (sh: TeamSheet) => (sh.backToBack ? "2e match en 2 soirs" : `${sh.restDays} j de repos`);
      return {
        key: "fatigue",
        label: "Fatigue",
        ...s,
        edge: edgeOf(s.home, s.away),
        note: `${fixture.home.short} ${fmt(home)} · ${fixture.away.short} ${fmt(away)}`,
      } satisfies Factor;
    })(),
    (() => {
      const s = toScore(injuryAdj, 5);
      const fmt = (sh: TeamSheet) => (sh.injuries.length === 0 ? "effectif complet" : `${sh.injuries.length} joueur${sh.injuries.length > 1 ? "s" : ""} concerné${sh.injuries.length > 1 ? "s" : ""}`);
      return {
        key: "blessures",
        label: "Blessures",
        ...s,
        edge: edgeOf(s.home, s.away),
        note: `${fixture.home.short} ${fmt(home)} · ${fixture.away.short} ${fmt(away)}`,
      } satisfies Factor;
    })(),
  ];

  const keyStats: StatLine[] = [
    { key: "off", label: "Rating offensif", home: home.off, away: away.off, unit: "num", betterIs: "high" },
    { key: "def", label: "Rating défensif", home: home.def, away: away.def, unit: "num", betterIs: "low" },
    { key: "pace", label: "Possessions / match", home: home.pace, away: away.pace, unit: "num", betterIs: "high" },
    { key: "efg", label: "eFG %", home: home.efg, away: away.efg, unit: "pct", betterIs: "high" },
    { key: "three", label: "3 points %", home: home.threePct, away: away.threePct, unit: "pct", betterIs: "high" },
    { key: "tov", label: "Balles perdues %", home: home.tov, away: away.tov, unit: "pct", betterIs: "low" },
  ];
  const advanced: StatLine[] = [
    { key: "orb", label: "Rebonds offensifs %", home: home.orb, away: away.orb, unit: "pct", betterIs: "high" },
    { key: "ftr", label: "Taux de lancers francs", home: home.ftr, away: away.ftr, unit: "pct", betterIs: "high" },
    { key: "bench", label: "Points du banc", home: home.benchPoints, away: away.benchPoints, unit: "pts", betterIs: "high" },
    { key: "clutch", label: "Net rating « clutch »", home: home.clutchNet, away: away.clutchNet, unit: "num", betterIs: "high" },
  ];

  // Détecteur de value : cotes réelles si connues, sinon marché fictif (probas biaisées + marge).
  let impliedHome: number;
  let impliedAway: number;
  if (data.marketOdds && data.marketOdds.home > 1 && data.marketOdds.away > 1) {
    impliedHome = 1 / data.marketOdds.home;
    impliedAway = 1 / data.marketOdds.away;
  } else {
    const bias = rng.range(-0.045, 0.045);
    const margin_bk = 1.06;
    impliedHome = clamp((pHome + bias) * margin_bk, 0.08, 0.98);
    impliedAway = clamp((pAway - bias) * margin_bk, 0.08, 0.98);
  }
  const market = { home: Math.round((1 / impliedHome) * 100) / 100, away: Math.round((1 / impliedAway) * 100) / 100 };
  const fair = { home: Math.round((1 / pHome) * 100) / 100, away: Math.round((1 / pAway) * 100) / 100 };
  const edge = { home: pct(pHome - impliedHome), away: pct(pAway - impliedAway) };
  const pick: "home" | "away" | null = edge.home >= 3 ? "home" : edge.away >= 3 ? "away" : null;

  let confidence = Math.round(52 + Math.abs(pHome - 0.5) * 85);
  const favorite = pHome >= 0.5 ? home : away;
  if (favorite.injuries.some((i) => i.status === "incertain")) confidence -= 5;
  confidence = clamp(confidence, 50, 93);

  let live: AnalysisResult["live"] = null;
  if (fixture.status === "live" && fixture.live) {
    const remaining = Math.max(0.02, 1 - fixture.live.progress);
    const currentMargin = fixture.live.home - fixture.live.away;
    const expectedRest = margin * remaining;
    const sigmaRest = league.marginSigma * Math.sqrt(remaining);
    const winProbHome = clamp(normalCdf((currentMargin + expectedRest) / sigmaRest), 0.02, 0.98);
    live = { ...fixture.live, winProbHome: pct(winProbHome) };
  }

  const { summary, bullets } = writeSummary({ fixture, pHome, factors, projectedScore, home, away, rng, confidence, pick, edge });

  return {
    version: 1,
    generatedAt: now.toISOString(),
    match: {
      id: fixture.id,
      league: fixture.league,
      leagueName: league.name,
      home: { id: fixture.home.id, name: fixture.home.name, short: fixture.home.short, city: fixture.home.city },
      away: { id: fixture.away.id, name: fixture.away.name, short: fixture.away.short, city: fixture.away.city },
      venue: fixture.venue,
      phase: fixture.phase,
      tipoff: fixture.tipoff,
      status: fixture.status,
    },
    probabilities: { home: pct(pHome), away: pct(pAway), confidence },
    projectedScore,
    factors,
    form: { home: home.form, away: away.form },
    h2h,
    keyStats,
    advanced,
    injuries: { home: home.injuries, away: away.injuries },
    value: { market, fair, edge, pick },
    live,
    summary,
    bullets,
    source: data.source,
    notes: data.notes,
  };
}

type SummaryInput = {
  fixture: Fixture;
  pHome: number;
  factors: Factor[];
  projectedScore: AnalysisResult["projectedScore"];
  home: TeamSheet;
  away: TeamSheet;
  rng: ReturnType<typeof createRng>;
  confidence: number;
  pick: "home" | "away" | null;
  edge: { home: number; away: number };
};

/**
 * Rédaction automatique du résumé. Le texte est assemblé à partir de gabarits
 * et des facteurs les plus discriminants ; il est donc toujours cohérent avec
 * les chiffres affichés.
 */
function writeSummary(input: SummaryInput): { summary: string; bullets: string[] } {
  const { fixture, pHome, factors, projectedScore, home, away, rng, confidence, pick, edge } = input;
  const favHome = pHome >= 0.5;
  const fav = favHome ? fixture.home : fixture.away;
  const dog = favHome ? fixture.away : fixture.home;
  const pFav = Math.round((favHome ? pHome : 1 - pHome) * 100);
  const tight = Math.abs(pHome - 0.5) < 0.08;

  const openers = tight
    ? [
        `Duel très équilibré entre ${fixture.home.name} et ${fixture.away.name} : notre modèle ne donne qu'un léger avantage à ${fav.name} (${pFav} %).`,
        `${fixture.home.name} et ${fixture.away.name} se tiennent de près. ${fav.name} ressort favori d'un souffle, à ${pFav} %.`,
      ]
    : [
        `${fav.name} part favori face à ${dog.name} : ${pFav} % de chances de l'emporter selon notre modèle.`,
        `Notre modèle donne ${fav.name} vainqueur dans ${pFav} % des scénarios simulés contre ${dog.name}.`,
        `Avantage ${fav.name}. En croisant les huit facteurs, l'équipe l'emporte dans ${pFav} % des cas face à ${dog.name}.`,
      ];

  const ranked = [...factors].sort((a, b) => Math.abs(b.home - b.away) - Math.abs(a.home - a.away));
  const explain = (f: Factor): string | null => {
    if (f.edge === "even") return null;
    const team = f.edge === "home" ? fixture.home : fixture.away;
    const sheet = f.edge === "home" ? home : away;
    const other = f.edge === "home" ? away : home;
    switch (f.key) {
      case "forme":
        return `${team.name} arrive lancé avec ${wins(sheet.form)} succès sur ses 5 dernières sorties.`;
      case "terrain":
        return f.edge === "home"
          ? `À domicile, ${team.name} affiche un bilan de ${sheet.homeRecord.wins}-${sheet.homeRecord.losses}, un vrai point d'appui.`
          : `${team.name} voyage bien cette saison (${sheet.awayRecord.wins}-${sheet.awayRecord.losses} à l'extérieur), ce qui gomme une partie de l'avantage du terrain.`;
      case "h2h":
        return `Dans l'historique récent, ${team.name} a remporté la majorité des dernières confrontations directes.`;
      case "attaque":
        return `Avec ${sheet.off.toFixed(1)} points pour 100 possessions, l'attaque de ${team.name} est nettement plus efficace que celle de son adversaire (${other.off.toFixed(1)}).`;
      case "defense":
        return `La défense de ${team.name} ne concède que ${sheet.def.toFixed(1)} points pour 100 possessions, contre ${other.def.toFixed(1)} en face.`;
      case "rythme":
        return `Le rythme attendu (${((home.pace + away.pace) / 2).toFixed(0)} possessions) devrait servir ${team.name}, plus à l'aise quand le match s'accélère.`;
      case "fatigue":
        return other.backToBack
          ? `${other === home ? fixture.home.name : fixture.away.name} enchaîne un deuxième match en deux soirs, un handicap que ${team.name} peut exploiter en fin de rencontre.`
          : `${team.name} profite de ${sheet.restDays} jours de repos, contre ${other.restDays} pour son adversaire.`;
      case "blessures": {
        const inj = other.injuries[0];
        return inj
          ? `L'infirmerie pèse en face : ${inj.role.toLowerCase()} (${inj.issue}) est ${inj.status}, ce qui fragilise la rotation adverse.`
          : `${team.name} aborde la rencontre avec un effectif plus complet.`;
      }
    }
  };
  const reasons = ranked.map(explain).filter((s): s is string => Boolean(s)).slice(0, 3);
  if (reasons.length === 0) reasons.push("Aucun facteur ne se détache nettement : la rencontre devrait se jouer sur des détails.");

  const scoreLine = `Score projeté : ${fixture.home.name} ${projectedScore.home} – ${projectedScore.away} ${fixture.away.name}, soit un total autour de ${projectedScore.total} points.`;
  const closing = tight
    ? "Scénario le plus probable : un écart inférieur à cinq points, à surveiller jusqu'au dernier quart-temps."
    : confidence >= 75
      ? "Indice de confiance élevé : les signaux convergent dans la même direction."
      : "Indice de confiance modéré : quelques signaux restent contradictoires.";

  const summary = [rng.pick(openers), ...reasons, scoreLine, closing].join(" ");

  const key = ranked[0];
  const keyTeam = key.edge === "home" ? fixture.home.short : key.edge === "away" ? fixture.away.short : "équilibre";
  const bullets = [
    `Favori : ${fav.name} (${pFav} %)`,
    `Facteur clé : ${key.label.toLowerCase()} — avantage ${keyTeam}`,
    `Total projeté : ${projectedScore.total} points`,
  ];
  if (pick) {
    const team = pick === "home" ? fixture.home.short : fixture.away.short;
    bullets.push(`Value détectée sur ${team} : +${(pick === "home" ? edge.home : edge.away).toFixed(1)} pts vs marché`);
  }
  return { summary, bullets };
}
