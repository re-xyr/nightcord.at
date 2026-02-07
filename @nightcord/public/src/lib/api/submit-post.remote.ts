import { command, getRequestEvent } from '$app/server'
import z from 'zod'

import { analyzeText } from '$lib/server/analyze'
import { posts } from '@nightcord/shared/db/schema'
import { env } from '$env/dynamic/private'
import { N25_PUBLIC_DEPLOYMENT_ENV } from '$env/static/public'
import { Address4, Address6 } from 'ip-address'
import { getRateLimitKey } from '$lib/server/util'

const zTurnstileApiResponse = z.object({
  success: z.boolean(),
  'error-codes': z.array(z.string()).optional(),
})

async function validateTurnstile(token: string, ip: string | null): Promise<boolean> {
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: env.N25_CF_TURNSTILE_SECRET,
        response: token,
        remoteip: ip,
      }),
    })

    if (!response.ok) {
      console.error(`Turnstile verification failed (non-200 status):`, response.statusText)
      return false
    }

    const data = zTurnstileApiResponse.parse(await response.json())
    if (!data.success) console.error(`Turnstile verification unsuccessful:`, data['error-codes'])
    return data.success
  } catch (error) {
    console.error(`Error validating Turnstile token:`, error)
    return false
  }
}

export const submitPost = command(
  z.object({
    nickname: z.string().max(100),
    content: z.string().min(1).max(1000),
    turnstileToken: z.string(),
  }),
  async ({ nickname, content, turnstileToken }) => {
    const { locals } = getRequestEvent()
    console.log('Received post submission:', { content, turnstileToken })

    if (!locals.visitor.ip || !locals.visitor.userAgent) {
      console.error('Request has no origin IP or User-Agent, dropping')
      return {
        success: false,
        error: 'Missing visitor information. Please use a web browser to submit this form.',
      }
    }

    if (
      N25_PUBLIC_DEPLOYMENT_ENV === 'production' &&
      !(await validateTurnstile(turnstileToken, locals.visitor.ip))
    ) {
      return { success: false, error: 'Turnstile validation failed. Please try again.' }
    }

    const { success } = await locals.postRateLimiter.limit({
      key: getRateLimitKey(locals.visitor.ip),
    })
    if (!success) {
      return {
        success: false,
        error: 'Rate limit exceeded. Please wait a while before submitting another post.',
      }
    }

    const analysis = await analyzeText(content)
    if (!analysis) {
      return { success: false, error: 'Text analysis failed. Please try again.' }
    }
    console.log('Text analysis result:', analysis)

    if (analysis.verdict !== 'accept') {
      // TODO: Maybe treat policy-rejects differently later, for now just silently discard them
      // outright
      return { success: true }
    }

    await locals.db.insert(posts).values({
      nickname: nickname?.trim() || null,
      content,
      authorIp: locals.visitor.ip,
      authorUserAgent: locals.visitor.userAgent,
      authorCity: locals.visitor.city ?? 'Unknown',
      authorRegion: locals.visitor.region ?? 'Unknown',
      authorCountry: locals.visitor.country ?? 'ZZ',
      inferredSentiment: analysis.sentiment,
    })
    return { success: true }
  },
)
