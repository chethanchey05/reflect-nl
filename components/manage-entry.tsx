'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Entry = { id: string; theme: string; prompt: string; content: string }

export function ManageEntry({ entry }: { entry: Entry }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [prompt, setPrompt] = useState(entry.prompt)
  const [content, setContent] = useState(entry.content)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const save = async () => { if (!prompt.trim() || !content.trim()) return setError('Prompt and reflection content are required.'); setBusy(true); setError(''); try { const res = await fetch(`/api/entries/${entry.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, content }) }); if (!res.ok) throw new Error(); setEditing(false); router.refresh(); window.location.reload() } catch { setError('Unable to update this reflection. Please try again.') } finally { setBusy(false) } }
  const remove = async () => { if (!window.confirm('Delete this reflection permanently?')) return; setBusy(true); setError(''); try { const res = await fetch(`/api/entries/${entry.id}`, { method: 'DELETE' }); if (!res.ok) throw new Error(); router.push('/past-reflections'); router.refresh() } catch { setError('Unable to delete this reflection. Please try again.'); setBusy(false) } }
  return <section className="mt-8 rounded-2xl border border-border bg-card p-4"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Manage reflection</p><div className="flex gap-2"><button type="button" onClick={()=>setEditing(!editing)} disabled={busy} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary">{editing?'Cancel':'Edit'}</button><button type="button" onClick={remove} disabled={busy} className="rounded-full border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10">{busy?'Working...':'Delete'}</button></div></div>{editing&&<div className="mt-4 space-y-3"><label className="block text-xs font-medium text-muted-foreground">Prompt<input value={prompt} onChange={e=>setPrompt(e.target.value)} className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" /></label><label className="block text-xs font-medium text-muted-foreground">Reflection<textarea value={content} onChange={e=>setContent(e.target.value)} rows={7} className="mt-1 w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm leading-6 outline-none focus:ring-2 focus:ring-ring" /></label>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<button type="button" onClick={save} disabled={busy} className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">{busy?'Saving...':'Save changes'}</button></div>}{!editing&&error&&<p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}</section>
}
