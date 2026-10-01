# Rebond — analyse de matchs de basket par IA

Web app mobile-first, en français : l'utilisateur choisit un match (NBA, EuroLeague, Betclic Élite), le modèle croise huit facteurs et livre des probabilités, un score projeté et un résumé rédigé. Les analyses complètes sont réservées aux abonnés (Basic 7,99 €, Pro 14,99 €, Elite 24,99 € par mois, via Stripe).

Next.js 16 (App Router, Turbopack) · Tailwind CSS 4 · libSQL/SQLite + Drizzle · Stripe · PWA.

## Parcours

1. **Accueil** `/` — hero, deux boutons, trois atouts, ciel étoilé animé.
2. **Connexion / inscription** `/connexion` — e-mail + mot de passe, un seul bouton, CGU obligatoires, session 30 jours.
3. **Choix du match** `/analyser` — recherche libre (« Lakers vs Celtics ») + matchs du jour filtrables.
4. **Analyse en cours** — écran plein, barre de progression sur les huit facteurs (~6 s).
5. **Résultat flouté** `/analyse/[id]` — noms visibles, tout le reste masqué, un seul bouton « Débloquer l'analyse ».
6. **Offres** `/offres` — Basic / Pro (mise en avant) / Elite, sans essai gratuit.
7. **Paiement et déblocage** — Stripe Checkout (ou simulation sans clé Stripe) → retour automatique sur l'analyse, entièrement visible. Un abonné dont l'offre couvre le match ne voit plus jamais les étapes 5 et 6 tant que son quota n'est pas dépassé.

Toute tentative d'analyse sans session renvoie vers l'étape 2, puis revient à l'étape 3 (proxy + vérification côté serveur).

## Démarrer

```bash
npm install
cp .env.example .env.local   # puis renseignez SESSION_SECRET
npm run dev                  # http://localhost:3000
```

Sans `STRIPE_SECRET_KEY`, l'app fonctionne en **mode démonstration** : le paiement est simulé sur `/paiement/demo`, l'abonnement est activé en base, aucun débit n'a lieu. La base SQLite est créée automatiquement dans `.data/rebond.db`.

| Commande | Rôle |
| --- | --- |
| `npm run dev` / `npm run build` / `npm start` | développement, build, production |
| `npm run lint` · `npm run typecheck` | ESLint · `tsc --noEmit` |
| `npm run icons:generate` | régénère les icônes PWA et le favicon (sans dépendance) |
| `npm run stripe:listen` | relaie les webhooks Stripe en local (CLI Stripe) |

## Variables d'environnement

Voir `.env.example`. En production : `NEXT_PUBLIC_SITE_URL`, `SESSION_SECRET`, `DATABASE_URL` (libSQL distant, ex. Turso) + `DATABASE_AUTH_TOKEN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` et, en option, `STRIPE_PRICE_BASIC|PRO|ELITE` (sinon les prix sont créés à la volée).

Webhook Stripe à déclarer : `POST /api/stripe/webhook` pour `checkout.session.completed`, `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`.

## Arborescence

