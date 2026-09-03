/**
 * Swap quote / execute routes.
 *
 * Quotes are ephemeral object handles (`swap_` prefix, 5 min TTL). Approve
 * consumes the handle; close/delete releases it early.
 */
import { asArray, asNumber, asObject, asOptional, asString } from 'cleaners'
import type { EdgeSwapQuote, EdgeSwapRequest } from 'edge-core-js'

import { doc } from '../doc'
import { engineError } from '../errors'
import { findWallet, parseTokenId } from '../resolve'
import { route } from '../route'
import { asCoreValue, asOkObject, asSwapQuote, asTokenId } from '../schemas'
import { getAccount } from './helpers'

function summarizeQuote(
  objectId: string,
  expiresAt: string,
  quote: EdgeSwapQuote
): Record<string, unknown> {
  return {
    objectId,
    kind: 'swap',
    expiresAt,
    pluginId: quote.pluginId,
    isEstimate: quote.isEstimate,
    canBePartial: quote.canBePartial ?? null,
    maxFulfillmentSeconds: quote.maxFulfillmentSeconds ?? null,
    minReceiveAmount: quote.minReceiveAmount ?? null,
    fromNativeAmount: quote.fromNativeAmount,
    toNativeAmount: quote.toNativeAmount,
    networkFee: {
      nativeAmount: quote.networkFee.nativeAmount,
      tokenId: quote.networkFee.tokenId
    },
    quoteExpirationDate: quote.expirationDate?.toISOString() ?? null,
    swapInfo: {
      pluginId: quote.swapInfo.pluginId,
      displayName: quote.swapInfo.displayName,
      supportEmail: quote.swapInfo.supportEmail,
      isDex: quote.swapInfo.isDex ?? null
    },
    request: {
      fromTokenId: quote.request.fromTokenId,
      toTokenId: quote.request.toTokenId,
      nativeAmount: quote.request.nativeAmount,
      quoteFor: quote.request.quoteFor,
      fromWalletId: quote.request.fromWallet.id,
      toWalletId: quote.request.toWallet.id
    }
  }
}

/**
 * Fetch swap quotes.
 *
 * Polls every enabled swap plugin and parks each result under its own `swap_`
 * handle with a 5 minute TTL.
 *
 * @note Every returned quote holds an open plugin object. Approving one
 *   releases only that handle; close the rest, or let them expire.
 * @note An empty `quotes` array with `quoteCount: 0` is a success, not an
 *   error — no plugin could serve the pair.
 */
export const fetchSwapQuotes = route({
  core: 'account.fetchSwapQuotes',
  coreExtra: {
    fromWalletId: 'Core takes the wallet object; over HTTP it is an id.',
    toWalletId: 'Core takes the wallet object; over HTTP it is an id.'
  },
  method: 'POST',
  path: '/account/{sessionId}/fetch-swap-quotes',
  cli: {
    command: 'fetch-swap-quotes',
    flags: { pluginId: { maps: 'preferPluginId' } }
  },
  body: asObject({
    fromWalletId: doc(asString, 'Source wallet. Accepts a unique prefix.'),
    toWalletId: doc(asString, 'Destination wallet.'),
    nativeAmount: doc(asString, 'How much, in native units.'),
    fromTokenId: asOptional(doc(asTokenId, 'Defaults to the native asset.')),
    toTokenId: asOptional(doc(asTokenId, 'Defaults to the native asset.')),
    quoteFor: asOptional(
      doc(
        asString,
        '`from` spends this much of the source, `to` receives this much at the destination, `max` sends everything. Defaults to `from`.'
      )
    ),
    preferPluginId: asOptional(doc(asString, 'Restrict to one exchange.'))
  }).withRest,
  returns: asObject({
    quoteCount: doc(asNumber, 'How many plugins answered.'),
    quotes: doc(
      asArray(asSwapQuote),
      'One quote per plugin that answered, each already parked under its own ' +
        'handle. Plugins that failed or had nothing to offer are simply absent.'
    )
  }),
  errors: [
    'BAD_REQUEST',
    'SWAP_BELOW_LIMIT',
    'SWAP_ABOVE_LIMIT',
    'SWAP_CURRENCY',
    'SWAP_PERMISSION',
    'SWAP_ADDRESS',
    'SAME_CURRENCY',
    'INSUFFICIENT_FUNDS',
    'WALLET_NOT_FOUND',
    'NETWORK_ERROR'
  ],

  async handler(ctx) {
    const account = getAccount(ctx)
    const fromWallet = findWallet(account, ctx.body.fromWalletId)
    const toWallet = findWallet(account, ctx.body.toWalletId)
    const fromTokenId = parseTokenId(ctx.body.fromTokenId ?? undefined)
    const toTokenId = parseTokenId(ctx.body.toTokenId ?? undefined)
    const { nativeAmount } = ctx.body
    const quoteForRaw = ctx.body.quoteFor ?? 'from'
    if (
      quoteForRaw !== 'from' &&
      quoteForRaw !== 'to' &&
      quoteForRaw !== 'max'
    ) {
      throw engineError(
        'BAD_REQUEST',
        'quoteFor must be "from", "to", or "max"',
        400
      )
    }
    const quoteFor = quoteForRaw
    const { preferPluginId } = ctx.body

    const request: EdgeSwapRequest = {
      fromWallet,
      toWallet,
      fromTokenId,
      toTokenId,
      nativeAmount,
      quoteFor
    }

    const opts = preferPluginId != null ? { preferPluginId } : undefined

    const quotes: EdgeSwapQuote[] = await account.fetchSwapQuotes(request, opts)

    const results = []
    for (const quote of quotes) {
      const handle = ctx.state.objects.create({
        kind: 'swap',
        prefix: 'swap_',
        value: quote,
        sessionId: ctx.params.sessionId,
        onExpire: async value => {
          try {
            await value.close()
          } catch {
            // best effort
          }
        }
      })
      results.push(summarizeQuote(handle.objectId, handle.expiresAt, quote))
    }

    return {
      quoteCount: results.length,
      quotes: results
    }
  }
})

