import { NextResponse } from 'next/server'
import { getStats } from '@/lib/server'
export async function GET() { try { const stats = await getStats(); return NextResponse.json({ current: stats.current, longest: stats.longest }) } catch { return NextResponse.json({ error: 'Unable to load streak.' }, { status: 500 }) } }
