import { and, desc, eq, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { accounts, categories, goals, InsertUser, transactions, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
export async function getDb() { if (!_db && process.env.DATABASE_URL) { try { _db = drizzle(process.env.DATABASE_URL); } catch { _db = null; } } return _db; }

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb(); if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  (['name','email','loginMethod'] as const).forEach(field => { if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; } });
  values.lastSignedIn = user.lastSignedIn ?? new Date(); updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}
export async function getUserByOpenId(openId: string) { const db = await getDb(); if (!db) return undefined; const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1); return result[0]; }
export async function getUserTransactions(userId: number, from?: Date, to?: Date) { const db = await getDb(); if (!db) return []; const filters = [eq(transactions.userId, userId)]; if (from) filters.push(gte(transactions.transactionDate, from)); if (to) filters.push(lte(transactions.transactionDate, to)); return db.select().from(transactions).where(and(...filters)).orderBy(desc(transactions.transactionDate)); }
export async function getUserAccounts(userId: number) { const db = await getDb(); if (!db) return []; return db.select().from(accounts).where(eq(accounts.userId, userId)).orderBy(desc(accounts.createdAt)); }
export async function getUserCategories(userId: number) { const db = await getDb(); if (!db) return []; return db.select().from(categories).where(eq(categories.userId, userId)).orderBy(categories.name); }
export async function getUserGoals(userId: number) { const db = await getDb(); if (!db) return []; return db.select().from(goals).where(eq(goals.userId, userId)).orderBy(desc(goals.createdAt)); }
