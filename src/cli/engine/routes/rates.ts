import { floor, mul } from 'biggystring'
import { asArray, asNumber, asObject, asOptional, asString } from 'cleaners'

import {
  getHistoricalCryptoRate,
  getHistoricalFiatRate
} from '../../../util/exchangeRates'
import { doc } from '../doc'
import { engineError } from '../errors'
import { TOKEN_ID_DOC } from '../fieldDocs'
import { route } from '../route'
import {
  asPositiveBiggystring,
  asQueryDate,
  asRequestTokenId,
  asTokenId
} from '../schemas'

/**
 * Scale a whole-coin amount by the asset's multiplier.
 *
 * `floor` because a native amount is an integer number of the smallest unit,
 * and biggystring rejects a malformed amount instead of scrubbing it into a
 * plausible-looking number.
 *
 * Exported for its test. This is the one route whose output is a spend
 * amount — `nativeAmount` is documented as "What a spend actually takes" —
 * and the rest of the handler needs the live rates server, so the arithmetic
 * was reachable from no test at all while it was module-private.
 */
export function displayToNative(
  displayAmount: string,
  multiplier: string
): string {
  return floor(mul(displayAmount, multiplier), 0)
}

const TARGET_FIAT_DOC = 'ISO 4217 code to price against. Defaults to `iso:USD`.'
const DATE_DOC =
  'ISO-8601, or epoch milliseconds. Omitted, the current time is sent to the rates server. An unparseable date is a `400 BAD_REQUEST`, not a rate of zero.'

const asCryptoQuery = asObject({
  pluginId: doc(asString, 'Which chain, e.g. `bitcoin`.'),
  // No fallback: this shape is nested inside `crypto`, and
  // `asOptional(c, x)` erases `undefined` from the output type, which is
  // how the generator reads a nested field's optionality — so
  // `crypto.items.required` published `["pluginId","tokenId"]` while a
  // caller omitting `tokenId` succeeded. The handler defaults it.
  tokenId: asOptional(doc(asRequestTokenId, TOKEN_ID_DOC)),
  targetFiat: asOptional(doc(asString, TARGET_FIAT_DOC)),
  date: asOptional(doc(asQueryDate, DATE_DOC))
}).withRest

