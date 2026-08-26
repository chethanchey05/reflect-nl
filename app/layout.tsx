import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
const geist = Geist({ subsets: ['latin'] })
export const metadata: Metadata = { title: 'Reflect — Digital Journal for Tech Leaders', description: 'Create space to think. Lead with intention.', generator: 'v0.app' }
export const viewport: Viewport = { colorScheme: 'light', themeColor: '#f6f4ee', userScalable: true }
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" className="bg-background"><body className={geist.className}>{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html> }
