# Basket Analytics — architecture

Webapp de résultats et d'analyse 100 % basket. Navigation dense et rapide (matchs, compétitions, équipes, joueurs), différenciation par la couche d'analyse (stats avancées, forme, analyse IA). Identité visuelle propre : dark mode natif, noir profond + orange basket.

## Stack

| Brique | Choix |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components, Turbopack) + TypeScript strict |
| UI | Tailwind CSS 4 (tokens de thème dans `app/globals.css`), police Manrope via `next/font` |
| Graphiques | Recharts 3 |
| Données | Provider mock déterministe derrière `lib/api` (interface `BasketDataProvider`), branchable sur API-Sports / balldontlie |
| Favoris | `localStorage` (hook `useFavorites`, étape 6) |
| Qualité | ESLint (config Next), `tsc --noEmit`, script `npm run data:check` |

## Arborescence cible

```
vivibasket/
├── app/                              # Routes (App Router)
│   ├── layout.tsx                    # Layout global : header, navigation, footer, thème
│   ├── globals.css                   # Tokens de couleur / typo (Tailwind @theme)
│   ├── page.tsx                      # Accueil : en direct, matchs du jour, filtres, navigation par jour
│   ├── not-found.tsx
│   ├── match/[id]/page.tsx           # Page match : Résumé · Stats · Joueurs · Analyse · Play-by-play
│   ├── competitions/page.tsx         # Liste des compétitions par catégorie
│   ├── competitions/[slug]/page.tsx  # Classement · calendrier · résultats
│   ├── equipes/page.tsx              # NBA · EuroLeague · International
│   ├── equipes/[id]/page.tsx         # Infos, effectif, derniers matchs, stats, forme
│   ├── joueurs/page.tsx              # Leaders + recherche
│   ├── joueurs/[id]/page.tsx         # Profil, stats de saison, derniers matchs
│   ├── analyses/page.tsx             # Hub des analyses
│   ├── analyses/forme/page.tsx       # Forme des équipes
│   ├── analyses/stats-avancees/page.tsx
│   ├── analyses/ia/page.tsx
│   ├── favoris/page.tsx
│   ├── recherche/page.tsx
│   └── api/
│       ├── analysis/route.ts         # POST { matchId } → MatchAnalysis (mock, LLM plus tard)
│       ├── search/route.ts           # GET ?q= → SearchResult[]
│       └── matches/route.ts          # GET (favoris côté client)
├── components/
│   ├── layout/      Header, Logo, Footer (menu mobile inclus dans Header)
│   ├── match/       MatchCard, MatchRow, MatchGroup, MatchStatus, ScoreHeader, BoxScoreTable, PlayByPlayList, MatchTabs
│   ├── analysis/    StatComparison, FormBar, RatingCompare, AiInsights, ScoreProgressionChart, KeyStatsChart
│   ├── team/        TeamBadge, TeamHeader, RosterTable, FormIndicator
│   ├── player/      PlayerHeader, PlayerStatsTable, GameLogTable
│   ├── competition/ CompetitionFilter, StandingsTable, CalendarList
│   └── ui/          Tabs, SectionTitle, EmptyState, LiveDot, StatCard, FavoriteButton
├── data/                             # Données mockées (TS)
│   ├── competitions.ts               # 9 compétitions
│   ├── teams.ts                      # 107 équipes (+ indice de force pour le simulateur)
│   ├── players.ts                    # 414 joueurs saisis à la main (effectifs vedettes + joueurs clés)
│   ├── featured-matches.ts           # Matchs scénarisés du jour (direct, terminés, à venir)
│   ├── analyses.ts                   # Textes « Analyse IA » rédigés pour les matchs scénarisés
│   ├── schedule-specs.ts             # Calendrier de chaque compétition (jours relatifs à aujourd'hui)
│   └── generated/                    # Moteur déterministe
│       ├── rng.ts                    # PRNG seedé (mulberry32) + répartition d'entiers
│       ├── names.ts                  # Pools de noms par nationalité
│       ├── rosters.ts                # Complétion des effectifs (12-13 joueurs par équipe)
│       ├── schedule.ts               # Journées, slates NBA quotidiens, groupes (round-robin)
│       ├── simulate.ts               # Scores par période, prolongations, box score d'équipe
│       ├── boxscore.ts               # Box score individuel (sommes exactes)
│       ├── playbyplay.ts             # Play-by-play reconstitué depuis les box scores
│       ├── analysis.ts               # Analyse « IA » à base de règles (pré-match et en cours/terminé)
│       └── dataset.ts                # Assemblage : matchs, stats, classements, stats saison, journaux
├── lib/
│   ├── api/
│   │   ├── provider.ts               # Interface BasketDataProvider + filtres
│   │   ├── mock/index.ts             # Implémentation mock
│   │   └── index.ts                  # `api` (provider actif, sélection par DATA_PROVIDER)
│   ├── time.ts                       # Fuseau Europe/Paris, journée sportive
│   ├── format.ts                     # Dates, heures, pourcentages, noms
│   ├── stats.ts                      # Possessions, ORTG/DRTG, pace, eFG%, TS%, four factors
│   ├── favorites.ts                  # localStorage (étape 6)
│   └── utils.ts                      # cn(), slugify, groupBy…
├── hooks/                            # useFavorites, useLiveTicker (étapes 6-7)
├── types/                            # Modèles de données
├── scripts/check-data.ts             # Contrôle de cohérence du dataset
└── docs/ARCHITECTURE.md
```

