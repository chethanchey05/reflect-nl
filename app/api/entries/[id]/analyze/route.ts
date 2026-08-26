import { NextResponse } from 'next/server'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import { db, journalEntries } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { getEntry } from '@/lib/server'
const insight = z.object({ sentiment: z.enum(['Positive','Neutral','Reflective','Challenging','Concerned']), keyThemes: z.array(z.string()).max(6), summary: z.string().max(500), followUpQuestion: z.string().max(300) })
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) { const entry = await getEntry((await params).id); if (!entry) return NextResponse.json({ error: 'Reflection not found.' }, { status: 404 }); if (!process.env.AI_GATEWAY_API_KEY) return NextResponse.json({ error: 'AI analysis is currently unavailable.' }, { status: 503 }); try { const result = await generateText({ model: process.env.REFLECT_AI_MODEL ?? 'openai/gpt-4o-mini', output: Output.object({ schema: insight }), system: 'You are a thoughtful executive reflection assistant. Analyze writing without diagnosis or therapy framing.', prompt: `Theme: ${entry.theme}\nPrompt: ${entry.prompt}\nReflection: ${entry.content}` }); const [updated] = await db.update(journalEntries).set({ ...result.output, updatedAt: new Date() }).where(eq(journalEntries.id, entry.id)).returning(); return NextResponse.json(updated) } catch { return NextResponse.json({ error: 'Analysis could not be completed. You can retry later.' }, { status: 503 }) } }
