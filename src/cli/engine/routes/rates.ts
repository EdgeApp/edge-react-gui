import type { EdgeFetchFunction, EdgeTokenId } from 'edge-core-js'

import {
  getHistoricalCryptoRate,
  getHistoricalFiatRate
} from '../../../util/exchangeRates'
import { engineError } from '../errors'
import { requireBodyObject, type Router } from '../router'
import { optionalString, requireString } from './helpers'

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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function parseTokenId(value: unknown): EdgeTokenId {
  if (value === undefined || value === null || value === 'null') return null
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  throw engineError('BAD_REQUEST', 'tokenId must be a string or null', 400)
}

export function registerRatesRoutes(router: Router): void {
  /**
   * Batch crypto/fiat lookups via getHistoricalCryptoRate /
   * getHistoricalFiatRate (shared GUI batching queue).
   * Missing date → current ISO timestamp sent to the rates server.
   */
  router.add('POST', '/rates/query', async ctx => {
    const body = requireBodyObject(ctx.body)
    const cryptoRaw = body.crypto
    const fiatRaw = body.fiat
    if (cryptoRaw != null && !Array.isArray(cryptoRaw)) {
      throw engineError('BAD_REQUEST', 'crypto must be an array', 400)
    }
    if (fiatRaw != null && !Array.isArray(fiatRaw)) {
      throw engineError('BAD_REQUEST', 'fiat must be an array', 400)
    }
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
      (cryptoRaw ?? []).map(async (item, i) => {
        if (!isPlainObject(item)) {
          throw engineError(
            'BAD_REQUEST',
            `crypto[${i}] must be an object`,
            400
          )
        }
        const pluginId = item.pluginId
        if (typeof pluginId !== 'string' || pluginId === '') {
          throw engineError(
            'BAD_REQUEST',
            `crypto[${i}].pluginId is required`,
            400
          )
        }
        const tokenId = parseTokenId(item.tokenId)
        const targetFiat =
          typeof item.targetFiat === 'string' ? item.targetFiat : 'iso:USD'
        const date = typeof item.date === 'string' ? item.date : now
        const rate = await getHistoricalCryptoRate(
          pluginId,
          tokenId,
          targetFiat,
          date,
          undefined,
          nodeFetch
        )
        return { pluginId, tokenId, targetFiat, date, rate }
      })
    )

    const fiat = await Promise.all(
      (fiatRaw ?? []).map(async (item, i) => {
        if (!isPlainObject(item)) {
          throw engineError('BAD_REQUEST', `fiat[${i}] must be an object`, 400)
        }
        const fiatCode = item.fiatCode
        if (typeof fiatCode !== 'string' || fiatCode === '') {
          throw engineError(
            'BAD_REQUEST',
            `fiat[${i}].fiatCode is required`,
            400
          )
        }
        const targetFiat =
          typeof item.targetFiat === 'string' ? item.targetFiat : 'iso:USD'
        const date = typeof item.date === 'string' ? item.date : now
        const rate = await getHistoricalFiatRate(
          fiatCode,
          targetFiat,
          date,
          undefined,
          nodeFetch
        )
        return { fiatCode, targetFiat, date, rate }
      })
    )

    return { crypto, fiat }
  })

  /** USD → native amount via getHistoricalCryptoRate. */
  router.add('POST', '/rates/usd-to-native', async ctx => {
    const body = requireBodyObject(ctx.body)
    const usdRaw = requireString(body, 'usdAmount')
    const usdAmount = Number(usdRaw)
    if (!(usdAmount > 0) || !Number.isFinite(usdAmount)) {
      throw engineError(
        'BAD_REQUEST',
        'usdAmount must be a positive number',
        400
      )
    }
    const pluginId = requireString(body, 'pluginId')
    const tokenId = parseTokenId(body.tokenId)
    const multiplier =
      optionalString(body, 'multiplier') ??
      DEFAULT_MULTIPLIERS[pluginId] ??
      '100000000'
    const date = optionalString(body, 'date') ?? new Date().toISOString()
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
  })
}
