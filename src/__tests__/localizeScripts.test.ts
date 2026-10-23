import { describe, expect, it } from '@jest/globals'

import {
  chunk,
  extractJsonObject,
  mapPool,
  parseArgs,
  placeholderProblem,
  sprintfTokens
} from '../../scripts/localize/common'
import {
  distinctSites,
  usageFilesOf,
  type UsageSite
} from '../../scripts/localize/usage'

describe('sprintfTokens', () => {
  it('finds plain, positional and literal tokens, sorted', () => {
    expect(sprintfTokens('Send %2$s to %1$s at 100%% and %d')).toEqual([
      '%%',
      '%1$s',
      '%2$s',
      '%d'
    ])
  })

  it('ignores a percent sign that is not a token', () => {
    expect(sprintfTokens('5 % fee')).toEqual([])
  })
})

describe('placeholderProblem', () => {
  it('accepts reordered positional tokens', () => {
    expect(placeholderProblem('%1$s to %2$s', '%2$s から %1$s')).toBe(undefined)
  })

  it('reports a dropped or changed token', () => {
    expect(placeholderProblem('Send %s', 'Invia')).toBe(
      'placeholders [%s] became []'
    )
    expect(placeholderProblem('Send %1$s', 'Invia %s')).toBe(
      'placeholders [%1$s] became [%s]'
    )
  })

  it('reports a changed line-break count', () => {
    expect(placeholderProblem('One\nTwo', 'Uno Due')).toBe(
      '1 newlines became 0'
    )
  })
})

describe('extractJsonObject', () => {
  it('reads an object wrapped in a code fence', () => {
    expect(extractJsonObject('```json\n{"a": "b"}\n```')).toEqual({ a: 'b' })
  })

  it('throws when the reply has no object', () => {
    expect(() => extractJsonObject('no json here')).toThrow('No JSON object')
  })
})

describe('chunk', () => {
  it('splits into fixed-size pieces with a short last piece', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    expect(chunk([], 2)).toEqual([])
  })
})

describe('mapPool', () => {
  it('keeps result order and caps the promises in flight', async () => {
    let active = 0
    let peak = 0
    // Each item yields to the event loop a different number of times:
    const results = await mapPool([3, 1, 2, 0], 2, async (yields, index) => {
      ++active
      peak = Math.max(peak, active)
      for (let i = 0; i < yields; ++i) await Promise.resolve()
      --active
      return index * 10
    })
    expect(results).toEqual([0, 10, 20, 30])
    expect(peak).toBe(2)
  })
})

describe('parseArgs', () => {
  it('reads values and bare flags', () => {
    const args = parseArgs(['--locale', 'es,it', '--compare', '--limit', '5'])
    expect(args.get('locale')).toBe('es,it')
    expect(args.get('compare')).toBe('true')
    expect(args.get('limit')).toBe('5')
  })

  it('rejects a positional argument', () => {
    expect(() => parseArgs(['es'])).toThrow('Unexpected argument es')
  })
})

describe('distinctSites', () => {
  const site = (file: string, component: string, line: number): UsageSite => ({
    file,
    component,
    line,
    snippet: ''
  })

  it('keeps one site per file and component', () => {
    const sites = [
      site('src/a.tsx', 'A', 1),
      site('src/a.tsx', 'A', 9),
      site('src/a.tsx', 'B', 20),
      site('src/b.tsx', 'A', 3)
    ]
    expect(distinctSites(sites).map(item => item.line)).toEqual([1, 20, 3])
    expect(usageFilesOf(sites)).toEqual(['src/a.tsx', 'src/b.tsx'])
  })
})
