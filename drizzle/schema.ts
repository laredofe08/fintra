import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  kind: mysqlEnum("kind", ["income", "expense"]).default("expense").notNull(),
  color: varchar("color", { length: 20 }).default("#8b5cf6").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const accounts = mysqlTable("accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 40 }).default("bank").notNull(),
  initialBalance: decimal("initialBalance", { precision: 13, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  accountId: int("accountId"),
  categoryId: int("categoryId"),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  description: varchar("description", { length: 180 }).notNull(),
  amount: decimal("amount", { precision: 13, scale: 2 }).notNull(),
  transactionDate: timestamp("transactionDate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const goals = mysqlTable("goals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  targetAmount: decimal("targetAmount", { precision: 13, scale: 2 }).notNull(),
  currentAmount: decimal("currentAmount", { precision: 13, scale: 2 }).default("0").notNull(),
  deadline: timestamp("deadline"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Goal = typeof goals.$inferSelect;
