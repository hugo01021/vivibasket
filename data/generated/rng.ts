/**
 * Générateur pseudo-aléatoire déterministe (mulberry32) : même seed → même séquence.
 * Toutes les données mockées en dépendent, ce qui garantit des résultats stables
 * entre le serveur et le client, et entre deux requêtes.
 */

export function hashString(input: string): number {
  let h = 2166136261 >>> 0; // FNV-1a
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export class Rng {
  private state: number;

  constructor(seed: number | string) {
    const numeric = typeof seed === "string" ? hashString(seed) : seed >>> 0;
    this.state = numeric === 0 ? 0x9e3779b9 : numeric;
  }

  /** Nombre dans [0, 1). */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Entier dans [min, max] (bornes incluses). */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  float(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }

  shuffle<T>(items: readonly T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /** Loi normale (Box-Muller). */
  normal(mean = 0, sd = 1): number {
    let u = 0;
    let v = 0;
    while (u === 0) u = this.next();
    while (v === 0) v = this.next();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /** Indice tiré selon des poids (>= 0). */
  weightedIndex(weights: readonly number[]): number {
    let total = 0;
    for (const w of weights) total += Math.max(0, w);
    if (total <= 0) return Math.floor(this.next() * weights.length);
    let r = this.next() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= Math.max(0, weights[i]);
      if (r <= 0) return i;
    }
    return weights.length - 1;
  }

  /** Sous-générateur indépendant, dérivé d'un libellé. */
  child(label: string): Rng {
    return new Rng(`${this.next().toFixed(12)}:${label}`);
  }
}

/**
 * Répartit `total` unités entières selon des poids, avec un peu de bruit.
 * La somme du résultat vaut exactement `total`.
 */
export function distribute(
  total: number,
  weights: readonly number[],
  rng: Rng,
  noise = 0.25,
): number[] {
  const n = weights.length;
  const result = new Array<number>(n).fill(0);
  if (n === 0 || total <= 0) return result;

  const noisy = weights.map((w) => Math.max(0, w) * Math.max(0.05, 1 + rng.normal(0, noise)));
  const sum = noisy.reduce((a, b) => a + b, 0);
  if (sum <= 0) {
    result[rng.int(0, n - 1)] = total;
    return result;
  }

  let allocated = 0;
  const fractions: number[] = [];
  for (let i = 0; i < n; i++) {
    const expected = (total * noisy[i]) / sum;
    const base = Math.floor(expected);
    result[i] = base;
    allocated += base;
    fractions.push(expected - base);
  }
  let remaining = total - allocated;
  while (remaining > 0) {
    const i = rng.weightedIndex(fractions.map((f) => f + 0.02));
    result[i] += 1;
    fractions[i] = 0;
    remaining -= 1;
  }
  return result;
}
