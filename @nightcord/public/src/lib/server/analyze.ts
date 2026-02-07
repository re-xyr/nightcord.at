import { env } from '$env/dynamic/private'
import OpenAI from 'openai'

type RejectVerdict = 'policy-reject' | 'hard-reject'
type RejectReason = keyof OpenAI.Moderation.Categories

export type TextAnalysis =
  | { verdict: 'accept' }
  | { verdict: RejectVerdict; reasons: RejectReason[] }

const openai = new OpenAI({ apiKey: env.N25_OPENAI_APIKEY })

const hardRejectCategories: RejectReason[] = [
  'sexual/minors',
  'harassment/threatening',
  'hate',
  'hate/threatening',
  'self-harm/instructions',
]

const policyRejectThresholds: Partial<Record<RejectReason, number>> = {
  harassment: 0.8,
  'illicit/violent': 0.8,
  'self-harm': 0.8,
  'violence/graphic': 0.8,
}

export async function analyzeText(content: string): Promise<TextAnalysis | null> {
  try {
    const moderation = await openai.moderations.create({
      model: 'omni-moderation-latest',
      input: content,
    })

    if (moderation.results.length === 0) {
      console.error('OpenAI Moderation API returned no results')
      return null
    }

    const [result] = moderation.results

    for (const category of hardRejectCategories) {
      if (result.categories[category]) {
        return { verdict: 'hard-reject', reasons: [category] }
      }
    }

    const policyRejectReasons: RejectReason[] = []
    for (const [category, threshold] of Object.entries(policyRejectThresholds)) {
      if (result.category_scores[category as RejectReason] >= threshold) {
        policyRejectReasons.push(category as RejectReason)
      }
    }

    if (policyRejectReasons.length > 0) {
      return { verdict: 'policy-reject', reasons: policyRejectReasons }
    }

    return { verdict: 'accept' }
  } catch (error) {
    console.error('Error calling OpenAI Moderation API:', error)
    return null
  }
}
