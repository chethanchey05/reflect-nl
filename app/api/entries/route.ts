import { NextResponse } from 'next/server'
import { db, journalEntries } from '@/lib/db'
import { entrySchema } from '@/lib/reflect'
import { workspaceId, getEntries } from '@/lib/server'

export async function GET() { try { return NextResponse.json(await getEntries()) } catch { return NextResponse.json({ error: 'Unable to load reflections.' }, { status: 500 }) } }
export async function POST(request: Request) { try { const parsed = entrySchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid reflection.' }, { status: 400 }); const now = new Date(); const [entry] = await db.insert(journalEntries).values({ ...parsed.data, workspaceId: await workspaceId(), keyThemes: [], createdAt: now, updatedAt: now }).returning(); return NextResponse.json(entry, { status: 201 }) } catch { return NextResponse.json({ error: 'Unable to save reflection.' }, { status: 500 }) } }
