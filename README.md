# Vivibasket

Site d'analyse de matchs de basket, dans l'esprit de setwin.net pour le tennis : un outil central pour analyser une affiche (probabilités, forme, confrontations directes, bilans, blessés), les matchs du jour, et derrière, résultats, classements, statistiques avancées et forme des équipes (NBA, EuroLeague, EuroCup, Liga ACB, Betclic Élite, FIBA).

Next.js 16 · TypeScript · Tailwind CSS 4 · Recharts. Données mockées réalistes derrière une couche d'abstraction (`lib/api`) prête à recevoir une vraie API.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:3000
```

## Scripts

| Commande | Rôle |
| --- | --- |
| `npm run dev` | serveur de développement |
| `npm run build` / `npm start` | build et serveur de production |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run data:check` | contrôle de cohérence du dataset mock (volumes, sommes de scores, timings) |

## Déploiement (Vercel)

Le fichier `vercel.json` force le préréglage **Next.js** : Vercel produit alors lui-même sa sortie (`.vercel/output` avec `static` et `functions`).
Dans *Project Settings → Build & Development Settings*, laissez **Output Directory** vide (pas d'override).
Chaque push sur une branche crée un déploiement de preview ; la production suit la branche `main`.

## Documentation

L'architecture, les modèles de données et le moteur de données mockées sont décrits dans [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) ; la charte visuelle dans [docs/DESIGN.md](docs/DESIGN.md).

Les données de l'accueil (équipes proposées, matchs du jour) sont dans `data/matches.ts`, l'analyse fictive dans `lib/home-analysis.ts` : ce sont les deux points à brancher sur une vraie API.
