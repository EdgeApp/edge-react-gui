import { asArray, asNumber, asObject, asOptional, asString } from 'cleaners'
import type { EdgeFetchFunction, EdgeTokenId } from 'edge-core-js'

import {
  getHistoricalCryptoRate,
  getHistoricalFiatRate
} from '../../../util/exchangeRates'
import { doc } from '../doc'
import { engineError } from '../errors'
import { route } from '../route'
import { asTokenId } from '../schemas'

const DEFAULT_MULTIPLIERS: Record<string, string> = {
  bitcoin: '100000000',
  ethereum: '1000000000000000000',
  bitcoincash: '100000000',
  litecoin: '100000000',
  dogecoin: '100000000'
}

const nodeFetch: EdgeFetchFunction = async (uri, opts) =>
  await fetch(uri, opts as RequestInit)

function displayToNative(displayAmount: string, multiplier: string): string {
  const [whole, frac = ''] = displayAmount.split('.')
  const decimals = multiplier.replace(/^1/, '').length
  const fracPadded = (frac + '0'.repeat(decimals)).slice(0, decimals)
  const stripped = `${whole}${fracPadded}`.replace(/^0+(?=\d)/, '')
  const combined = stripped !== '' ? stripped : '0'
  const digits = combined.replace(/\D/g, '')
  return digits !== '' ? digits : '0'
}

function parseTokenId(value: unknown): EdgeTokenId {
  if (value === undefined || value === null || value === 'null') return null
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  throw engineError('BAD_REQUEST', 'tokenId must be a string or null', 400)
}

const TARGET_FIAT_DOC = 'ISO 4217 code to price against. Defaults to `iso:USD`.'
const DATE_DOC =
  'ISO-8601. Omitted, the current time is sent to the rates server.'

const asCryptoQuery = asObject({
  pluginId: doc(asString, 'Which chain, e.g. `bitcoin`.'),
  tokenId: asOptional(doc(asTokenId, 'Defaults to the native asset.')),
  targetFiat: asOptional(doc(asString, TARGET_FIAT_DOC)),
  date: asOptional(doc(asString, DATE_DOC))
}).withRest

const asFiatQuery = asObject({
  fiatCode: doc(asString, 'The fiat to price, e.g. `EUR`.'),
  targetFiat: asOptional(doc(asString, TARGET_FIAT_DOC)),
  date: asOptional(doc(asString, DATE_DOC))
}).withRest

/**
 * Batch crypto and fiat rate lookups.
 *
 * Concurrent lookups share one rates-server queue, so asking for many rates at
 * once costs a single upstream request.
 *
 * @note A rate the server cannot supply comes back as `0` rather than an
 *   error, so check for zero before dividing.
 * @coreNote GUI code (src/util/exchangeRates): getHistoricalCryptoRate and
 *   getHistoricalFiatRate.
 */
export const ratesQuery = route({
  core: null,
  method: 'POST',
  path: '/rates/query',
  cli: { command: 'rates-query', bodyFlag: 'body' },
  body: asObject({
    crypto: asOptional(doc(asArray(asCryptoQuery), 'Crypto rates to fetch.')),
    fiat: asOptional(doc(asArray(asFiatQuery), 'Fiat rates to fetch.'))
  }).withRest,
  returns: asObject({
    crypto: doc(
      asArray(
        asObject({
          pluginId: asString,
          tokenId: asTokenId,
          targetFiat: asString,
          date: doc(asString, 'The timestamp actually queried.'),
          rate: asNumber
        })
      ),
      'Always present; empty when no crypto rates were requested.'
    ),
    fiat: asArray(
      asObject({
        fiatCode: asString,
        targetFiat: asString,
        date: asString,
        rate: asNumber
      })
    )
  }),
  errors: ['BAD_REQUEST', 'NETWORK_ERROR'],

  async handler(ctx) {
    const cryptoRaw = ctx.body.crypto
    const fiatRaw = ctx.body.fiat
    if (
      (cryptoRaw == null || cryptoRaw.length === 0) &&
      (fiatRaw == null || fiatRaw.length === 0)
    ) {
      throw engineError(
        'BAD_REQUEST',
        'Provide at least one crypto or fiat rate query',
        400
      )
    }
    const now = new Date().toISOString()

    const crypto = await Promise.all(
      (cryptoRaw ?? []).map(async item => {
        const tokenId = parseTokenId(item.tokenId)
        const targetFiat = item.targetFiat ?? 'iso:USD'
        const date = item.date ?? now
        const rate = await getHistoricalCryptoRate(
          item.pluginId,
          tokenId,
          targetFiat,
          date,
          undefined,
          nodeFetch
        )
        return { pluginId: item.pluginId, tokenId, targetFiat, date, rate }
      })
    )

    const fiat = await Promise.all(
      (fiatRaw ?? []).map(async item => {
        const targetFiat = item.targetFiat ?? 'iso:USD'
        const date = item.date ?? now
        const rate = await getHistoricalFiatRate(
          item.fiatCode,
          targetFiat,
          date,
          undefined,
          nodeFetch
        )
        return { fiatCode: item.fiatCode, targetFiat, date, rate }
      })
    )

    return { crypto, fiat }
  }
})