```
app/                               # Routes (App Router)
├── layout.tsx                     # Polices, métadonnées SEO, enregistrement du service worker
├── page.tsx                       # 1. Accueil (+ StarField)
├── (site)/layout.tsx              # En-tête + pied de page communs
├── (site)/connexion/              # 2. Connexion / inscription
├── (site)/matchs/                 # Matchs du jour (public)
├── (site)/analyser/               # 3. Choix du match (protégé)
├── (focus)/analyse/[id]/          # 4 → 5 ou 7 : analyse en cours, flouté ou débloqué
├── (site)/offres/                 # 6. Offres
├── (site)/paiement/retour/        # 7. Retour Stripe → déblocage → redirection
├── (site)/paiement/demo/          # 7 bis. Paiement simulé (Stripe absent)
├── (site)/compte/                 # Abonnement, quota, résiliation en ligne, historique
├── (site)/{cgu,cgv,mentions-legales,confidentialite,resiliation,jeu-responsable}/
├── (site)/hors-ligne/             # Page PWA hors ligne
├── api/matchs/, api/matchs/[id]/  # API de stats basket (données fictives)
├── api/analyses/, api/analyses/[id]/
├── api/stripe/webhook/            # Webhooks Stripe (idempotents)
├── api/auth/sortie/               # Purge du cookie de session
├── manifest.ts · robots.ts · sitemap.ts · opengraph-image.tsx · icon.svg · apple-icon.png
proxy.ts                           # Redirections d'authentification (cookie signé, sans BD)
public/sw.js · public/icons/       # Service worker et icônes PWA
src/
├── lib/
│   ├── site.ts · plans.ts · utils.ts         # Identité, offres/quotas, utilitaires
│   └── basket/                               # « API de stats » mock et moteur
│       ├── types.ts · rng.ts · teams.ts      # Modèles, PRNG seedé, 66 équipes / 3 ligues
│       ├── fixtures.ts · sheets.ts           # Programme du jour, direct simulé, fiches d'équipe, recherche libre
│       ├── engine.ts                         # Probabilités, score projeté, 8 facteurs, value, résumé rédigé
│       └── api.ts                            # Interface BasketStatsProvider (à remplacer par un vrai fournisseur)
├── server/
│   ├── db/schema.ts · db/index.ts            # Schéma Drizzle, client libSQL, création du schéma
│   ├── auth/password.ts · token.ts · session.ts · dal.ts
│   ├── billing/entitlements.ts · stripe.ts   # Quotas, droits, Stripe + mode démo
│   ├── analyses/service.ts                   # Création, déblocage, filtrage par offre
│   └── actions/auth.ts · analyses.ts · billing.ts   # Server Actions
├── components/{brand,ui,layout,home,match,analysis,offers,auth,pwa}/
└── tools/generate-icons.mjs
```

## Schéma de données

```
users          id · email (unique) · password_hash (scrypt) · terms_accepted_at · stripe_customer_id · priority_alerts · created_at
sessions       id (SHA-256 du jeton) · user_id → users · expires_at · created_at
subscriptions  id · user_id → users · plan (basic|pro|elite) · status (active|trialing|past_due|canceled|incomplete|unpaid)
               provider (stripe|demo) · stripe_subscription_id (unique) · stripe_price_id
               current_period_start · current_period_end · cancel_at_period_end · created_at · updated_at
analyses       id · user_id → users · match_id · league · home_team · away_team · query
               result_json (jamais envoyé au client tant que unlocked = 0) · unlocked · unlocked_at · created_at
stripe_events  id (identifiant Stripe) · type · processed_at   # idempotence du webhook
```

Quota : nombre d'analyses `unlocked` sur la période de facturation courante (Basic : 10 ; Pro et Elite : illimité). Couverture : Basic = NBA seule ; Pro et Elite = toutes les ligues. Une analyse créée par un abonné dans les clous est débloquée immédiatement.

## Déploiement

Vercel détecte Next.js automatiquement (`vercel.json`). **`DATABASE_URL` est indispensable sur Vercel** : sans elle, la base tombe dans `/tmp`, différent d'une fonction serverless à l'autre, et la session créée à la connexion n'est plus trouvée à la requête suivante (symptôme : « analyser » renvoie vers la page de connexion). Un bandeau d'alerte s'affiche dans ce cas. Base gratuite en deux minutes avec [Turso](https://turso.tech) : `turso db create rebond`, puis `turso db show rebond --url` et `turso db tokens create rebond` donnent `DATABASE_URL` et `DATABASE_AUTH_TOKEN`. Définissez aussi `SESSION_SECRET` et `NEXT_PUBLIC_SITE_URL`.

## Données

Programme, scores en direct, fiches et statistiques sont **fictifs mais déterministes** (même journée → mêmes matchs) : voir `src/lib/basket`. Pour brancher un fournisseur réel, implémentez `BasketStatsProvider` dans `src/lib/basket/api.ts`.
