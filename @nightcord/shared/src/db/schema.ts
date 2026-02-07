import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'

export const posts = sqliteTable('post', {
  id: integer().primaryKey(),

  nickname: text(),
  content: text().notNull(),
  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),

  authorIp: text().notNull(),
  authorUserAgent: text().notNull(),
  authorCity: text().notNull(),
  authorRegion: text().notNull(),
  authorCountry: text().notNull(),

  loads: integer().notNull().default(0),
  views: integer().notNull().default(0),
})

export const bannedIps = sqliteTable('bannedIp', {
  id: integer().primaryKey(),

  ip: text().notNull(),
  reason: integer().references(() => posts.id),

  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

// For IPv6 we ban entire /64s
export const bannedIp6s = sqliteTable('bannedIp6', {
  id: integer().primaryKey(),

  net: text().notNull(),
  reason: integer().references(() => posts.id),

  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

/*
Some considerations about IPv6:

IPv6 nets are relatively cheap to rent, a dedicated attacker could easily obtain
a /48 which provides them with 65,536 /64s to use. The current ban system is not
designed to handle such a scenario, but it should be sufficient to deal with
casual abuse (from home ISP users without sufficient computer networking
knowledge or a high degree of dedication).
*/
