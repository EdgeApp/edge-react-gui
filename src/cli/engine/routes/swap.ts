/**
 * Swap quote / execute routes.
 *
 * Quotes are ephemeral object handles (`swap_` prefix, 5 min TTL). Approve
 * consumes the handle; close/delete releases it early.
 */
import {
  asArray,
  asNumber,
  asObject,
  asOptional,
  asString,
  asValue
} from 'cleaners'
import type { EdgeSwapQuote, EdgeSwapRequest } from 'edge-core-js'

import { doc } from '../doc'
import { WALLET_ERRORS } from '../errorGroups'
import { SPEND_AMOUNT_DOC, TOKEN_ID_DOC } from '../fieldDocs'
import { assertTokenId, findWallet } from '../resolve'
import { route } from '../route'
import {
  asCoreValue,
  asIntegerString,
  asOkObject,
  asRequestTokenId,
  asSwapQuote,
  type SwapQuote
} from '../schemas'
import { getAccount, requireOwnedHandle } from './helpers'

function summarizeQuote(
  objectId: string,
  expiresAt: string,
  quote: EdgeSwapQuote
): SwapQuote {
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
    nativeAmount: doc(asIntegerString, SPEND_AMOUNT_DOC),
    // `asRequestTokenId`, like the ten other request-position tokenIds: the
    // CLI sends every tokenId as text, so `--from-token-id=null` — the
    // spelling the guide documents — arrived as the four characters "null"
    // and `asTokenId` accepted it verbatim, asking every swap plugin to
    // price a token literally named `null`.
    fromTokenId: asOptional(doc(asRequestTokenId, TOKEN_ID_DOC), null),
    toTokenId: asOptional(doc(asRequestTokenId, TOKEN_ID_DOC), null),
    quoteFor: asOptional(
      doc(
        // The same enum `schemas.ts`'s response cleaner already spells. It
        // was `asString` plus a three-way `!==` chain in the handler, so the
        // branch disagreed with itself about one field and the generated
        // reference documented a free-form string.
        asValue<Array<'from' | 'to' | 'max'>>('from', 'to', 'max'),
        '`from` spends this much of the source, `to` receives this much at the destination, `max` sends everything. Defaults to `from`.'
      ),
      'from'
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
    'TOKEN_NOT_FOUND',
    'NETWORK_ERROR',
    // Both wallets come from `findWallet`, so a prefix two wallets share is
    // a 409 this list used to omit.
    ...WALLET_ERRORS
  ],

  async handler(ctx) {
    const account = getAccount(ctx)
    const fromWallet = findWallet(account, ctx.body.fromWalletId)
    const toWallet = findWallet(account, ctx.body.toWalletId)
    // `asOptional(asTokenId, null)` already yields null for both an absent
    // and an explicitly null tokenId, so the post-hoc `parseTokenId` the
    // handlers used to call could never change the value.
    const { fromTokenId, toTokenId } = ctx.body
    // The only one of the eleven tokenId-taking routes that did not check.
    // Core does not either — `fetchSwapQuotes` hands the request to every
    // enabled plugin — and the plugins destructure the token record:
    // `const { currencyCode } = wallet.currencyConfig.allTokens[tokenId]`.
    // So a bogus tokenId was a `TypeError` inside each plugin, `pickBestError`
    // rethrew it, and the caller got `500 INTERNAL_ERROR` naming no field,
    // where every sibling route answers `404 TOKEN_NOT_FOUND`.
    assertTokenId(fromWallet, fromTokenId)
    assertTokenId(toWallet, toTokenId)
    const { nativeAmount } = ctx.body
    const { preferPluginId, quoteFor } = ctx.body

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
        // Not swallowed. `close()` is the engine's only cancellation of a
        // real order at the exchange, and it runs on a logout, on a
        // shutdown and on every 5-minute expiry — so an exchange that
        // refuses it leaves that order live. `ObjectHandleStore.delete`
        // reports the failure with the handle's id and kind and rethrows,
        // which is what the four sites built to catch it were written for.
        onExpire: async value => {
          await value.close()
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
    'OBJECT_SESSION_MISMATCH',
    // `requireOwnedHandle` throws this for a handle that is mid-call, which
    // a second shell closing a quote while `approve-swap-quote` runs will
    // hit. `approveSwapQuote` declares it; these did not, so the generated
    // reference omitted a status a caller meets.
    'OBJECT_IN_USE'
  ],

  async handler(ctx) {
    const record = requireOwnedHandle<EdgeSwapQuote>(
      ctx,
      ctx.params.objectId,
      'swap'
    )
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
 * @note A failure releases the handle too, and a retry answers
 *   `OBJECT_NOT_FOUND`. `approve()` signs, broadcasts and then does its own
 *   bookkeeping, and from outside the plugin an error after the money moved
 *   cannot be told from one before it — so a retry has to start from a fresh
 *   quote rather than risk a second broadcast.
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
      'The exchange’s order reference, when it gives one.'
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
    'OBJECT_IN_USE',
    'INSUFFICIENT_FUNDS',
    'NETWORK_ERROR'
  ],

  async handler(ctx) {
    const record = requireOwnedHandle<EdgeSwapQuote>(
      ctx,
      ctx.params.objectId,
      'swap'
    )
    const result = await ctx.state.objects.consume(
      record,
      async quote => await quote.approve()
    )
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
    'OBJECT_SESSION_MISMATCH',
    // `requireOwnedHandle` throws this for a handle that is mid-call, which
    // a second shell closing a quote while `approve-swap-quote` runs will
    // hit. `approveSwapQuote` declares it; these did not, so the generated
    // reference omitted a status a caller meets.
    'OBJECT_IN_USE'
  ],

  async handler(ctx) {
    requireOwnedHandle<EdgeSwapQuote>(ctx, ctx.params.objectId, 'swap')
    await ctx.state.objects.release(ctx.params.objectId)
    return { ok: true, objectId: ctx.params.objectId }
  }
})
