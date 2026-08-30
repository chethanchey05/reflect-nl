import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import { and, desc, eq } from 'drizzle-orm'
import { db, journalEntries } from './db'
import { calculateStreak, Theme } from './reflect'

const COOKIE = 'reflect-workspace'
export async function workspaceId() { const jar = await cookies(); let id = jar.get(COOKIE)?.value; if (!id) { id = randomUUID(); jar.set(COOKIE, id, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 365 }) }; return id }
export async function getEntries() { return db.select().from(journalEntries).where(eq(journalEntries.workspaceId, await workspaceId())).orderBy(desc(journalEntries.createdAt)) }
export async function getEntry(id: string) { return (await db.select().from(journalEntries).where(and(eq(journalEntries.id, id), eq(journalEntries.workspaceId, await workspaceId()))))[0] }
export async function updateEntry(id: string, data: { theme?: Theme; prompt?: string; content?: string }) { const current = await getEntry(id); if (!current) return null; const values = { ...data, updatedAt: new Date() }; return (await db.update(journalEntries).set(values).where(and(eq(journalEntries.id, id), eq(journalEntries.workspaceId, await workspaceId()))).returning())[0] }
export async function deleteEntry(id: string) { const result = await db.delete(journalEntries).where(and(eq(journalEntries.id, id), eq(journalEntries.workspaceId, await workspaceId()))).returning({ id: journalEntries.id }); return result.length > 0 }
export async function getStats() { const entries = await getEntries(); const streak = calculateStreak(entries.map((e) => e.createdAt)); const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 6); const counts = entries.reduce<Record<string, number>>((all, e) => { all[e.theme] = (all[e.theme] ?? 0) + 1; return all }, {}); const mostUsed = Object.entries(counts).sort((a,b) => b[1] - a[1])[0]?.[0] as Theme | undefined; return { ...streak, total: entries.length, thisWeek: entries.filter((e) => e.createdAt >= weekStart).length, mostUsed: mostUsed ?? 'Not yet' } }
