import { NextResponse } from 'next/server'
import { getEntry } from '@/lib/server'
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { try { const entry = await getEntry((await params).id); return entry ? NextResponse.json(entry) : NextResponse.json({ error: 'Reflection not found.' }, { status: 404 }) } catch { return NextResponse.json({ error: 'Unable to load reflection.' }, { status: 500 }) } }
