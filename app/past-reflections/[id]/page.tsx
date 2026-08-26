import { EntryDetail } from '@/components/reflect-app'
export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <EntryDetail id={(await params).id} /> }
