import { getRequestEvent, query } from '$app/server'
import { posts } from '@nightcord/shared/db/schema'
import { inArray, max, sql } from 'drizzle-orm'
import z from 'zod'

export type PostView = ReturnType<typeof makePostView>

function makePostView(post: typeof posts.$inferSelect) {
  return {
    id: post.id,
    nickname: post.nickname,
    content: post.content,
    createdAt: post.createdAt,
    authorCity: post.authorCity,
    authorRegion: post.authorRegion,
    authorCountry: post.authorCountry,
    loads: post.loads,
    views: post.views,
  }
}

export const getPosts = query(
  z.object({
    maxEntries: z.int().min(1).max(500),
  }),
  async ({ maxEntries }) => {
    const { locals } = getRequestEvent()

    const [{ maxId }] = await locals.db.select({ maxId: max(posts.id) }).from(posts)
    const nSamples = maxEntries / 0.98 // Account for some post-hoc rejected posts

    let sampledPosts: (typeof posts.$inferSelect)[] = []
    if (!maxId || maxId < nSamples) {
      // no point in sampling, just return everything
      sampledPosts = await locals.db
        .select()
        .from(posts)
        .orderBy(sql`random()`)
        .limit(maxEntries)
    } else {
      // Sample 2 rounds max, give up after that
      for (let i = 0; i < 2; i++) {
        const sampleIds = new Array(nSamples)
          .fill(null)
          .map(() => Math.floor(Math.random() * maxId) + 1)

        // The # of rows read is linear to nSamples since we have an index on the PK.
        sampledPosts.push(
          ...(await locals.db
            .select()
            .from(posts)
            .where(inArray(posts.id, sampleIds))
            .orderBy(sql`random()`)
            .limit(maxEntries)),
        )

        if (sampledPosts.length >= maxEntries) break
      }
    }

    // Update load counts for the sampled posts. Maybe use an asynchronous approach in the future
    // if this turns out to be a bottleneck.
    await locals.db
      .update(posts)
      .set({ loads: sql`${posts.loads} + 1` })
      .where(
        inArray(
          posts.id,
          sampledPosts.map((p) => p.id),
        ),
      )

    return sampledPosts.slice(0, maxEntries).map(makePostView)
  },
)