## Modèles de données (`types/`)

- **Competition** — `id`, `slug` (URL), `name`, `fullName`, `region`, `category` (`nba` · `europe` · `international` · `national` · `other`), `format`, `season`, `stage`, `accentColor`, `gameMinutes` (48/40), `periods`, `groups?` (conférences / groupes), `navOrder`.
- **Team** — `id`, `name`, `shortName`, `abbreviation`, `city`, `country` (ISO-3), `kind` (`club` · `national`), `competitionIds[]` (un club peut jouer EuroLeague + championnat), `groups?` par compétition, `colors`, `arena?`, `coach?`.
- **TeamSeasonStats** — par (équipe, compétition) : bilan, points pour/contre, **ORTG / DRTG / net rating / pace**, adresses (FG, 3P, LF, eFG%, TS%), rebonds/passes/pertes/interceptions/contres par match, `form` (5 derniers), `formScore` /10, bilans domicile/extérieur, série en cours.
- **Player** — identité, `teamId`, numéro, poste, taille, poids, date de naissance, nationalité, `international`, `isFeatured` (saisi à la main vs généré).
- **PlayerSeasonStats** — par (joueur, compétition) : matchs, minutes, PTS/REB/AST/STL/BLK/TOV/PF par match, adresses, tentatives, +/−, `efficiency` (PIR), `usageRate`, TS%, records.
- **Match** — `competitionId`, `season`, `stage`, `round`, `date` (UTC), `status` (`scheduled` · `live` · `halftime` · `finished` · `postponed` · `cancelled`), équipes, scores, `periods[]` (par quart-temps, prolongations incluses), `clock?` (période, chrono), `venue?`, `attendance?`, `broadcast?`.
- **TeamBoxScore / PlayerBoxScoreLine** — totaux d'un match (tirs, rebonds, passes, pertes, points dans la raquette, contre-attaque, seconde chance, banc…) et lignes individuelles (MIN, PTS, REB, AST, STL, BLK, TOV, PF, FG/3P/LF, +/−, PIR, `onCourt` en direct).
- **AdvancedTeamStats** — possessions, pace, ORTG, DRTG, net rating, eFG%, TS%, TOV%, ORB%, taux de lancers, part de passes, part de tirs à 3 points.
- **PlayByPlayEvent** — séquence, période, chrono, type (`two_made`, `three_missed`, `rebound_def`, `turnover`, `steal`, `block`, `foul`, `timeout`, `substitution`…), équipe/joueur, description prête à afficher, score courant.
- **MatchAnalysis** — `summary`, `insights[]` (titre, texte, tonalité, équipe), `keyPlayers`, `form` /10, `winProbability`, `momentum` par période, `source` (`mock` | `llm`).
- **MatchDetails** — tout ce qu'affiche la page match : match, compétition, équipes, box scores, stats avancées, play-by-play, analyse, confrontations directes.
- **StandingRow** — rang, bilan, %, points, différence, retard (GB), série, 5 derniers, domicile/extérieur, groupe.
- **SearchResult / Favorite** — recherche globale et favoris (`team` · `competition` · `player`).

## Couche d'accès aux données (`lib/api`)

