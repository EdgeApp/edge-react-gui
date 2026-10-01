import { describe, expect, it } from '@jest/globals'
import type { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'

import { jsonReplacer, stringifyJson } from '../../cli/engine/json'
import { findWallet } from '../../cli/engine/resolve'
import { base58, utf8 } from '../../util/encoding'

/** The error shape `engineError` produces. */
function thrown(fn: () => unknown): { code: string; status: number } {
  try {
    fn()
  } catch (error) {
    const engineError = error as { code: string; status: number }
    return { code: engineError.code, status: engineError.status }
  }
  throw new Error('expected a throw')
}

describe('jsonReplacer', () => {
  it('encodes a Uint8Array as base64', () => {
    expect(jsonReplacer('k', new Uint8Array([1, 2, 3]))).toBe('AQID')
    expect(stringifyJson({ bytes: new Uint8Array([255]) })).toBe(
      '{"bytes":"/w=="}'
    )
  })

  it('encodes a Map as an object, stringifying its keys', () => {
    const map = new Map<unknown, unknown>([
      ['a', 1],
      [2, 'b']
    ])
    expect(jsonReplacer('k', map)).toStrictEqual({ a: 1, '2': 'b' })
    // The wallet balance maps core hands back are keyed by tokenId or null.
    expect(stringifyJson({ balanceMap: new Map([[null, '100']]) })).toBe(
      '{"balanceMap":{"null":"100"}}'
    )
  })

  it('passes everything else through', () => {
    for (const value of [1, 'x', true, null, undefined, { a: 1 }, [1, 2]]) {
      expect(jsonReplacer('k', value)).toStrictEqual(value)
    }
  })

  it('serialises a Date to ISO without a replacer arm for it', () => {
    // `JSON.stringify` calls `Date.prototype.toJSON` before the replacer, so
    // a `value instanceof Date` arm can never fire. The output is the same,
    // which is why the dead arm went unnoticed.
    expect(stringifyJson({ d: new Date(0) })).toBe(
      '{"d":"1970-01-01T00:00:00.000Z"}'
    )
    expect(jsonReplacer('d', new Date(0))).toBeInstanceOf(Date)
  })
})

describe('base58', () => {
  it('round-trips', () => {
    for (const bytes of [
      new Uint8Array([]),
      new Uint8Array([0]),
      new Uint8Array([1, 2, 3]),
      new Uint8Array([255, 254, 0, 1])
    ]) {
      expect([...base58.parse(base58.stringify(bytes))]).toStrictEqual([
        ...bytes
      ])
    }
  })

  it('uses the alphabet session ids are read in', () => {
    // Session and handle ids are base58 precisely so they can be path
    // parameters, so the alphabet must exclude 0, O, I and l.
    const text = base58.stringify(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))
    expect(text).not.toMatch(/[0OIl]/)
  })
})

describe('utf8', () => {
  it('round-trips ASCII and multi-byte text', () => {
    for (const text of ['', 'hello', 'héllo wörld', '日本語', '😀']) {
      expect(utf8.stringify(utf8.parse(text))).toBe(text)
    }
  })

  it('agrees with Buffer on byte length', () => {
    for (const text of ['hello', 'héllo', '日本語', '😀']) {
      expect(utf8.parse(text).length).toBe(Buffer.byteLength(text, 'utf8'))
    }
  })
})

describe('findWallet', () => {
  function makeAccount(ids: string[]): EdgeAccount {
    const currencyWallets: Record<string, EdgeCurrencyWallet> = {}
    for (const id of ids) {
      currencyWallets[id] = { id } as unknown as EdgeCurrencyWallet
    }
    return { currencyWallets } as unknown as EdgeAccount
  }

  it('matches a full id, and a unique prefix', () => {
    const account = makeAccount(['aaa111', 'bbb222'])
    expect(findWallet(account, 'aaa111').id).toBe('aaa111')
    expect(findWallet(account, 'aaa').id).toBe('aaa111')
  })

  it('reports an ambiguous prefix with its candidates', () => {
    const account = makeAccount(['aaa111', 'aaa222'])
    expect(thrown(() => findWallet(account, 'aaa'))).toStrictEqual({
      code: 'AMBIGUOUS_WALLET_ID',
      status: 409
    })
  })

  it('reports a prefix that matches nothing', () => {
    const account = makeAccount(['aaa111'])
    expect(thrown(() => findWallet(account, 'zzz'))).toStrictEqual({
      code: 'WALLET_NOT_FOUND',
      status: 404
    })
  })

  it('refuses an empty prefix rather than resolving the only wallet', () => {
    // `''` is a prefix of every id, so on a single-wallet account this used
    // to resolve silently to that wallet — and this is what `spend` resolves
    // through.
    const account = makeAccount(['aaa111'])
    expect(thrown(() => findWallet(account, ''))).toStrictEqual({
      code: 'BAD_REQUEST',
      status: 400
    })
  })

  it('prefers an exact id over a prefix of a longer one', () => {
    const account = makeAccount(['aaa', 'aaa111'])
    expect(findWallet(account, 'aaa').id).toBe('aaa')
  })
})
