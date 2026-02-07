import { env } from '$env/dynamic/private'
import { singleton } from '$lib/util'
import { InferenceClient } from '@huggingface/inference'
import OpenAI from 'openai'

export type RejectVerdict = 'policy-reject' | 'hard-reject'
export type RejectReason = keyof OpenAI.Moderation.Categories

export type TextAnalysis =
  | { verdict: 'accept'; sentiment: number }
  | { verdict: RejectVerdict; reasons: RejectReason[] }

const openai = singleton(() => new OpenAI({ apiKey: env.N25_OPENAI_APIKEY }))
const hf = singleton(() => new InferenceClient(env.N25_HF_APIKEY))

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
    const moderation = await openai().moderations.create({
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

    // proceed to sentiment analysis
    let sentiment: number

    try {
      const result = await hf().textClassification({
        provider: 'hf-inference',
        model: 'distilbert-base-uncased-finetuned-sst-2-english',
        inputs: content,
      })
      sentiment = result[0].label === 'POSITIVE' ? result[0].score : -result[0].score
    } catch (error) {
      console.error('Error calling Hugging Face Inference API:', error)
      // If the sentiment analysis fails, we don't want to reject the post outright, so we just log the error and return a neutral sentiment
      sentiment = 0
    }

    return { verdict: 'accept', sentiment }
  } catch (error) {
    console.error('Error calling OpenAI Moderation API:', error)
    return null
  }
}
