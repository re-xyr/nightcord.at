import { drizzle } from 'drizzle-orm/d1'
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql'
import * as schema from './schema'
import type { D1Database } from '@cloudflare/workers-types'

export type Database = ReturnType<typeof getDb>
export type PostRow = typeof schema.posts.$inferSelect
export type NewPostRow = typeof schema.posts.$inferInsert

export function getDb(db: D1Database) {
  return drizzle(db, { schema })
}

export function getMockDb() {
  return drizzleLibsql(`file:${import.meta.resolve('../../local.db')}`, { schema })
}
