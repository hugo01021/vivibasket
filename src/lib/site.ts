/** Identité et constantes globales du produit. */
export const SITE = {
  name: "Rebond",
  tagline: "Lisez le match avant l'entre-deux.",
  description:
    "Rebond analyse un match de basket en quelques secondes : probabilités de victoire, score projeté, forme, confrontations directes et résumé rédigé par l'IA. NBA, EuroLeague, Betclic Élite.",
  locale: "fr_FR",
  themeColor: "#0b0b0d",
  supportEmail: "bonjour@rebond.app",
  /** Numéro national d'aide aux joueurs (appel non surtaxé). */
  helplinePhone: "09 74 75 13 13",
} as const;

export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw && /^https?:\/\//.test(raw)) return raw.replace(/\/+$/, "");
  return "http://localhost:3000";
}

/** Chemins publics (SEO, sitemap, navigation). */
export const ROUTES = {
  home: "/",
  login: "/connexion",
  matches: "/matchs",
  analyse: "/analyser",
  offers: "/offres",
  account: "/compte",
  legal: {
    terms: "/cgu",
    sales: "/cgv",
    notice: "/mentions-legales",
    privacy: "/confidentialite",
    cancel: "/resiliation",
    responsible: "/jeu-responsable",
  },
} as const;
