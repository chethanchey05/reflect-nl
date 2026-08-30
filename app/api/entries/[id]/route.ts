import { NextResponse } from 'next/server'
import { getEntry, updateEntry, deleteEntry } from '@/lib/server'
import { themes } from '@/lib/reflect'

async function getId(params: Promise<{ id: string }>) { return (await params).id }

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const entry = await getEntry(await getId(params)); return entry ? NextResponse.json(entry) : NextResponse.json({ error: 'Reflection not found.' }, { status: 404 }) } catch { return NextResponse.json({ error: 'Unable to load reflection.' }, { status: 500 }) }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json()
    const content = typeof body.content === 'string' ? body.content.trim() : undefined
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : undefined
    const theme = typeof body.theme === 'string' ? body.theme : undefined
    if (!content && !prompt && !theme) return NextResponse.json({ error: 'Add a change before saving.' }, { status: 400 })
    if (content !== undefined && !content) return NextResponse.json({ error: 'Reflection content cannot be empty.' }, { status: 400 })
    if (prompt !== undefined && !prompt) return NextResponse.json({ error: 'Prompt cannot be empty.' }, { status: 400 })
    if (theme !== undefined && !themes.includes(theme as (typeof themes)[number])) return NextResponse.json({ error: 'Invalid reflection theme.' }, { status: 400 })
    const entry = await updateEntry(await getId(params), { content, prompt, theme: theme as (typeof themes)[number] | undefined })
    return entry ? NextResponse.json(entry) : NextResponse.json({ error: 'Reflection not found.' }, { status: 404 })
  } catch { return NextResponse.json({ error: 'Unable to update reflection.' }, { status: 500 }) }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const removed = await deleteEntry(await getId(params)); return removed ? NextResponse.json({ success: true }) : NextResponse.json({ error: 'Reflection not found.' }, { status: 404 }) } catch { return NextResponse.json({ error: 'Unable to delete reflection.' }, { status: 500 }) }
}
