import "server-only";
import { eq, lt } from "drizzle-orm";
import { getDb, schema } from "~/server/db";

/**
 * Cache des réponses du fournisseur de données : mémoire de l'instance puis
 * table `api_cache`, pour rester sous la limite de requêtes de l'API.
 */
const memory = new Map<string, { value: unknown; expiresAt: number }>();

export async function cacheGet<T>(key: string): Promise<T | null> {
  const now = Date.now();
  const hit = memory.get(key);
  if (hit && hit.expiresAt > now) return hit.value as T;
  try {
    const db = await getDb();
    const rows = await db.select().from(schema.apiCache).where(eq(schema.apiCache.key, key)).limit(1);
    const row = rows[0];
    if (row && row.expiresAt > now) {
      const value = JSON.parse(row.body) as T;
      memory.set(key, { value, expiresAt: row.expiresAt });
      return value;
    }
  } catch (error) {
    console.warn("[cache] lecture impossible", error);
  }
  return null;
}

export async function cacheSet(key: string, value: unknown, ttlMs: number): Promise<void> {
  const expiresAt = Date.now() + ttlMs;
  memory.set(key, { value, expiresAt });
  try {
    const db = await getDb();
    await db
      .insert(schema.apiCache)
      .values({ key, body: JSON.stringify(value), expiresAt })
      .onConflictDoUpdate({ target: schema.apiCache.key, set: { body: JSON.stringify(value), expiresAt } });
    // Nettoyage opportuniste des entrées expirées.
    if (Math.random() < 0.05) await db.delete(schema.apiCache).where(lt(schema.apiCache.expiresAt, Date.now()));
  } catch (error) {
    console.warn("[cache] écriture impossible", error);
  }
}
