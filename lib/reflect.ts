import { z } from 'zod'

export const themes = ['Technology Impact', 'Delivery Impact', 'Business Impact', 'Team Impact', 'Org Impact'] as const
export type Theme = (typeof themes)[number]

export const themeDetails: Record<Theme, { description: string; icon: string; prompts: string[] }> = {
  'Technology Impact': { description: 'Technical health, engineering excellence, architecture, testing, and long-term decisions.', icon: '◈', prompts: ['How do I balance short-term delivery pressures with long-term technical health?', 'Are we investing enough in automated testing and continuous delivery?', 'How am I helping engineers develop skills that will sustain technical excellence?'] },
  'Delivery Impact': { description: 'Delivery quality, predictability, execution, mistakes, trade-offs, and quality.', icon: '↗', prompts: ["What's one recent delivery mistake we made, and how can we ensure it doesn't happen again?", 'When have I felt pressure to compromise on quality or take shortcuts? How did I respond?', 'How can I foster predictability in delivery without adding stress?'] },
  'Business Impact': { description: "Engineering's relationship with business outcomes, stakeholders, ROI, and measurable value.", icon: '◎', prompts: ['How do I ensure that stakeholders see engineering as a strategic partner rather than a service function?', 'What’s one business metric I should pay more attention to as a tech leader?', 'Have I effectively explained the ROI of a technical initiative to a stakeholder?'] },
  'Team Impact': { description: 'Leadership, collaboration, coaching, psychological safety, and team development.', icon: '✦', prompts: ['How well do I adjust my leadership style based on the situation and individual?', 'Have I created a space where people feel safe to speak up and challenge ideas?', 'What’s one strength in a team member I should actively help them develop?'] },
  'Org Impact': { description: 'Organizational influence, engineering culture, cross-team improvements, and broader contribution.', icon: '⊹', prompts: ['How have I contributed beyond my immediate role in the organization?', 'What’s one improvement I could propose that would benefit multiple teams?', 'Am I actively advocating for a strong engineering culture that attracts the right people?'] },
}

export const themeSchema = z.enum(themes)
export const entrySchema = z.object({ theme: themeSchema, prompt: z.string().min(1).max(500), content: z.string().trim().min(1, 'Reflection cannot be empty').max(30000) })
export type EntryInput = z.infer<typeof entrySchema>

export function getPrompt(theme: Theme, exclude?: string) {
  const pool = themeDetails[theme].prompts.filter((prompt) => prompt !== exclude)
  return pool[Math.floor(Math.random() * pool.length)] ?? themeDetails[theme].prompts[0]
}

export function calculateStreak(dates: Date[]) {
  const days = [...new Set(dates.map((date) => date.toISOString().slice(0, 10)))].sort().reverse()
  if (!days.length) return { current: 0, longest: 0 }
  const toDay = (value: string) => new Date(`${value}T00:00:00Z`).getTime()
  let longest = 1; let run = 1
  for (let index = 1; index < days.length; index++) { if (toDay(days[index - 1]) - toDay(days[index]) === 86400000) run += 1; else run = 1; longest = Math.max(longest, run) }
  const today = new Date(); const todayKey = today.toISOString().slice(0, 10); const yesterdayKey = new Date(today.getTime() - 86400000).toISOString().slice(0, 10)
  let current = days[0] === todayKey || days[0] === yesterdayKey ? 1 : 0
  for (let index = 1; current && index < days.length; index++) { if (toDay(days[index - 1]) - toDay(days[index]) === 86400000) current += 1; else break }
  return { current, longest }
}
