import { NextResponse } from 'next/server'
import { getPrompt, themeSchema } from '@/lib/reflect'
export async function GET(request: Request) { const theme = new URL(request.url).searchParams.get('theme'); const parsed = themeSchema.safeParse(theme); if (!parsed.success) return NextResponse.json({ error: 'Invalid theme.' }, { status: 400 }); return NextResponse.json({ prompt: getPrompt(parsed.data) }) }