/**
 * Re-read a quote.
 *
 * @note Check `quoteExpirationDate` as well as `expiresAt`: the plugin's price
 *   can go stale before the handle does.
 * @coreNote Engine handle store; the quote is a live EdgeSwapQuote held
 *   server-side.
 */
export const getSwapQuote = route({
  core: null,
  method: 'GET',
  path: '/account/{sessionId}/swap-quote',
  cli: { command: 'swap-quote-get', positional: 'objectId' },
  returns: asSwapQuote,
  errors: [
    'OBJECT_NOT_FOUND',
    'OBJECT_EXPIRED',
    'OBJECT_KIND_MISMATCH',
    'OBJECT_SESSION_MISMATCH'
  ],

  async handler(ctx) {
    const record = ctx.state.objects.get<EdgeSwapQuote>(
      ctx.params.objectId,
      'swap'
    )
    if (record.sessionId != null && record.sessionId !== ctx.params.sessionId) {
      throw engineError(
        'OBJECT_SESSION_MISMATCH',
        'objectId belongs to a different session',
        400
      )
    }
    const info = ctx.state.objects.toInfo(record)
    return summarizeQuote(info.objectId, info.expiresAt, record.value)
  }
})

/**
 * Execute a quote.
 *
 * Moves funds. The handle is released afterwards whether or not the response
 * is read, so record `orderId` from it.
 *
 * @note The plugin attaches its own savedAction and assetAction metadata; the
 *   engine adds none.
 */
export const approveSwapQuote = route({
  core: 'EdgeSwapQuote.approve',
  method: 'POST',
  path: '/account/{sessionId}/swap-quote/approve',
  cli: { command: 'approve-swap-quote', positional: 'objectId' },
  returns: asObject({
    ok: doc(
      asCoreValue,
      'True once the swap is submitted and the send broadcast.'
    ),
    objectId: doc(asString, 'The handle that was consumed.'),
    orderId: doc(
      asCoreValue,
      "The exchange's order reference, when it gives one."
    ),
    destinationAddress: doc(
      asCoreValue,
      'Address the funds were sent to, when the exchange reports one.'
    ),
    transaction: doc(asCoreValue, 'The on-chain send to the exchange.')
  }),
  errors: [
    'OBJECT_NOT_FOUND',
    'OBJECT_EXPIRED',
    'OBJECT_KIND_MISMATCH',
    'OBJECT_SESSION_MISMATCH',
    'INSUFFICIENT_FUNDS',
    'NETWORK_ERROR'
  ],

  async handler(ctx) {
    const record = ctx.state.objects.get<EdgeSwapQuote>(
      ctx.params.objectId,
      'swap'
    )
    if (record.sessionId != null && record.sessionId !== ctx.params.sessionId) {
      throw engineError(
        'OBJECT_SESSION_MISMATCH',
        'objectId belongs to a different session',
        400
      )
    }
    const result = await record.value.approve()
    await ctx.state.objects.delete(ctx.params.objectId)
    return {
      ok: true,
      objectId: ctx.params.objectId,
      orderId: result.orderId ?? null,
      destinationAddress: result.destinationAddress ?? null,
      transaction: result.transaction
    }
  }
})

/**
 * Discard a quote.
 *
 * Closes the plugin object without executing, freeing whatever the exchange
 * was holding.
 */
export const closeSwapQuote = route({
  core: 'EdgeSwapQuote.close',
  method: 'POST',
  path: '/account/{sessionId}/swap-quote/close',
  cli: { command: 'close-swap-quote', positional: 'objectId' },
  returns: asOkObject,
  errors: [
    'OBJECT_NOT_FOUND',
    'OBJECT_EXPIRED',
    'OBJECT_KIND_MISMATCH',
    'OBJECT_SESSION_MISMATCH'
  ],

  async handler(ctx) {
    const record = ctx.state.objects.get<EdgeSwapQuote>(
      ctx.params.objectId,
      'swap'
    )
    if (record.sessionId != null && record.sessionId !== ctx.params.sessionId) {
      throw engineError(
        'OBJECT_SESSION_MISMATCH',
        'objectId belongs to a different session',
        400
      )
    }
    await ctx.state.objects.delete(ctx.params.objectId)
    return { ok: true, objectId: ctx.params.objectId }
  }
})
