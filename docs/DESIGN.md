# Charte visuelle Vivibasket

Outil de stats fait par quelqu'un qui aime le basket : dense, sobre, direct. Application de statistiques sportives, pas landing page. Référence d'esprit : setwin.net (tennis) — peu d'éléments, un outil central, les matchs du jour, rien de superflu.

## Couleurs (tokens dans `app/globals.css`, utilitaires Tailwind)

| Usage | Token | Valeur |
| --- | --- | --- |
| Fond de page | `bg-bg` | `#0b1220` (bleu nuit) |
| Cartes / panneaux | `bg-surface` (`bg-surface-2`, `bg-surface-3` pour les niveaux) | `#111c2e` / `#16233a` / `#1c2c47` |
| Bordures | `border-border` (= `border-line`), `border-border-strong` au survol | `#243247` / `#33455f` |
| Texte | `text-fg` | `#f8fafc` (blanc cassé) |
| Texte secondaire | `text-fg-muted` (= `text-dim`), `text-fg-subtle` pour l'encore plus discret | `#94a3b8` / `#64748b` (gris bleuté) |
| Couleur principale | `text-accent`, `bg-accent`, `bg-accent-hover` au survol, `bg-accent-soft` (fond orange 14 %) | `#f97316` (orange basket) |
| Couleur secondaire | `text-info`, `bg-info`, `bg-info-soft` — seconde série des graphiques, équipe extérieur, liens discrets | `#2563eb` (bleu électrique) |
| Victoire / défaite | `text-win`, `text-loss` — atténués dans les pastilles (`bg-win/10 text-win/80`) et réservés aux V/D | `#22c55e` / `#ef4444` |
| Direct | `text-live` | orange |

Aucune autre couleur : pas de couleurs d'équipes ni de compétitions (`team.colors`, `competition.accentColor` ne s'affichent pas), pas de dégradés, pas de texte en dégradé, pas de néon, pas de glow. Jamais de couleur en dur dans les composants : toujours les tokens (`bg-surface`, `var(--color-accent)`…).

## Formes

- Coins : `rounded-md` (6 px, = `rounded-card`) pour les cartes et champs, `rounded-[4px]` (= `rounded-chip`) pour les boutons secondaires et petites pastilles. **Jamais `rounded-full`** sauf pour un point (LiveDot).
- Bordures : 1 px, `border-border`. Pas d'ombre portée (`shadow-card` vaut `none`), pas de glassmorphism (`backdrop-blur`) hors header.
- Cartes : `rounded-md border border-border bg-surface`. Beaucoup de contenus se passent de carte : une liste avec `divide-y divide-border` suffit.
- Fonds de survol : `hover:bg-surface-2` pour une ligne, `hover:border-border-strong` pour une carte cliquable.

## Typographie

- Titres (`h1`, `h2`, gros chiffres) : `font-display` (Barlow Condensed) + `font-bold` (ou `font-extrabold`) + `uppercase` + `leading-none`. Ex. h1 de page : `font-display text-4xl font-bold uppercase leading-none sm:text-5xl` ; h2 de section : `font-display text-2xl font-bold uppercase leading-none`.
- Texte courant : Manrope (par défaut), `text-sm` pour les listes et tableaux, `text-[15px]` pour les lignes importantes.
- Libellés de colonnes / sur-titres : `text-[11px] uppercase tracking-[0.08em] text-fg-muted`.
- Chiffres : toujours `tabular-nums` (classe `tabular` ou `tabular-nums`).

## Duel d'équipes

Partout où deux équipes s'affrontent (liste du jour, lignes de matchs, carte d'analyse), l'affiche tient sur **une seule ligne** : `[score] Domicile – Extérieur [score]`. Le domicile est à gauche, l'extérieur à droite, un tiret « – » entre les deux noms, et le score (ou la probabilité de victoire) **de chaque côté des équipes**, à l'extérieur. Favori / vainqueur en clair, l'autre en `text-fg-muted` ; probabilité du favori en orange, de l'outsider en bleu. Sur mobile, on affiche le nom court (`shortName`).

## Composants communs (`components/ui`, `components/layout`)

- `Header` (fixe, transparent puis noir au scroll), `Footer` (une ligne), `SectionTitle`, `StatCard`, `EmptyState`, `FavoriteButton`, `TeamBadge` (monochrome), `FormIndicator`, `LiveDot`.
- Boutons : primaire `rounded-md bg-accent px-4 text-sm font-bold text-bg hover:bg-accent-hover` ; secondaire `rounded-[4px] border border-border px-3 text-xs font-semibold text-fg hover:border-accent hover:text-accent`.
- Onglets : ligne inférieure `border-b-2`, actif `border-accent text-fg`, inactif `border-transparent text-fg-muted hover:text-fg`. Pas de pastilles en fond plein.
- Micro-interactions uniquement : survol des lignes, bouton orange qui s'éclaircit. Pas d'animations au scroll, pas de `hover:scale`.

## À bannir

Emojis et icônes décoratives, sections « features » en grille de trois cartes, phrases marketing (« propulsé par l'IA », « révolutionnez… »), témoignages, compteurs d'utilisateurs, animations au scroll.
