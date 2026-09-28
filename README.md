# Basket Analytics

Webapp de résultats et d'analyse de basket (NBA, EuroLeague, EuroCup, Liga ACB, Betclic Élite, FIBA) : matchs en direct, résultats, classements, statistiques avancées, forme des équipes et analyse IA.

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

## Documentation

L'architecture, les modèles de données, le moteur de données mockées et la charte visuelle sont décrits dans [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