const asFiatQuery = asObject({
  fiatCode: doc(asString, 'The fiat to price, e.g. `EUR`.'),
  targetFiat: asOptional(doc(asString, TARGET_FIAT_DOC)),
  date: asOptional(doc(asQueryDate, DATE_DOC))
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
  cli: 'rates-query',
  body: asObject({
    crypto: asOptional(doc(asArray(asCryptoQuery), 'Crypto rates to fetch.')),
    fiat: asOptional(doc(asArray(asFiatQuery), 'Fiat rates to fetch.'))
  }).withRest,
  returns: asObject({
    crypto: doc(
      asArray(
        asObject({
          pluginId: asString,
          // Response position, so `asTokenId`: the literal string "null" is
          // a *request* spelling, and publishing it here would describe a
          // response the engine never sends.
          tokenId: asTokenId,
          targetFiat: asString,
          date: doc(asString, 'The timestamp actually queried.'),
          rate: asNumber
        })
      ),
      'Always present; empty when no crypto rates were requested.'
    ),
    fiat: doc(
      asArray(
        asObject({
          fiatCode: asString,
          targetFiat: asString,
          date: asString,
          rate: asNumber
        })
      ),
      'Always present; empty when no fiat rates were requested.'
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

    // Both sets are *queued* before either is awaited. Awaiting the crypto
    // lookups first and only then starting the fiat ones made a mixed body
    // pay two `FETCH_FREQUENCY` debounces and two upstream requests:
    // `exchangeRates` batches crypto and fiat into the same group, but
    // `inQuery` clears the moment the first pass drains, so the second set
    // armed a fresh 1,000ms timer. Measured at 2,006ms / 2 requests the old
    // way against 1,005ms / 1 this way — and this route's own description
    // promises that asking for many rates at once costs a single request.
    const cryptoPending = (cryptoRaw ?? []).map(async item => {
      // Already cleaned by `asRequestTokenId` at the declaration; the
      // default is here rather than in the cleaner, so the published shape
      // can say the field is optional.
      const tokenId = item.tokenId ?? null
      const targetFiat = item.targetFiat ?? 'iso:USD'
      // One canonical spelling, because it is also the rate cache's key.
      const date = item.date?.toISOString() ?? now
      const rate = await getHistoricalCryptoRate(
        item.pluginId,
        tokenId,
        targetFiat,
        date,
        undefined
      )
      return { pluginId: item.pluginId, tokenId, targetFiat, date, rate }
    })

    const fiatPending = (fiatRaw ?? []).map(async item => {
      const targetFiat = item.targetFiat ?? 'iso:USD'
      const date = item.date?.toISOString() ?? now
      const rate = await getHistoricalFiatRate(
        item.fiatCode,
        targetFiat,
        date,
        undefined
      )
      return { fiatCode: item.fiatCode, targetFiat, date, rate }
    })

    const [crypto, fiat] = await Promise.all([
      Promise.all(cryptoPending),
      Promise.all(fiatPending)
    ])
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
 * @note `multiplier` is required. The engine has no logged-in account here, so
 *   it cannot read the asset's denomination from core, and a guessed
 *   multiplier would return a `nativeAmount` wrong by orders of magnitude
 *   under a field documented as what a spend takes.
 * @coreNote GUI code (src/util/exchangeRates): getHistoricalCryptoRate.
 */
export const ratesUsdToNative = route({
  core: null,
  method: 'POST',
  path: '/rates/usd-to-native',
  cli: 'rates-usd-to-native',
  body: asObject({
    usdAmount: doc(asPositiveBiggystring, 'A positive decimal string.'),
    pluginId: doc(asString, 'Which chain to price.'),
    tokenId: asOptional(doc(asRequestTokenId, TOKEN_ID_DOC), null),
    // `asPositiveBiggystring`, not `asString`. Unvalidated, `"abc"` reached
    // biggystring and came back as a plain `Error` — `500 INTERNAL_ERROR` on
    // a route that declares `BAD_REQUEST` — while `""` returned `"0"` and
    // `"-1"` returned `"-1"`: a silently wrong `nativeAmount` under a field
    // documented as what a spend actually takes.
    multiplier: doc(
      asPositiveBiggystring,
      'Native units per whole coin, as a positive decimal string. This route is not session-scoped, so the engine cannot read the asset\u2019s denomination from core and will not guess one.'
    ),
    date: asOptional(doc(asQueryDate, DATE_DOC))
  }).withRest,
  returns: asObject({
    usdAmount: doc(
      asNumber,
      'Echoed as a number, though it is sent as a string.'
    ),
    pluginId: doc(asString, 'Currency plugin the amount was converted for.'),
    tokenId: doc(
      asTokenId,
      'The asset, or null for the chain\u2019s own coin.'
    ),
    multiplier: doc(
      asString,
      'Native units per whole coin, which is what `displayAmount` was multiplied by to reach `nativeAmount`.'
    ),
    date: doc(asString, 'The timestamp actually used for the rate.'),
    rate: doc(asNumber, 'USD per whole coin at that date.'),
    displayAmount: doc(asString, 'Whole coins, to 8 decimal places.'),
    nativeAmount: doc(asString, 'What a spend actually takes.')
  }),
  errors: ['BAD_REQUEST', 'NOT_FOUND', 'NETWORK_ERROR'],

  async handler(ctx) {
    // Both numbers are validated by the declaration, so a bad one is the
    // 400 this route publishes rather than a 500 from biggystring or a
    // silently wrong `nativeAmount`. The hand-written positivity test that
    // used to live here only covered `usdAmount`.
    const usdAmount = Number(ctx.body.usdAmount)
    const { pluginId } = ctx.body
    // `asOptional(asRequestTokenId, null)` already guarantees non-undefined.
    const { tokenId } = ctx.body
    // Required by the cleaner, so a missing one is already a 400 with the
    // field named. Guessing would return a `nativeAmount` wrong by orders of
    // magnitude under a field documented as what a spend actually takes.
    const { multiplier } = ctx.body
    const date = ctx.body.date?.toISOString() ?? new Date().toISOString()
    const rate = await getHistoricalCryptoRate(
      pluginId,
      tokenId,
      'iso:USD',
      date
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
