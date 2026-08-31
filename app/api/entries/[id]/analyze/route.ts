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

function analyzeReflection(content: string, theme: string, variant = 0) {
  const normalized = content.toLowerCase()
  const variation = variant % 5
  const concerns = countMatches(normalized, concernWords)
  const positives = countMatches(normalized, positiveWords)
  const sentiment = concerns > positives ? 'Challenging' : positives > concerns ? 'Positive' : 'Reflective'
  const themes = Object.entries(themeSignals).map(([label, signals]) => ({ label, score: countMatches(normalized, signals) })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 4)
  const keyThemes = (themes.length ? themes : [{ label: theme, score: 1 }]).map(({ label }) => `${label}: This reflection connects to your focus on ${label.toLowerCase()}.`)
  const firstSentence = content.trim().split(/(?<=[.!?])\s+/)[0] ?? content.trim()
  const focus = theme.toLowerCase()
  const insights = [
    concerns > positives ? `Your reflection surfaces tension around ${focus}. Turn the concern into one small, visible leadership action.` : `Your reflection shows momentum in ${focus}. Capture what made this progress possible and make it repeatable.`,
    `A useful pattern is emerging in how you approach ${focus}. Notice which choices are within your control and which need a deliberate conversation.`,
    `Your reflection connects today’s experience to the longer-term practice of leading ${focus}. The next step is to make the principle you named observable.`,
    `There is a leadership decision underneath this reflection about ${focus}. Clarifying the trade-off may help you move forward with more confidence.`,
    `This reflection offers a grounded view of ${focus}. Use it as a signal: decide what to continue, what to change, and what to learn next.`,
  ]
  const deeperPrompts = [
    concerns ? 'What matters most right now, and what are you intentionally choosing not to optimize yet?' : 'Look for the behavior behind the outcome, not only the outcome itself.',
    'Who else sees this situation differently, and what could their perspective reveal?',
    'What assumption is shaping your current decision, and how could you test it?',
    'If you revisit this reflection in a month, what evidence would show meaningful progress?',
    'What would a thoughtful version of “more” or “less” look like in this situation?',
  ]
  const questionPrompts = [
    `What is one concrete action you can take this week to strengthen ${focus}?`,
    `What conversation would create the most leverage for ${focus}?`,
    `Which assumption about ${focus} deserves to be tested next?`,
    `What evidence will tell you that your approach to ${focus} is working?`,
    `What would you advise another leader facing this same ${focus} challenge?`,
  ]
  const insight = insights[variation]
  const deeperReflection = [
    `The opening of your reflection points to: “${firstSentence.slice(0, 180)}${firstSentence.length > 180 ? '…' : ''}”`,
    deeperPrompts[variation],
  ]
  const reflectionQuestions = [questionPrompts[variation], concerns ? 'What support, constraint, or conversation would make this challenge easier to address?' : 'How will you know that this insight has changed the way you lead?']
  return { sentiment, summary: insight, keyThemes, deeperReflection, reflectionQuestions, followUpQuestion: reflectionQuestions[0] }
}

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const entry = await getEntry((await params).id)
  if (!entry) return NextResponse.json({ error: 'Reflection not found.' }, { status: 404 })
  const variant = Array.from(entry.id).reduce((sum, character) => sum + character.charCodeAt(0), 0) % 5
  const output = analyzeReflection(entry.content, entry.theme, variant)
  const [updated] = await db.update(journalEntries).set({ sentiment: output.sentiment, summary: output.summary, keyThemes: output.keyThemes, deeperReflection: output.deeperReflection, reflectionQuestions: output.reflectionQuestions, followUpQuestion: output.followUpQuestion, updatedAt: new Date() }).where(eq(journalEntries.id, entry.id)).returning()
  return NextResponse.json(updated)
}

export const maxDuration = 10
