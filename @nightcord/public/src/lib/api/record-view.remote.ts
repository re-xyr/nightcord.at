import { command, getRequestEvent } from '$app/server'
import z from 'zod'
import { getRateLimitKey } from '$lib/server/util'
import { posts } from '@nightcord/shared/db/schema'
import { eq, sql } from 'drizzle-orm'

export const recordView = command(
  z.object({
    postId: z.number(),
  }),
  async ({ postId }) => {
    const { locals } = getRequestEvent()

    const { success } = await locals.viewRateLimiter.limit({
      key: getRateLimitKey(locals.visitor.ip),
    })

    if (!success) {
      console.warn(`View rate limit exceeded for IP ${locals.visitor.ip}`)
      return { success: true } // Don't block the view, just don't record it
    }

    await locals.db
      .update(posts)
      .set({ views: sql`${posts.views} + 1` })
      .where(eq(posts.id, postId))
    return { success: true }
  },
)
