import { env } from '$env/dynamic/private'
import z from 'zod'

export interface TextAnalysis {
  toxicity: number
  language: string
}

const zPerspectiveApiResponse = z.object({
  attributeScores: z.object({
    TOXICITY: z.object({
      summaryScore: z.object({
        value: z.number(),
      }),
    }),
  }),
  languages: z.array(z.string()).min(1),
})

export async function analyzeText(content: string): Promise<TextAnalysis | null> {
  const requestUrl = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${env.GOOGLE_APIKEY}`

  const body = {
    comment: { text: content },
    requestedAttributes: { TOXICITY: {} },
  }

  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      console.error('Failed to analyze text:', response.statusText)
      return null
    }

    const result = zPerspectiveApiResponse.parse(await response.json())

    return {
      toxicity: result.attributeScores.TOXICITY.summaryScore.value,
      language: result.languages[0],
    }
  } catch (error) {
    console.error('Error requesting text analysis:', error)
    return null
  }
}
