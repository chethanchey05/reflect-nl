import { NextResponse } from 'next/server'
import { db, journalEntries } from '@/lib/db'
import { getEntry } from '@/lib/server'
import { eq } from 'drizzle-orm'

const positiveWords = ['progress', 'success', 'proud', 'clear', 'improved', 'strong', 'confident', 'learned', 'celebrate', 'effective']
const concernWords = ['risk', 'blocked', 'pressure', 'worried', 'concern', 'friction', 'debt', 'unclear', 'shortage', 'failure', 'mistake']
const themeSignals: Record<string, string[]> = {
  'Technical health': ['technical', 'architecture', 'testing', 'test', 'reliability', 'debt', 'code', 'system', 'quality'],
  'Delivery and execution': ['delivery', 'ship', 'deadline', 'predictability', 'roadmap', 'release', 'execution', 'shortcut'],
  'Business alignment': ['business', 'customer', 'stakeholder', 'roi', 'value', 'metric', 'outcome', 'revenue'],
  'Team leadership': ['team', 'engineer', 'coaching', 'leadership', 'collaboration', 'feedback', 'safety', 'people'],
  'Organizational influence': ['organization', 'culture', 'cross-team', 'process', 'influence', 'hiring', 'org'],
}

function countMatches(text: string, words: string[]) {
  return words.reduce((count, word) => count + (text.includes(word) ? 1 : 0), 0)
}

function analyzeReflection(content: string, theme: string) {
  const normalized = content.toLowerCase()
  const concerns = countMatches(normalized, concernWords)
  const positives = countMatches(normalized, positiveWords)
  const sentiment = concerns > positives ? 'Challenging' : positives > concerns ? 'Positive' : 'Reflective'
  const themes = Object.entries(themeSignals).map(([label, signals]) => ({ label, score: countMatches(normalized, signals) })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 4)
  const keyThemes = (themes.length ? themes : [{ label: theme, score: 1 }]).map(({ label }) => `${label}: This reflection connects to your focus on ${label.toLowerCase()}.`)
  const firstSentence = content.trim().split(/(?<=[.!?])\s+/)[0] ?? content.trim()
  const insight = concerns > positives
    ? `Your reflection surfaces meaningful tension around ${theme.toLowerCase()}. The clearest opportunity is to turn the concern you named into one small, visible leadership action.`
    : positives > concerns
      ? `Your reflection shows momentum in ${theme.toLowerCase()}. Capture what made this progress possible so it can become a repeatable leadership practice.`
      : `Your reflection is thoughtfully examining ${theme.toLowerCase()}. Naming the decision, trade-off, or pattern underneath your observation can help turn awareness into action.`
  const deeperReflection = [
    `The opening of your reflection points to: “${firstSentence.slice(0, 180)}${firstSentence.length > 180 ? '…' : ''}”`,
    concerns ? 'There is a tension worth making explicit: what matters most now, and what are you intentionally choosing not to optimize yet?' : 'Look for the behavior or decision behind the outcome, not only the outcome itself.',
  ]
  const reflectionQuestions = [
    `What is one concrete action you can take this week to strengthen ${theme.toLowerCase()}?`,
    concerns ? 'What support, constraint, or conversation would make this challenge easier to address?' : 'How will you know that this insight has changed the way you lead?',
  ]
  return { sentiment, summary: insight, keyThemes, deeperReflection, reflectionQuestions, followUpQuestion: reflectionQuestions[0] }
}

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const entry = await getEntry((await params).id)
  if (!entry) return NextResponse.json({ error: 'Reflection not found.' }, { status: 404 })
  const output = analyzeReflection(entry.content, entry.theme)
  const [updated] = await db.update(journalEntries).set({ sentiment: output.sentiment, summary: output.summary, keyThemes: output.keyThemes, deeperReflection: output.deeperReflection, reflectionQuestions: output.reflectionQuestions, followUpQuestion: output.followUpQuestion, updatedAt: new Date() }).where(eq(journalEntries.id, entry.id)).returning()
  return NextResponse.json(updated)
}

export const maxDuration = 10
