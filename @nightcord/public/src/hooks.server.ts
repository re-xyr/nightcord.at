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
    visitor: {
      ip:
        N25_PUBLIC_DEPLOYMENT_ENV === 'development'
          ? '::1'
          : (event.request.headers.get('cf-connecting-ip') ?? null),
      userAgent: event.request.headers.get('user-agent') ?? null,
      country: event.request.headers.get('cf-ipcountry') ?? null,
      region: event.request.headers.get('cf-region') ?? null,
      city: event.request.headers.get('cf-ipcity') ?? null,
    },
  }

  console.log('Visitor metadata:', event.locals.visitor)

  return paraglideMiddleware(event.request, ({ request, locale }) => {
    event.request = request

    return resolve(event, {
      transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale),
    })
  })
}
