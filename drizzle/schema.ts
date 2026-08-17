import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const repositories = mysqlTable("repositories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  githubRepositoryId: varchar("githubRepositoryId", { length: 64 }),
  owner: varchar("owner", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  defaultBranch: varchar("defaultBranch", { length: 255 }).default("main").notNull(),
  installationId: varchar("installationId", { length: 64 }),
  connectionStatus: mysqlEnum("connectionStatus", ["demo", "connected", "attention", "disconnected"]).default("demo").notNull(),
  lastScannedAt: timestamp("lastScannedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const riskFindings = mysqlTable("riskFindings", {
  id: int("id").autoincrement().primaryKey(),
  repositoryId: int("repositoryId").notNull().references(() => repositories.id, { onDelete: "cascade" }),
  externalId: varchar("externalId", { length: 128 }).notNull().unique(),
  provider: varchar("provider", { length: 64 }).notNull(),
  findingType: mysqlEnum("findingType", ["deprecation", "schema_change", "sdk_release", "behavior_change"]).notNull(),
  severity: mysqlEnum("severity", ["critical", "high", "medium", "low"]).notNull(),
  status: mysqlEnum("status", ["needs_review", "triaged", "ignored", "resolved"]).default("needs_review").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  sourceUrl: text("sourceUrl").notNull(),
  sourceSummary: text("sourceSummary").notNull(),
  codeReferencesJson: text("codeReferencesJson").notNull(),
  ownerHint: varchar("ownerHint", { length: 255 }),
  riskScore: int("riskScore").notNull(),
  confidence: int("confidence").notNull(),
  deadlineAt: timestamp("deadlineAt"),
  detectedAt: timestamp("detectedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Repository = typeof repositories.$inferSelect;
export type RiskFinding = typeof riskFindings.$inferSelect;
