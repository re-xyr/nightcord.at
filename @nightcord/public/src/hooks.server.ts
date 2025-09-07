import type { Handle } from '@sveltejs/kit'
import { paraglideMiddleware } from '$lib/paraglide/server'
import { getDb } from '@nightcord/shared/db'
import { N25_PUBLIC_DEPLOYMENT_ENV } from '$env/static/public'

export const handle: Handle = ({ event, resolve }) => {
  event.locals = {
    db: getDb(event.platform!.env.DB),
    visitor: {
      ip:
        N25_PUBLIC_DEPLOYMENT_ENV === 'dev'
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
