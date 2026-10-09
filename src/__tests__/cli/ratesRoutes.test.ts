import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'

import { ratesQuery, ratesUsdToNative } from '../../cli/engine/routes/rates'
import { clearRateCache, stopRateQueue } from '../../util/exchangeRates'

/**
 * The two rate routes, which `REFUSAL_ONLY` excused with suites for other
 * modules — `exchangeRatesCache.test.ts` covers `src/util/exchangeRates.ts`
 * and `ratesScaling.test.ts` covers `displayToNative`, a helper in this
 * file, while `routes/rates.ts` itself ran at 0% of branches.
 *
 * The upstream server is replaced at `globalThis.fetch`, which is where
 * `fetchRates`'s own default fetch ends up: the routes pass no `doFetch`, so
 * there is no seam to inject one through, and that is the property the first
 * case below is about.
 */
const realFetch = globalThis.fetch
let posts = 0

/** A rates server that prices every asset it is asked about. */
const pricingFetch = (async (_uri: unknown, opts: any) => {
  ++posts
  const body = JSON.parse(String(opts.body))
  return {
    ok: true,
    status: 200,
    json: async () => ({
      targetFiat: body.targetFiat,
      crypto: body.crypto.map((c: any) => ({ ...c, rate: 30000 })),
      fiat: body.fiat.map((f: any) => ({ ...f, rate: 1 }))
    }),
    text: async () => ''
  }
}) as unknown as typeof globalThis.fetch

/** A rates server that answers, and prices nothing. */
const unpricedFetch = (async (_uri: unknown, opts: any) => {
  ++posts
  const body = JSON.parse(String(opts.body))
  return {
    ok: true,
    status: 200,
    json: async () => ({
      targetFiat: body.targetFiat,
      crypto: body.crypto.map((c: any) => ({ ...c, rate: undefined })),
      fiat: body.fiat.map((f: any) => ({ ...f, rate: undefined }))
    }),
    text: async () => ''
  }
}) as unknown as typeof globalThis.fetch

// Real timers: the rate queue debounces by FETCH_FREQUENCY before it fetches.
beforeAll(() => {
  jest.useRealTimers()
})
afterEach(() => {
  stopRateQueue()
  clearRateCache()
  posts = 0
})
afterAll(() => {
  globalThis.fetch = realFetch
  jest.useFakeTimers()
})

/**
 * The handlers read `ctx.body` and nothing else — neither route is
 * session-scoped, which is why `rates-usd-to-native` demands a multiplier.
 *
 * `any`, like `spendHandlers.test.ts`'s own `makeCtx`: a `route`'s handler
 * takes the typed context the declaration derives, whose `query` carries a
 * phantom field no hand-built object can satisfy.
 */
function ctxFor(body: unknown): any {
  return { body, params: {} }
}

const DATE = new Date('2024-01-01T00:00:00.000Z')

describe('rates-query', () => {
  it('costs one upstream request for a mixed body', async () => {
    // The property the handler's own comment publishes and no test held:
    // both sets are *queued* before either is awaited. Awaiting the crypto
    // lookups first made a mixed body pay two `FETCH_FREQUENCY` debounces
    // and two upstream requests, measured at 2,006ms / 2 against 1,005ms /
    // 1 — against a description promising that asking for many rates at
    // once costs a single request.
    globalThis.fetch = pricingFetch
    const answer = (await ratesQuery.handler(
      ctxFor({
        crypto: [{ pluginId: 'bitcoin', tokenId: null, date: DATE }],
        fiat: [{ fiatCode: 'iso:EUR', targetFiat: 'iso:USD', date: DATE }]
      })
    )) as { crypto: Array<{ rate: number }>; fiat: Array<{ rate: number }> }

    expect(posts).toBe(1)
    expect(answer.crypto[0].rate).toBe(30000)
    expect(answer.fiat[0].rate).toBe(1)
  })

  it('defaults the target fiat and publishes both arrays', async () => {
    globalThis.fetch = pricingFetch
    const answer = (await ratesQuery.handler(
      ctxFor({ crypto: [{ pluginId: 'bitcoin', tokenId: null, date: DATE }] })
    )) as {
      crypto: Array<{ targetFiat: string; date: string }>
      fiat: unknown[]
    }
    expect(answer.crypto[0].targetFiat).toBe('iso:USD')
    expect(answer.crypto[0].date).toBe(DATE.toISOString())
    // "Always present; empty when no fiat rates were requested."
    expect(answer.fiat).toStrictEqual([])
  })

  it('refuses a body that asks for nothing', async () => {
    await expect(ratesQuery.handler(ctxFor({}))).rejects.toThrow(
      /at least one crypto or fiat/
    )
    await expect(
      ratesQuery.handler(ctxFor({ crypto: [], fiat: [] }))
    ).rejects.toThrow(/at least one crypto or fiat/)
    expect(posts).toBe(0)
  })
})

describe('rates-usd-to-native', () => {
  it('scales by the multiplier the caller supplied', async () => {
    globalThis.fetch = pricingFetch
    const answer = (await ratesUsdToNative.handler(
      ctxFor({
        usdAmount: '3000',
        pluginId: 'bitcoin',
        tokenId: null,
        multiplier: '100000000',
        date: DATE
      })
    )) as { rate: number; displayAmount: string; nativeAmount: string }

    expect(answer.rate).toBe(30000)
    // Eight decimals, which the route's own `@note` says costs the tail of
    // a finer asset.
    expect(answer.displayAmount).toBe('0.10000000')
    expect(answer.nativeAmount).toBe('10000000')
  })

  it('is a 404 when the server cannot price the asset', async () => {
    // `0` means "no price", not a rate: dividing by it would publish
    // `Infinity` as a `nativeAmount` under a field documented as what a
    // spend takes.
    globalThis.fetch = unpricedFetch
    await expect(
      ratesUsdToNative.handler(
        ctxFor({
          usdAmount: '3000',
          pluginId: 'nosuchchain',
          tokenId: null,
          multiplier: '100000000',
          date: DATE
        })
      )
    ).rejects.toThrow(/No USD rate for nosuchchain/)
  })
})
