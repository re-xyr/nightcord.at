import type { Handle } from '@sveltejs/kit'
import { paraglideMiddleware } from '$lib/paraglide/server'
import { getDb, getMockDb, type Database } from '@nightcord/shared/db'
import { N25_PUBLIC_DEPLOYMENT_ENV } from '$env/static/public'

export const handle: Handle = ({ event, resolve }) => {
  event.locals = {
    db:
      N25_PUBLIC_DEPLOYMENT_ENV === 'development'
        ? (getMockDb() as unknown as Database)
        : getDb(event.platform!.env.DB),
    postRateLimiter: event.platform!.env.POST_RATE_LIMITER,
    viewRateLimiter: event.platform!.env.VIEW_RATE_LIMITER,
    workerCtx: event.platform!.ctx,
    cf: event.platform!.cf,
  }

  return paraglideMiddleware(event.request, ({ request, locale }) => {
    event.request = request

    return resolve(event, {
      transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale),
    })
  })
}
