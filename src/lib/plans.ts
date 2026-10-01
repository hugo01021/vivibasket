import type { LeagueId } from "~/lib/basket/types";

export type PlanId = "basic" | "pro" | "elite";

export type Plan = {
  id: PlanId;
  name: string;
  priceCents: number;
  /** Nombre d'analyses débloquables par période de facturation (null = illimité). */
  monthlyQuota: number | null;
  /** Ligues couvertes (null = toutes). */
  leagues: LeagueId[] | null;
  highlight: boolean;
  pitch: string;
  features: string[];
  /** Sections du résultat accessibles. */
  access: {
    projectedScore: boolean;
    allFactors: boolean;
    valueDetector: boolean;
    keyStats: boolean;
    advancedStats: boolean;
    injuries: boolean;
    live: boolean;
    history: boolean;
    assistant: "none" | "standard" | "advanced";
    priorityAlerts: boolean;
  };
};

export const PLANS: Record<PlanId, Plan> = {
  basic: {
    id: "basic",
    name: "Basic",
    priceCents: 799,
    monthlyQuota: 10,
    leagues: ["nba"],
    highlight: false,
    pitch: "Pour suivre la NBA avec des repères fiables.",
    features: [
      "10 analyses par mois",
      "Probabilités de victoire",
      "Forme, confrontations directes, domicile / extérieur",
      "NBA uniquement",
    ],
    access: {
      projectedScore: false,
      allFactors: false,
      valueDetector: false,
      keyStats: false,
      advancedStats: false,
      injuries: false,
      live: false,
      history: false,
      assistant: "none",
      priorityAlerts: false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceCents: 1499,
    monthlyQuota: null,
    leagues: null,
    highlight: true,
    pitch: "L'analyse complète, sur toutes les ligues, sans compter.",
    features: [
      "Analyses illimitées",
      "Probabilités avancées et score projeté",
      "Détecteur de value",
      "NBA, EuroLeague, Betclic Élite",
      "Historique de vos analyses",
      "Assistant IA",
    ],
    access: {
      projectedScore: true,
      allFactors: true,
      valueDetector: true,
      keyStats: true,
      advancedStats: false,
      injuries: true,
      live: false,
      history: true,
      assistant: "standard",
      priorityAlerts: false,
    },
  },
  elite: {
    id: "elite",
    name: "Elite",
    priceCents: 2499,
    monthlyQuota: null,
    leagues: null,
    highlight: false,
    pitch: "Tout Pro, plus le direct et les statistiques les plus fines.",
    features: [
      "Tout ce que contient Pro",
      "Analyse live pendant le match",
      "Alertes prioritaires",
      "Statistiques avancées (four factors, banc, clutch)",
      "Assistant IA avancé",
    ],
    access: {
      projectedScore: true,
      allFactors: true,
      valueDetector: true,
      keyStats: true,
      advancedStats: true,
      injuries: true,
      live: true,
      history: true,
      assistant: "advanced",
      priorityAlerts: true,
    },
  },
};

export const PLAN_ORDER: PlanId[] = ["basic", "pro", "elite"];

export function isPlanId(value: unknown): value is PlanId {
  return value === "basic" || value === "pro" || value === "elite";
}

export function planCoversLeague(plan: Plan, league: LeagueId): boolean {
  return plan.leagues === null || plan.leagues.includes(league);
}

/** Plan minimal couvrant une ligue donnée (pour les messages d'upsell). */
export function minimalPlanFor(league: LeagueId): PlanId {
  return planCoversLeague(PLANS.basic, league) ? "basic" : "pro";
}
