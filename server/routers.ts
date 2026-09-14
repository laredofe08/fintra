import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { accounts, categories, goals, transactions } from "../drizzle/schema";
import { getDb, getUserAccounts, getUserCategories, getUserGoals, getUserTransactions } from "./db";
import { z } from "zod";

const money = z.coerce.number().positive();
const periodInput = z.object({ from: z.coerce.date().optional(), to: z.coerce.date().optional() }).optional();

export const appRouter = router({
  system: systemRouter,
  auth: router({ me: publicProcedure.query(opts => opts.ctx.user), logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); return { success: true } as const; }) }),
  finance: router({
    summary: protectedProcedure.input(periodInput).query(async ({ ctx, input }) => { const rows = await getUserTransactions(ctx.user.id, input?.from, input?.to); const income = rows.filter(r => r.type === 'income').reduce((s,r) => s + Number(r.amount), 0); const expense = rows.filter(r => r.type === 'expense').reduce((s,r) => s + Number(r.amount), 0); return { income, expense, balance: income - expense, transactions: rows.slice(0, 8), count: rows.length }; }),
    transactions: protectedProcedure.input(periodInput).query(({ ctx, input }) => getUserTransactions(ctx.user.id, input?.from, input?.to)),
    accounts: protectedProcedure.query(({ ctx }) => getUserAccounts(ctx.user.id)),
    categories: protectedProcedure.query(({ ctx }) => getUserCategories(ctx.user.id)),
    goals: protectedProcedure.query(({ ctx }) => getUserGoals(ctx.user.id)),
    addAccount: protectedProcedure.input(z.object({ name: z.string().min(1), type: z.string().default('bank'), initialBalance: z.coerce.number().default(0) })).mutation(async ({ ctx, input }) => { const db = await getDb(); if (!db) throw new Error('Database unavailable'); return db.insert(accounts).values({ userId: ctx.user.id, ...input, initialBalance: String(input.initialBalance) }); }),
    addCategory: protectedProcedure.input(z.object({ name: z.string().min(1), kind: z.enum(['income','expense']).default('expense'), color: z.string().default('#8b5cf6') })).mutation(async ({ ctx, input }) => { const db = await getDb(); if (!db) throw new Error('Database unavailable'); return db.insert(categories).values({ userId: ctx.user.id, ...input }); }),
    addTransaction: protectedProcedure.input(z.object({ type: z.enum(['income','expense']), description: z.string().min(1), amount: money, transactionDate: z.coerce.date(), accountId: z.number().optional(), categoryId: z.number().optional(), notes: z.string().optional() })).mutation(async ({ ctx, input }) => { const db = await getDb(); if (!db) throw new Error('Database unavailable'); return db.insert(transactions).values({ userId: ctx.user.id, ...input, amount: String(input.amount) }); }),
    addGoal: protectedProcedure.input(z.object({ name: z.string().min(1), targetAmount: money, currentAmount: z.coerce.number().default(0), deadline: z.coerce.date().optional() })).mutation(async ({ ctx, input }) => { const db = await getDb(); if (!db) throw new Error('Database unavailable'); return db.insert(goals).values({ userId: ctx.user.id, ...input, targetAmount: String(input.targetAmount), currentAmount: String(input.currentAmount) }); }),
  }),
});
export type AppRouter = typeof appRouter;
