import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core'

export const posts = sqliteTable('post', {
  id: integer().primaryKey(),

  nickname: text(),
  content: text().notNull(),
  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),

  authorIp: text().notNull(),
  authorUserAgent: text(),
  authorCity: text().notNull(),
  authorRegion: text().notNull(),
  authorCountry: text().notNull(),

  loads: integer().notNull().default(0),
  views: integer().notNull().default(0),

  // -1 to 1, negative to positive
  inferredSentiment: real().notNull().default(0),
  // We display crisis resources if true
  inferredSelfHarmIntent: integer({ mode: 'boolean' }).notNull().default(false),
})
