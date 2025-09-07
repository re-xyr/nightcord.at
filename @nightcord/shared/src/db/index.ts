import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'
import type { D1Database } from '@cloudflare/workers-types'

export type Database = ReturnType<typeof getDb>

export function getDb(db: D1Database) {
  return drizzle(db, { schema })
}
