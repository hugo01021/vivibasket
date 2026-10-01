import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { mkdirSync } from "node:fs";
import path from "node:path";
import * as schema from "./schema";

export { schema };

const DDL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  terms_accepted_at INTEGER NOT NULL,
  stripe_customer_id TEXT,
  priority_alerts INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  provider TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  current_period_start INTEGER NOT NULL,
  current_period_end INTEGER NOT NULL,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS subscriptions_user_idx ON subscriptions(user_id);
CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  league TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  query TEXT,
  result_json TEXT NOT NULL,
  unlocked INTEGER NOT NULL DEFAULT 0,
  unlocked_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS analyses_user_idx ON analyses(user_id, created_at);
CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  processed_at INTEGER NOT NULL
);
`;

/** URL de base configurée : DATABASE_URL, ou les variables injectées par l'intégration Turso de Vercel. */
function configuredUrl(): { url: string; authToken?: string } | null {
  const url = process.env.DATABASE_URL?.trim() || process.env.TURSO_DATABASE_URL?.trim();
  if (!url) return null;
  const authToken = process.env.DATABASE_AUTH_TOKEN?.trim() || process.env.TURSO_AUTH_TOKEN?.trim() || undefined;
  return { url, authToken };
}

/** Vrai sur Vercel sans base configurée : la base vit dans /tmp et change d'une fonction à l'autre. */
export function isEphemeralDatabase(): boolean {
  return Boolean(process.env.VERCEL) && configuredUrl() === null;
}

function resolveUrl(): { url: string; authToken?: string } {
  const configured = configuredUrl();
  if (configured) return configured;
  if (process.env.VERCEL) {
    // Système de fichiers en lecture seule sur Vercel : seul /tmp est inscriptible.
    // Les données ne survivent pas aux redéploiements : configurez DATABASE_URL (Turso) en production.
    console.warn("[db] DATABASE_URL absent : base éphémère dans /tmp. Configurez une base libSQL distante pour la production.");
    return { url: "file:/tmp/rebond.db" };
  }
  const dir = path.join(process.cwd(), ".data");
  mkdirSync(dir, { recursive: true });
  return { url: `file:${path.join(dir, "rebond.db")}` };
}

type Db = ReturnType<typeof drizzle<typeof schema>>;

const globalStore = globalThis as unknown as { __rebondDb?: { client: Client; db: Db; ready: Promise<void> } };

function init() {
  if (globalStore.__rebondDb) return globalStore.__rebondDb;
  const { url, authToken } = resolveUrl();
  const client = createClient({ url, authToken });
  const db = drizzle(client, { schema });
  const ready = (async () => {
    await client.execute("PRAGMA foreign_keys = ON");
    await client.executeMultiple(DDL);
  })();
  globalStore.__rebondDb = { client, db, ready };
  return globalStore.__rebondDb;
}

/** Base prête à l'emploi (schéma créé au premier appel). */
export async function getDb(): Promise<Db> {
  const store = init();
  await store.ready;
  return store.db;
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}
