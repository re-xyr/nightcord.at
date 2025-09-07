import { getRequestEvent, query } from '$app/server'
import { posts } from '$lib/server/db/schema'
import { eq } from 'drizzle-orm'
import { sql } from 'drizzle-orm/sql/sql'

const SAMPLE_SIZE = 10

export const getPosts = query(async () => {
  const { locals } = getRequestEvent()
  const sampledPosts = await locals.db
    .select()
    .from(posts)
    .where(eq(posts.status, 'approved'))
    .orderBy(sql`RANDOM()`) // TODO: this is effectively a full table scan, find a better way
    .limit(SAMPLE_SIZE)

  return sampledPosts.map(post => ({
    content: post.content,
    language: post.inferredLanguage,
    createdAt: post.createdAt,
    authorCity: post.authorCity,
    authorRegion: post.authorRegion,
    authorCountry: post.authorCountry,
  }))
})
