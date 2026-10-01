import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/*
  Schéma de données Rebond (libSQL / SQLite). Les dates sont stockées en
  millisecondes Unix (integer) pour rester triviales à comparer.
*/

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  termsAcceptedAt: integer("terms_accepted_at").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  priorityAlerts: integer("priority_alerts", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at").notNull(),
});

export const sessions = sqliteTable(
  "sessions",
  {
    /** Empreinte SHA-256 du jeton : le jeton brut ne vit que dans le cookie. */
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    plan: text("plan", { enum: ["basic", "pro", "elite"] }).notNull(),
    status: text("status", { enum: ["active", "trialing", "past_due", "canceled", "incomplete", "unpaid"] }).notNull(),
    provider: text("provider", { enum: ["stripe", "demo"] }).notNull(),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    stripePriceId: text("stripe_price_id"),
    currentPeriodStart: integer("current_period_start").notNull(),
    currentPeriodEnd: integer("current_period_end").notNull(),
    cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [index("subscriptions_user_idx").on(t.userId)],
);

export const analyses = sqliteTable(
  "analyses",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    matchId: text("match_id").notNull(),
    league: text("league", { enum: ["nba", "euroleague", "betclic"] }).notNull(),
    homeTeam: text("home_team").notNull(),
    awayTeam: text("away_team").notNull(),
    query: text("query"),
    /** Résultat complet sérialisé (jamais envoyé au client tant que `unlocked` est faux). */
    resultJson: text("result_json").notNull(),
    unlocked: integer("unlocked", { mode: "boolean" }).notNull().default(false),
    unlockedAt: integer("unlocked_at"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("analyses_user_idx").on(t.userId, t.createdAt)],
);

/** Journal des événements Stripe traités (idempotence du webhook). */
export const stripeEvents = sqliteTable("stripe_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  processedAt: integer("processed_at").notNull(),
});

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Analysis = typeof analyses.$inferSelect;
