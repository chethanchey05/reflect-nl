import { NextResponse } from 'next/server'
import { generateText, Output } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
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

const gatewayModels = [
  process.env.REFLECT_AI_MODEL,
  'google/gemini-2.5-flash',
  'google/gemini-2.5-flash-lite',
  'anthropic/claude-3-haiku',
  'openai/gpt-4.1-mini',
].filter((model, index, list): model is string => Boolean(model) && list.indexOf(model) === index)

const models = [
  ...(process.env.GEMINI_API_KEY_2 ? [createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY_2 })('gemini-2.5-flash')] : []),
  ...gatewayModels,
]

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const entry = await getEntry((await params).id)
  if (!entry) return NextResponse.json({ error: 'Reflection not found.' }, { status: 404 })
  const prompt = `Analyze this journal entry deeply. Do not merely summarize it. Return specific, constructive guidance grounded only in the writing.\n\nTheme: ${entry.theme}\nPrompt: ${entry.prompt}\nJournal: ${entry.content}`
  let lastError: unknown
  for (const model of models) {
    if (!model) continue
    try {
      const result = await generateText({
        model,
        output: Output.object({ schema: insight }),
        system: 'You are Reflect, an intellectually useful reflection companion for technology leaders. Identify the central insight, key themes with brief explanations, deeper observations, and thoughtful questions. Never make medical, psychological, or diagnostic claims. Return structured JSON only.',
        prompt,
      })
      const output = result.output
      const [updated] = await db.update(journalEntries).set({ sentiment: output.sentiment, summary: output.aiInsight, keyThemes: output.keyThemes.map((item) => `${item.theme}: ${item.description}`), deeperReflection: output.deeperReflection, reflectionQuestions: output.reflectionQuestions, followUpQuestion: output.reflectionQuestions[0], updatedAt: new Date() }).where(eq(journalEntries.id, entry.id)).returning()
      return NextResponse.json(updated)
    } catch (error) {
      lastError = error
    }
  }
  console.error('[v0] All reflection insight models failed', lastError)
  return NextResponse.json({ error: 'AI insight is temporarily unavailable. Your reflection is safe and can be analyzed again.' }, { status: 503 })
}

export const maxDuration = 60
