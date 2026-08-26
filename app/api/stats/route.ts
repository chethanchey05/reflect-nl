import { NextResponse } from 'next/server'
import { getStats } from '@/lib/server'
export async function GET() { try { return NextResponse.json(await getStats()) } catch { return NextResponse.json({ error: 'Unable to load statistics.' }, { status: 500 }) } }
