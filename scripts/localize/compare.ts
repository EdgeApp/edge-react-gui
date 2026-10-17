import { sha256 } from './common'

export type Bucket = 'identical' | 'trivial' | 'different'

export function bucketOf(existing: string, ai: string): Bucket {
  if (existing === ai) return 'identical'
  if (normalize(existing) === normalize(ai)) return 'trivial'
  return 'different'
}

/**
 * Folds the differences a reader would not notice:
 * case, spacing, quote and ellipsis styles, and trailing punctuation.
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’‚‛`´]/g, "'")
    .replace(/[“”„‟«»「」『』]/g, '"')
    .replace(/…/g, '...')
    .replace(/\s+/g, ' ')
    .replace(/[\s.!?:;。！？：；]+$/u, '')
    .trim()
}

export function existingIsA(key: string): boolean {
  return parseInt(sha256(key).slice(0, 2), 16) % 2 === 0
}

/** A sample that stays the same between runs: the first keys by hash. */
export function stableSample<T extends { key: string }>(
  items: T[],
  size: number
): T[] {
  return [...items]
    .sort((a, b) => sha256(a.key).localeCompare(sha256(b.key)))
    .slice(0, size)
}

export interface ThresholdCheck {
  threshold: number
  /** Different pairs Jev scored at or above the threshold. */
  pairs: number
  /** The judge's verdicts on those pairs. */
  verdicts: Record<string, number>
}

/**
 * Shows what the pre-filter would skip at each threshold,
 * against what the judge said about the same pairs.
 */
export function checkThresholds(
  scores: Map<string, number>,
  verdicts: Map<string, string>,
  thresholds: number[]
): ThresholdCheck[] {
  return thresholds.map(threshold => {
    const result: ThresholdCheck = { threshold, pairs: 0, verdicts: {} }
    for (const [key, score] of scores) {
      const verdict = verdicts.get(key)
      if (score < threshold || verdict == null) continue
      ++result.pairs
      result.verdicts[verdict] = (result.verdicts[verdict] ?? 0) + 1
    }
    return result
  })
}
