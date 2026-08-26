import { NextResponse } from 'next/server'
import { themeDetails, themes } from '@/lib/reflect'
export async function GET() { return NextResponse.json(themes.map((theme) => ({ theme, ...themeDetails[theme] }))) }
