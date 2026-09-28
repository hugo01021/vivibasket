/**
 * Contrôle de cohérence du dataset mock : volumes, sommes de scores, timings.
 * Usage : npm run data:check
 */
import { getDataset } from "@/data/generated/dataset";
import { api } from "@/lib/api";
import { currentMatchDay } from "@/lib/time";

async function main() {
  const t0 = performance.now();
  const dataset = getDataset();
  const t1 = performance.now();
  console.log(`Journée de référence : ${dataset.referenceDay} (génération ${Math.round(t1 - t0)} ms)`);
  console.log(`Joueurs : ${dataset.players.length} (${dataset.players.filter((p) => p.isFeatured).length} saisis à la main)`);
  console.log(`Matchs : ${dataset.matches.length}`);
  const byStatus = new Map<string, number>();
  for (const m of dataset.matches) byStatus.set(m.status, (byStatus.get(m.status) ?? 0) + 1);
  console.log("  par statut :", Object.fromEntries(byStatus));
  const byComp = new Map<string, number>();
  for (const m of dataset.matches) byComp.set(m.competitionId, (byComp.get(m.competitionId) ?? 0) + 1);
  console.log("  par compétition :", Object.fromEntries(byComp));

  let errors = 0;
  for (const m of dataset.matches) {
    const bundle = dataset.stats.get(m.id);
    if (m.status === "scheduled") {
      if (bundle) { errors++; console.log("stats sur match à venir", m.id); }
      continue;
    }
    if (!bundle) { errors++; console.log("stats manquantes", m.id); continue; }
    const sumH = m.periods.reduce((a, p) => a + p.home, 0);
    const sumA = m.periods.reduce((a, p) => a + p.away, 0);
    if (sumH !== m.homeScore || sumA !== m.awayScore) { errors++; console.log("périodes ≠ score", m.id); }
    if (bundle.teamStats.home.points !== m.homeScore || bundle.teamStats.away.points !== m.awayScore) { errors++; console.log("box équipe ≠ score", m.id); }
    const ptsH = bundle.boxScore.home.reduce((a, l) => a + l.points, 0);
    const ptsA = bundle.boxScore.away.reduce((a, l) => a + l.points, 0);
    if (ptsH !== m.homeScore || ptsA !== m.awayScore) { errors++; console.log("box joueurs ≠ score", m.id, ptsH, m.homeScore, ptsA, m.awayScore); }
    const minH = bundle.boxScore.home.reduce((a, l) => a + l.minutes, 0);
    if (Math.abs(minH - bundle.elapsed * 5) > 1) { errors++; console.log("minutes incohérentes", m.id, minH, bundle.elapsed * 5); }
    for (const l of [...bundle.boxScore.home, ...bundle.boxScore.away]) {
      if (l.fieldGoals.made > l.fieldGoals.attempted || l.threePointers.made > l.threePointers.attempted || l.freeThrows.made > l.freeThrows.attempted) { errors++; console.log("tirs incohérents", m.id, l.playerId); }
      if (l.threePointers.attempted > l.fieldGoals.attempted) { errors++; console.log("3PA > FGA", m.id, l.playerId); }
    }
  }
  const teamsWithDoubleGames = new Set<string>();
  const seen = new Map<string, Set<string>>();
  for (const m of dataset.matches) {
    const day = m.date.slice(0, 10);
    for (const t of [m.homeTeamId, m.awayTeamId]) {
      const key = `${t}:${day}`;
      const set = seen.get(key) ?? new Set();
      set.add(m.id);
      seen.set(key, set);
      if (set.size > 1) teamsWithDoubleGames.add(key);
    }
  }
  console.log(`Équipes jouant deux fois le même jour : ${teamsWithDoubleGames.size}`);
  console.log(`Erreurs de cohérence : ${errors}`);

  const today = currentMatchDay();
  const live = await api.getLiveMatches();
  const todays = await api.getMatchesForDay(today);
  console.log(`En direct : ${live.length} · Aujourd'hui (${today}) : ${todays.length}`);
  for (const m of live) console.log(`  LIVE ${m.competitionId} ${m.homeTeamId} ${m.homeScore}-${m.awayScore} ${m.awayTeamId} ${m.clock?.periodLabel} ${m.clock?.timeRemaining}`);

  const t2 = performance.now();
  const details = await api.getMatch("nba-bos-nyk-live");
  const t3 = performance.now();
  console.log(`Détails BOS-NYK en ${Math.round(t3 - t2)} ms : ${details?.playByPlay.length} actions, ${details?.boxScore.home.length} lignes box score`);
  console.log("  Résumé IA :", details?.analysis.summary.slice(0, 120) + "…");
  console.log("  Dernières actions :", details?.playByPlay.slice(-3).map((e) => `${e.clock} ${e.description} (${e.homeScore}-${e.awayScore})`).join(" | "));
  const standings = await api.getStandings("nba");
  console.log("Classement NBA (5 premiers Est) :", standings.filter((r) => r.group === "Est").slice(0, 5).map((r) => `${r.rank}. ${r.teamId} ${r.wins}-${r.losses}`).join(", "));
  const leaders = await api.getLeaders({ competitionId: "nba", stat: "pointsPerGame", limit: 5 });
  console.log("Top scoreurs NBA :", leaders.map((l) => `${l.player.lastName} ${l.stats.pointsPerGame}`).join(", "));
  const elLeaders = await api.getLeaders({ competitionId: "euroleague", stat: "pointsPerGame", limit: 5 });
  console.log("Top scoreurs EL :", elLeaders.map((l) => `${l.player.lastName} ${l.stats.pointsPerGame}`).join(", "));
  const search = await api.search("wemb");
  console.log("Recherche 'wemb' :", search.map((r) => r.label).join(", "));
  const fra = await api.getTeamRoster("fra");
  console.log("Sélection France :", fra.map((p) => p.lastName).join(", "));
  const teamStats = await api.getTeamSeasonStats("real-madrid");
  console.log("Real Madrid :", teamStats.map((s) => `${s.competitionId} ${s.wins}-${s.losses} ORTG ${s.offensiveRating} DRTG ${s.defensiveRating} pace ${s.pace} forme ${s.formScore}`).join(" | "));
  if (errors > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
