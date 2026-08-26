import { describe, expect, it } from 'vitest'
import { calculateStreak, getPrompt, themeDetails, themes } from '../lib/reflect'

describe('Reflect domain logic', () => {
  it('contains exactly five themes', () => expect(themes).toHaveLength(5))
  it('keeps generated prompts inside the selected theme', () => { const theme = 'Team Impact' as const; expect(themeDetails[theme].prompts).toContain(getPrompt(theme)) })
  it('deduplicates same-day entries and breaks gaps', () => { const days = [new Date('2026-08-26T10:00:00Z'), new Date('2026-08-26T12:00:00Z'), new Date('2026-08-25T08:00:00Z'), new Date('2026-08-23T08:00:00Z')]; const result = calculateStreak(days); expect(result.longest).toBe(2) })
})
