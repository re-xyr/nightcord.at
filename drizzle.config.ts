import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/lib/server/db/schema.ts',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env['N25_CF_ACCOUNT_ID']!,
    databaseId: process.env['N25_CF_D1_DATABASE_ID']!,
    token: process.env['N25_CF_D1_DATABASE_TOKEN']!,
  },

  verbose: true,
  strict: true,
})
