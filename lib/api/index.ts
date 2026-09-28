import type { BasketDataProvider } from "./provider";
import { mockProvider } from "./mock";

/**
 * Point d'entrée unique de l'app vers les données.
 *
 * Aujourd'hui : provider mock (données générées de façon déterministe).
 * Demain : `DATA_PROVIDER=api-sports` sélectionnera un client HTTP implémentant
 * la même interface `BasketDataProvider` (voir ./provider.ts).
 */
export function getProvider(): BasketDataProvider {
  const name = process.env.DATA_PROVIDER ?? "mock";
  switch (name) {
    case "mock":
    default:
      return mockProvider;
  }
}

export const api: BasketDataProvider = getProvider();

export type * from "./provider";
