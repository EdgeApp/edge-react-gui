import {
  asEither,
  asJSON,
  asNumber,
  asObject,
  asOptional,
  asString,
  asValue
} from 'cleaners'

import type { TokenLedger } from './ledger'
import { delay } from './llm'

export type JevQuestion =
  | { type: 'noul'; instructions: string }
  | {
      type: 'choice'
      instructions: string
      /** Option name to an optional description, at least two options. */
      criteria: Record<string, string | null>
    }

const asJevAnswer = asEither(
  asObject({ type: asValue('noul'), noul: asNumber }),
  asObject({ type: asValue('choice'), choice: asString, confidence: asNumber })
)
export type JevAnswer = ReturnType<typeof asJevAnswer>

const asJevResponse = asJSON(
  asObject({
    answers: asObject(asJevAnswer),
    usage: asOptional(
      asObject({ input_tokens: asNumber, output_tokens: asNumber })
    )
  })
)

const JEV_URL = 'https://api.typesafe.ai/v1/systemone'
const MAX_ATTEMPTS = 4

/**
 * Client for Jev (TypeSafe System One), a decision model that answers
 * yes/no, pick-one and rating questions about a text state.
 * Reads TYPESAFE_API_KEY. When the key is unset the client is disabled:
 * callers check `enabled` and skip their Jev checks.
 */
export class JevClient {
  readonly enabled: boolean
  private readonly apiKey: string

  constructor(private readonly ledger: TokenLedger) {
    this.apiKey = process.env.TYPESAFE_API_KEY ?? ''
    this.enabled = this.apiKey !== ''
    if (!this.enabled) {
      console.warn('TYPESAFE_API_KEY is not set: skipping the Jev checks.')
    }
  }

  async ask<Ids extends string>(
    state: string,
    questions: Record<Ids, JevQuestion>
  ): Promise<Record<Ids, JevAnswer>> {
    if (!this.enabled) throw new Error('Jev is disabled')
    let lastError: unknown
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; ++attempt) {
      let response: Response
      let text: string
      try {
        response = await fetch(JEV_URL, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${this.apiKey}`,
            'content-type': 'application/json'
          },
          body: JSON.stringify({ model: 'jev-latest', state, questions })
        })
        text = await response.text()
      } catch (error: unknown) {
        lastError = error
        await delay(1000 * 2 ** attempt)
        continue
      }
      if (response.ok) {
        const result = asJevResponse(text)
        this.ledger.addJev(
          result.usage?.input_tokens ?? 0,
          result.usage?.output_tokens ?? 0
        )
        for (const id of Object.keys(questions)) {
          if (result.answers[id] == null) {
            throw new Error(`Jev did not answer ${id}`)
          }
        }
        return result.answers as Record<Ids, JevAnswer>
      }
      lastError = new Error(`Jev ${response.status}: ${text.slice(0, 300)}`)
      if (response.status !== 429 && response.status < 500) break
      await delay(1000 * 2 ** attempt)
    }
    throw lastError
  }
}

export function noulOf(answer: JevAnswer): number {
  if (answer.type !== 'noul') throw new Error('Expected a noul answer')
  return answer.noul
}

export function choiceOf(answer: JevAnswer): string {
  if (answer.type !== 'choice') throw new Error('Expected a choice answer')
  return answer.choice
}
