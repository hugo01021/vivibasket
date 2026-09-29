import type { ID } from "@/types";
import type { AnalysisOverride } from "./generated/analysis";

/**
 * Textes « Analyse IA » rédigés pour les matchs scénarisés.
 * Format identique à ce que renverra le LLM via /api/analysis.
 */
export const featuredAnalyses: Record<ID, AnalysisOverride> = {
  "nba-bos-nyk-live": {
    summary:
      "Boston mène 78-74 à mi-parcours du troisième quart-temps dans un match tendu contre New York. Les Celtics ont pris l'avantage grâce à un 12-2 en fin de deuxième quart, mais les Knicks recollent en attaquant le cercle et en dominant le rebond offensif.",
    insights: [
      {
        title: "Tatum enchaîne depuis la reprise",
        body: "Après une première mi-temps à 4/11, Jayson Tatum a inscrit 9 points en 4 minutes au retour des vestiaires, notamment sur pick-and-roll avec Queta.",
        tone: "positive",
        teamId: "bos",
      },
      {
        title: "Le rebond offensif, arme des Knicks",
        body: "New York capte 38 % de ses tirs manqués et a déjà marqué 14 points de seconde chance. Boston doit fermer la raquette lorsque Towns et Robinson sont ensemble.",
        tone: "negative",
        teamId: "bos",
      },
      {
        title: "Brunson gêné par la défense de White",
        body: "Jalen Brunson tourne à 5/14 : Derrick White le force à jouer côté gauche et Boston envoie une aide précoce sur ses pénétrations.",
        tone: "positive",
        teamId: "bos",
      },
      {
        title: "Le tempo favorise Boston",
        body: "Le match se joue à un rythme d'environ 101 possessions. Les Celtics marquent 1,18 point par possession en transition, un domaine où les Knicks encaissent 22 points ce soir.",
        tone: "neutral",
      },
    ],
  },
  "el-real-madrid-panathinaikos-live": {
    summary:
      "Le Panathinaïkos mène 81-79 à un peu plus de trois minutes de la fin au Movistar Arena. Le Real a mené de 8 points en début de troisième quart avant que Nunn et Sloukas n'enclenchent un 15-4 qui a renversé le match.",
    insights: [
      {
        title: "Kendrick Nunn en mode money-time",
        body: "11 points dans le quatrième quart-temps, dont deux tirs à 3 points face à Campazzo sur changement de défense. Le Real doit envisager une prise à deux sur ses pick-and-rolls.",
        tone: "negative",
        teamId: "real-madrid",
      },
      {
        title: "Tavares limité par les fautes",
        body: "Avec 4 fautes, Walter Tavares est sorti pendant six minutes : le Pana en a profité pour marquer 14 points dans la raquette sur cette séquence.",
        tone: "negative",
        teamId: "real-madrid",
      },
      {
        title: "Hezonja, le repère offensif madrilène",
        body: "Mario Hezonja en est à 21 points à 8/12 aux tirs. Le Real marque 1,31 point par possession lorsqu'il touche le ballon en attaque placée.",
        tone: "positive",
        teamId: "real-madrid",
      },
      {
        title: "Le match des lancers francs",
        body: "Le Pana est à 17/18 sur la ligne contre 12/19 pour Madrid : un différentiel de 6 points qui explique à lui seul l'écart actuel.",
        tone: "neutral",
      },
    ],
  },
  "be-monaco-paris-live": {
    summary:
      "Monaco mène 41-38 à la 14e minute d'un choc de haut de tableau très rythmé. Paris a répondu au 12-4 initial de la Roca Team par l'adresse extérieure de Nadir Hifi, auteur de 13 points en première période.",
    insights: [
      {
        title: "Hifi déjà chaud",
        body: "13 points à 5/7 aux tirs pour Nadir Hifi, dont 3/4 à 3 points. Monaco alterne Strazel et Okobo sur lui sans encore trouver la solution.",
        tone: "negative",
        teamId: "monaco",
      },
      {
        title: "Mike James en chef d'orchestre",
        body: "7 points et 5 passes : James provoque des aides et trouve Theis et Diallo dans les coins. Monaco tourne à 1,24 point par possession sur ses actions.",
        tone: "positive",
        teamId: "monaco",
      },
      {
        title: "Le rythme parisien",
        body: "Paris a tenté 8 tirs dans les 7 premières secondes de possession et marque 11 points en transition, sa marque de fabrique cette saison.",
        tone: "neutral",
        teamId: "paris",
      },
    ],
  },
  "nba-den-okc-finished": {
    summary:
      "Oklahoma City s'impose 118-112 à Denver au terme d'un match serré jusqu'aux dernières minutes. Shai Gilgeous-Alexander a inscrit 12 de ses 36 points dans le dernier quart-temps, tandis que Nikola Jokić a signé un nouveau triple-double dans la défaite.",
    insights: [
      {
        title: "SGA décisif dans le money-time",
        body: "Gilgeous-Alexander a marqué ou créé 18 des 22 derniers points du Thunder, en provoquant six lancers francs sur ses pénétrations.",
        tone: "positive",
        teamId: "okc",
      },
      {
        title: "Jokić monumental mais isolé",
        body: "31 points, 14 rebonds et 11 passes pour le Serbe, mais le reste du cinq de Denver a shooté à 15/41 (36,6 %).",
        tone: "negative",
        teamId: "den",
      },
      {
        title: "Le troisième quart-temps a fait la différence",
        body: "OKC a remporté la période 33-26 grâce à un 14-0 déclenché par la défense de Caruso et Dort sur Murray.",
        tone: "positive",
        teamId: "okc",
      },
      {
        title: "Denver punie sur les pertes de balle",
        body: "17 ballons perdus par les Nuggets, convertis en 24 points par le Thunder, l'écart final s'explique là.",
        tone: "negative",
        teamId: "den",
      },
    ],
  },
  "el-fenerbahce-olympiacos-finished": {
    summary:
      "Fenerbahçe a dominé l'Olympiakos 85-80 à Istanbul dans un match physique. Les Turcs ont contrôlé le tempo en seconde période après un passage à vide en fin de première mi-temps.",
    insights: [
      {
        title: "Hayes-Davis intenable",
        body: "22 points à 9/13, dont 4/6 à 3 points : l'ailier a puni chaque aide envoyée sur Baldwin.",
        tone: "positive",
        teamId: "fenerbahce",
      },
      {
        title: "Vezenkov muselé",
        body: "Sasha Vezenkov termine à 11 points à 4/13, gêné par Melli puis Biberović en défense.",
        tone: "negative",
        teamId: "olympiacos",
      },
      {
        title: "Un match à 73 possessions",
        body: "Le rythme lent voulu par Jasikevičius a limité les contre-attaques grecques à 6 points.",
        tone: "neutral",
      },
    ],
  },
};
