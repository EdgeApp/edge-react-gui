/**
 * Swap quote / execute routes.
 *
 * Quotes are ephemeral object handles (`swap_` prefix, 5 min TTL). Approve
 * consumes the handle; close/delete releases it early.
 */
import type { EdgeSwapQuote, EdgeSwapRequest } from 'edge-core-js'

import { engineError } from '../errors'
import { findWallet, parseTokenId } from '../resolve'
import { requireBodyObject, type Router } from '../router'
import { getAccount, optionalString, requireString } from './helpers'

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

export function registerSwapRoutes(router: Router): void {
  /** account.fetchSwapQuotes(request, opts) */
  router.add('POST', '/accounts/{sessionId}/fetch-swap-quotes', async ctx => {
    const body = requireBodyObject(ctx.body)
    const account = getAccount(ctx)
    const fromWalletId = requireString(body, 'fromWalletId')
    const toWalletId = requireString(body, 'toWalletId')
    const fromWallet = findWallet(account, fromWalletId)
    const toWallet = findWallet(account, toWalletId)
    const fromTokenId = parseTokenId(optionalString(body, 'fromTokenId'))
    const toTokenId = parseTokenId(optionalString(body, 'toTokenId'))
    const nativeAmount = requireString(body, 'nativeAmount')
    const quoteForRaw = optionalString(body, 'quoteFor') ?? 'from'
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
    const preferPluginId = optionalString(body, 'preferPluginId')

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
  })

  router.add(
    'GET',
    '/accounts/{sessionId}/swap-quotes/{objectId}',
    async ctx => {
      const record = ctx.state.objects.get<EdgeSwapQuote>(
        ctx.params.objectId,
        'swap'
      )
      if (
        record.sessionId != null &&
        record.sessionId !== ctx.params.sessionId
      ) {
        throw engineError(
          'OBJECT_SESSION_MISMATCH',
          'objectId belongs to a different session',
          400
        )
      }
      const info = ctx.state.objects.toInfo(record)
      return summarizeQuote(info.objectId, info.expiresAt, record.value)
    }
  )

  router.add(
    'POST',
    '/accounts/{sessionId}/swap-quotes/{objectId}/approve',
    async ctx => {
      const record = ctx.state.objects.get<EdgeSwapQuote>(
        ctx.params.objectId,
        'swap'
      )
      if (
        record.sessionId != null &&
        record.sessionId !== ctx.params.sessionId
      ) {
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
  )

  router.add(
    'POST',
    '/accounts/{sessionId}/swap-quotes/{objectId}/close',
    async ctx => {
      const record = ctx.state.objects.get<EdgeSwapQuote>(
        ctx.params.objectId,
        'swap'
      )
      if (
        record.sessionId != null &&
        record.sessionId !== ctx.params.sessionId
      ) {
        throw engineError(
          'OBJECT_SESSION_MISMATCH',
          'objectId belongs to a different session',
          400
        )
      }
      await ctx.state.objects.delete(ctx.params.objectId)
      return { ok: true, objectId: ctx.params.objectId }
    }
  )
}
