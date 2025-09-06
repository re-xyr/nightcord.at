import type { Handle } from '@sveltejs/kit'
import { paraglideMiddleware } from '$lib/paraglide/server'
import { getDb } from '$lib/server/db'

export const handle: Handle = ({ event, resolve }) => {
  event.locals.db = getDb(event.platform!.env.DB)

  return paraglideMiddleware(event.request, ({ request, locale }) => {
    event.request = request

    return resolve(event, {
      transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale),
    })
  })
}