/**
 * Convert a USD amount into native units.
 *
 * Turns a fiat notional into the native amount a spend needs.
 *
 * @note `displayAmount` is rounded to 8 decimals before conversion, so assets
 *   with finer precision lose the tail. For an exact figure use `rates-query`
 *   and do the arithmetic yourself.
 * @note Default multipliers cover bitcoin, ethereum, bitcoincash, litecoin and
 *   dogecoin; pass `multiplier` explicitly for anything else.
 * @coreNote GUI code (src/util/exchangeRates): getHistoricalCryptoRate.
 */
export const ratesUsdToNative = route({
  core: null,
  method: 'POST',
  path: '/rates/usd-to-native',
  cli: { command: 'rates-usd-to-native', positional: 'usdAmount' },
  body: asObject({
    usdAmount: doc(
      asString,
      'A string, which must parse to a positive finite number.'
    ),
    pluginId: doc(asString, 'Which chain to price.'),
    tokenId: asOptional(doc(asTokenId, 'Defaults to the native asset.')),
    multiplier: asOptional(
      doc(asString, 'Native units per whole coin. Defaults per plugin.')
    ),
    date: asOptional(doc(asString, DATE_DOC))
  }).withRest,
  returns: asObject({
    usdAmount: doc(
      asNumber,
      'Echoed as a number, though it is sent as a string.'
    ),
    pluginId: asString,
    tokenId: asTokenId,
    multiplier: asString,
    date: asString,
    rate: doc(asNumber, 'USD per whole coin at that date.'),
    displayAmount: doc(asString, 'Whole coins, to 8 decimal places.'),
    nativeAmount: doc(asString, 'What a spend actually takes.')
  }),
  errors: ['BAD_REQUEST', 'NOT_FOUND', 'NETWORK_ERROR'],

  async handler(ctx) {
    const usdAmount = Number(ctx.body.usdAmount)
    if (!(usdAmount > 0) || !Number.isFinite(usdAmount)) {
      throw engineError(
        'BAD_REQUEST',
        'usdAmount must be a positive number',
        400
      )
    }
    const { pluginId } = ctx.body
    const tokenId = parseTokenId(ctx.body.tokenId)
    const multiplier =
      ctx.body.multiplier ?? DEFAULT_MULTIPLIERS[pluginId] ?? '100000000'
    const date = ctx.body.date ?? new Date().toISOString()
    const rate = await getHistoricalCryptoRate(
      pluginId,
      tokenId,
      'iso:USD',
      date,
      undefined,
      nodeFetch
    )
    if (!(rate > 0)) {
      throw engineError(
        'NOT_FOUND',
        `No USD rate for ${pluginId}/${String(tokenId)}`,
        404
      )
    }
    const displayAmount = (usdAmount / rate).toFixed(8)
    return {
      usdAmount,
      pluginId,
      tokenId,
      multiplier,
      date,
      rate,
      displayAmount,
      nativeAmount: displayToNative(displayAmount, multiplier)
    }
  }
})
