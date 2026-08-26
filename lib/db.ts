import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { pgTable, text, timestamp, uuid, jsonb, index } from 'drizzle-orm/pg-core'

export const journalEntries = pgTable('journal_entries', { id: uuid('id').defaultRandom().primaryKey(), workspaceId: text('workspace_id').notNull(), theme: text('theme').notNull(), prompt: text('prompt').notNull(), content: text('content').notNull(), sentiment: text('sentiment'), summary: text('summary'), keyThemes: jsonb('key_themes').$type<string[]>().notNull().default([]), followUpQuestion: text('follow_up_question'), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow() }, (table) => ({ workspaceCreated: index('journal_entries_workspace_created_idx').on(table.workspaceId, table.createdAt), workspaceTheme: index('journal_entries_workspace_theme_idx').on(table.workspaceId, table.theme) }))

export const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
export const db = drizzle(pool, { schema: { journalEntries } })
