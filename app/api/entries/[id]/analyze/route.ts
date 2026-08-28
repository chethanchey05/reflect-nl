import { NextResponse } from 'next/server'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import { db, journalEntries } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { getEntry } from '@/lib/server'

const insight = z.object({
  sentiment: z.enum(['Positive', 'Neutral', 'Reflective', 'Challenging', 'Concerned']),
  aiInsight: z.string().min(1).max(700),
  keyThemes: z.array(z.object({ theme: z.string().min(1).max(80), description: z.string().min(1).max(240) })).min(3).max(5),
  deeperReflection: z.array(z.string().min(1).max(300)).min(2).max(4),
  reflectionQuestions: z.array(z.string().min(1).max(280)).min(2).max(3),
})

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const entry = await getEntry((await params).id)
  if (!entry) return NextResponse.json({ error: 'Reflection not found.' }, { status: 404 })
  try {
    const result = await generateText({
      model: process.env.REFLECT_AI_MODEL ?? 'google/gemini-2.5-flash',
      output: Output.object({ schema: insight }),
      system: 'You are Reflect, an intellectually useful reflection companion for technology leaders. Analyze only what the journal supports. Distinguish facts from assumptions. Identify leadership behaviors, tensions, blind spots, root causes, opportunities, and long-term implications. Be specific, constructive, professional, and empathetic. Never make medical, psychological, or diagnostic claims. Return the requested structured JSON only.',
      prompt: `Analyze this journal entry deeply. Do not merely summarize it.\n\nTheme: ${entry.theme}\nPrompt: ${entry.prompt}\nJournal: ${entry.content}`,
    })
    const output = result.output
    const [updated] = await db.update(journalEntries).set({ sentiment: output.sentiment, summary: output.aiInsight, keyThemes: output.keyThemes.map((item) => `${item.theme}: ${item.description}`), deeperReflection: output.deeperReflection, reflectionQuestions: output.reflectionQuestions, followUpQuestion: output.reflectionQuestions[0], updatedAt: new Date() }).where(eq(journalEntries.id, entry.id)).returning()
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Analysis could not be completed. Your reflection is safe. You can retry later.' }, { status: 503 })
  }
}