`BasketDataProvider` expose : compétitions, classements, stats d'équipes par compétition, matchs (filtres compétition / équipe / statut / journée), direct, détail d'un match, analyse, équipes, effectifs, stats saison, joueurs, journaux de matchs, leaders statistiques, recherche.

- Aujourd'hui : `MockBasketProvider` (données générées).
- Demain : un `ApiSportsProvider` (ou balldontlie pour la NBA) implémentant la même interface, sélectionné par `DATA_PROVIDER`. Les pages ne changent pas.
- Les composants client (favoris, recherche instantanée) passent par des route handlers `/api/*` qui appellent `api`, jamais par le provider directement.

## Moteur de données mockées

Objectif : un jeu de données **réaliste, cohérent et toujours vivant**, sans saisir des milliers de lignes.

1. **Effectifs** : 414 joueurs réels saisis à la main (effectifs quasi complets pour Celtics, Knicks, Lakers, Warriors, Nuggets, Thunder, Real Madrid, Panathinaïkos, Monaco, Paris, Barcelone, Valencia ; 5 à 8 joueurs clés pour les autres équipes NBA et EuroLeague). Le reste est complété par des joueurs générés (noms plausibles par nationalité). Les sélections nationales réunissent les joueurs réels de la nationalité concernée.
2. **Calendrier** : chaque compétition a une spec (journées relatives à aujourd'hui, slate quotidien pour la NBA, groupes en round-robin pour la Coupe du Monde, les JO et la BCL). Une équipe ne joue jamais deux fois le même jour, toutes compétitions confondues.
3. **Matchs scénarisés** (`data/featured-matches.ts`) : 4 matchs en direct, 3 terminés hier, 7 affiches du jour, avec analyses IA rédigées. Ils garantissent une démo complète quel que soit le moment.
4. **Simulation** : score par période à partir d'indices de force (avantage du terrain, prolongations), puis box score d'équipe, puis box scores individuels dont les sommes égalent exactement les totaux. Le play-by-play est reconstitué à partir des box scores (les paniers d'une période totalisent exactement son score).
5. **Agrégats** : classements, stats saison des équipes (ORTG/DRTG/pace calculés, forme /10) et des joueurs (moyennes, usage, TS%, records) dérivés des matchs joués.
6. **Déterminisme** : tout est seedé (PRNG mulberry32) ; le dataset est mémoïsé une minute et se régénère à chaque nouvelle journée. Les matchs générés passent d'eux-mêmes de « à venir » à « en direct » puis « terminé » avec l'heure réelle.

Conventions : heures affichées en heure de Paris ; **journée sportive** = les matchs avant 06:00 (NBA en nocturne) sont rattachés à la veille.

Limites assumées : rosters partiellement générés hors équipes vedettes, calendrier relatif au jour courant (les résultats changent d'un jour à l'autre), statistiques approximatives des joueurs réels.

## Charte visuelle

| Token | Valeur | Usage |
| --- | --- | --- |
| `bg` | `#0B0B0D` | fond de page |
| `surface` / `surface-2` / `surface-3` | `#141418` / `#1B1B21` / `#23232B` | cartes, survol, puces |
| `border` / `border-strong` | `#26262E` / `#34343F` | séparateurs |
| `fg` / `fg-muted` / `fg-subtle` | `#F4F1EC` / `#9A9AA6` / `#6B6B78` | texte |
| `accent` / `accent-hover` / `accent-soft` | `#FF7A1A` / `#FF8F3D` / `#2B1A0E` | orange basket : actions, actif, scores en direct |
| `live` | `#FF4D3D` | indicateur direct (pulsation) |
| `win` / `loss` / `info` | `#4ADE80` / `#F87171` / `#5B8CFF` | tonalités d'analyse, forme |

Typographie Manrope (chiffres tabulaires), coins 14 px, écussons d'équipes générés à partir des couleurs (aucun logo officiel), couleur d'accent par compétition pour les filtres et les en-têtes.

## Étapes

1. ✅ Initialisation, structure, types, données mockées, couche `lib/api`
2. ✅ Layout global : header, navigation, menu mobile, thème dark (première version)
3. ✅ Page d'accueil (première version : direct, matchs du jour, filtres, navigation par jour)
4. ✅ Page d’un match et ses onglets
5. ✅ Pages compétitions, équipes, joueurs, analyses
6. ✅ Favoris et recherche (+ routes `/api/*`)
7. Finitions : responsive, accessibilité, performances
