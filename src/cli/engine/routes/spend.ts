import type {
  EdgeSpendInfo,
  EdgeSpendTarget,
  EdgeTransaction
} from 'edge-core-js'

import { engineError } from '../errors'
import type { ObjectHandleInfo } from '../objectHandles'
import { findWallet, parseTokenId } from '../resolve'
import { requireBodyObject, type RouteContext, type Router } from '../router'
import {
  getAccount,
  optionalBoolean,
  optionalString,
  requireQueryString
} from './helpers'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function buildSpendInfo(
  body: Record<string, unknown>,
  opts: { requireAmount: boolean }
): EdgeSpendInfo {
  if (isPlainObject(body.spendInfo)) {
    return body.spendInfo as unknown as EdgeSpendInfo
  }

  const tokenId = parseTokenId(optionalString(body, 'tokenId'))
  const to = optionalString(body, 'to')
  const amount =
    optionalString(body, 'nativeAmount') ?? optionalString(body, 'amount')
  const spendTargets: EdgeSpendTarget[] = []

  if (to != null) {
    if (opts.requireAmount && amount == null) {
      throw engineError(
        'BAD_REQUEST',
        'Missing required field "nativeAmount" or "amount"',
        400
      )
    }
    spendTargets.push({ publicAddress: to, nativeAmount: amount })
  }

  return { tokenId, spendTargets }
}

function storeTransaction(
  ctx: RouteContext,
  opts: {
    sessionId: string
    walletId: string
    transaction: EdgeTransaction
  }
): ObjectHandleInfo & { transaction: EdgeTransaction } {
  const handle = ctx.state.objects.create({
    kind: 'transaction',
    prefix: 'tx_',
    value: opts.transaction,
    sessionId: opts.sessionId,
    walletId: opts.walletId
  })
  return {
    objectId: handle.objectId,
    kind: handle.kind,
    expiresAt: handle.expiresAt,
    sessionId: handle.sessionId,
    walletId: handle.walletId,
    transaction: opts.transaction
  }
}

function requireTxHandle(
  ctx: RouteContext,
  body: Record<string, unknown>,
  walletId: string
): { objectId: string; transaction: EdgeTransaction } {
  const objectId = optionalString(body, 'objectId')
  if (objectId == null) {
    throw engineError(
      'BAD_REQUEST',
      'Missing required field "objectId" (from make-spend / prior step)',
      400
    )
  }
  const record = ctx.state.objects.get<EdgeTransaction>(objectId, 'transaction')
  if (record.walletId != null && record.walletId !== walletId) {
    throw engineError(
      'OBJECT_WALLET_MISMATCH',
      `objectId ${objectId} belongs to a different wallet`,
      400
    )
  }
  if (record.sessionId != null && record.sessionId !== ctx.params.sessionId) {
    throw engineError(
      'OBJECT_SESSION_MISMATCH',
      `objectId ${objectId} belongs to a different session`,
      400
    )
  }
  return { objectId, transaction: record.value }
}

function txHandleResponse(
  ctx: RouteContext,
  objectId: string,
  transaction: EdgeTransaction
): ObjectHandleInfo & { transaction: EdgeTransaction } {
  const info = ctx.state.objects.update(objectId, transaction)
  return {
    ...info,
    transaction
  }
}

export function registerSpendRoutes(router: Router): void {
  router.add(
    'POST',
    '/v1/accounts/{sessionId}/wallets/{walletId}/max-spendable',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      const spendInfo = buildSpendInfo(body, { requireAmount: false })
      const nativeAmount = await wallet.getMaxSpendable(spendInfo)
      return { nativeAmount }
    }
  )

  router.add(
    'POST',
    '/v1/accounts/{sessionId}/wallets/{walletId}/spend',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      const useMax = optionalBoolean(body, 'useMax') ?? false
      const spendInfo = buildSpendInfo(body, { requireAmount: !useMax })

      if (useMax && spendInfo.spendTargets[0] != null) {
        const nativeAmount = await wallet.getMaxSpendable(spendInfo)
        spendInfo.spendTargets[0].nativeAmount = nativeAmount
      }

      const unsignedTx = await wallet.makeSpend(spendInfo)
      const dryRun = optionalBoolean(body, 'dryRun') ?? false
      if (dryRun) {
        // Dry-run returns a handle so the caller can inspect fees, then the
        // object expires (or they delete it) — nothing is signed/broadcast.
        return storeTransaction(ctx, {
          sessionId: ctx.params.sessionId,
          walletId: ctx.params.walletId,
          transaction: unsignedTx
        })
      }

      const signedTx = await wallet.signTx(unsignedTx)
      const broadcast = optionalBoolean(body, 'broadcast') ?? true
      const save = optionalBoolean(body, 'save') ?? true

      let finalTx: EdgeTransaction = signedTx
      if (broadcast) finalTx = await wallet.broadcastTx(signedTx)

      let saveError: string | undefined
      if (save) {
        try {
          await wallet.saveTx(finalTx)
        } catch (error: unknown) {
          // Once broadcast, the spend is real. Throwing here would deny the
          // caller the txid of money that already left the wallet, so report
          // the failure alongside the transaction instead.
          if (!broadcast) throw error
          saveError = error instanceof Error ? error.message : String(error)
          ctx.state.logger.warn('saveTx failed after broadcast', {
            walletId: ctx.params.walletId,
            txid: finalTx.txid,
            error: saveError
          })
        }
      }

      // Completed spends do not leave an engine-side handle.
      return saveError == null
        ? { transaction: finalTx }
        : { transaction: finalTx, saveError }
    }
  )

  router.add(
    'POST',
    '/v1/accounts/{sessionId}/wallets/{walletId}/make-spend',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      const spendInfo = isPlainObject(body.spendInfo)
        ? (body.spendInfo as unknown as EdgeSpendInfo)
        : buildSpendInfo(body, { requireAmount: true })
      const transaction = await wallet.makeSpend(spendInfo)
      return storeTransaction(ctx, {
        sessionId: ctx.params.sessionId,
        walletId: ctx.params.walletId,
        transaction
      })
    }
  )

  router.add(
    'POST',
    '/v1/accounts/{sessionId}/wallets/{walletId}/sign-tx',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      const { objectId, transaction: unsigned } = requireTxHandle(
        ctx,
        body,
        ctx.params.walletId
      )
      const transaction = await wallet.signTx(unsigned)
      return txHandleResponse(ctx, objectId, transaction)
    }
  )

  router.add(
    'POST',
    '/v1/accounts/{sessionId}/wallets/{walletId}/broadcast-tx',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      const { objectId, transaction: signed } = requireTxHandle(
        ctx,
        body,
        ctx.params.walletId
      )
      const transaction = await wallet.broadcastTx(signed)
      return txHandleResponse(ctx, objectId, transaction)
    }
  )

  router.add(
    'POST',
    '/v1/accounts/{sessionId}/wallets/{walletId}/save-tx',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      const { objectId, transaction } = requireTxHandle(
        ctx,
        body,
        ctx.params.walletId
      )
      await wallet.saveTx(transaction)
      await ctx.state.objects.delete(objectId)
      return { ok: true, objectId }
    }
  )

  router.add(
    'POST',
    '/v1/accounts/{sessionId}/wallets/{walletId}/accelerate',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      const objectId = optionalString(body, 'objectId')
      let source: EdgeTransaction
      if (objectId != null) {
        source = requireTxHandle(ctx, body, ctx.params.walletId).transaction
      } else if (isPlainObject(body.transaction)) {
        source = body.transaction as unknown as EdgeTransaction
      } else {
        throw engineError(
          'BAD_REQUEST',
          'Missing required field "objectId" or "transaction"',
          400
        )
      }
      const transaction = await wallet.accelerate(source)
      if (transaction == null) {
        throw engineError(
          'BAD_REQUEST',
          'Wallet could not accelerate this transaction',
          400
        )
      }
      if (objectId != null) {
        return txHandleResponse(ctx, objectId, transaction)
      }
      return storeTransaction(ctx, {
        sessionId: ctx.params.sessionId,
        walletId: ctx.params.walletId,
        transaction
      })
    }
  )

  router.add(
    'POST',
    '/v1/accounts/{sessionId}/wallets/{walletId}/sweep',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      if (!isPlainObject(body.spendInfo)) {
        throw engineError(
          'BAD_REQUEST',
          'Missing required field "spendInfo"',
          400
        )
      }
      const transaction = await wallet.sweepPrivateKeys(
        body.spendInfo as unknown as EdgeSpendInfo
      )
      return storeTransaction(ctx, {
        sessionId: ctx.params.sessionId,
        walletId: ctx.params.walletId,
        transaction
      })
    }
  )

  router.add(
    'POST',
    '/v1/accounts/{sessionId}/wallets/{walletId}/sign-bytes',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      // Prefer the documented `bytes` field; accept legacy `data` too.
      const data =
        optionalString(body, 'bytes') ?? optionalString(body, 'data') ?? ''
      const bytes = new Uint8Array(Buffer.from(data, 'base64'))
      const otherParams = isPlainObject(body.otherParams)
        ? body.otherParams
        : undefined
      const signature = await wallet.signBytes(bytes, { otherParams })
      return { signature }
    }
  )

  router.add(
    'GET',
    '/v1/accounts/{sessionId}/wallets/{walletId}/payment-protocol',
    async ctx => {
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      const url = requireQueryString(ctx.query, 'url')
      return await wallet.getPaymentProtocolInfo(url)
    }
  )

  // Inspect / release ephemeral transaction handles
  router.add(
    'GET',
    '/v1/accounts/{sessionId}/objects/{objectId}',
    async ctx => {
      const record = ctx.state.objects.get(ctx.params.objectId)
      if (
        record.sessionId != null &&
        record.sessionId !== ctx.params.sessionId
      ) {
        throw engineError(
          'OBJECT_SESSION_MISMATCH',
          `objectId belongs to a different session`,
          400
        )
      }
      return {
        ...ctx.state.objects.toInfo(record),
        value: record.value
      }
    }
  )

  router.add(
    'DELETE',
    '/v1/accounts/{sessionId}/objects/{objectId}',
    async ctx => {
      const record = ctx.state.objects.get(ctx.params.objectId)
      if (
        record.sessionId != null &&
        record.sessionId !== ctx.params.sessionId
      ) {
        throw engineError(
          'OBJECT_SESSION_MISMATCH',
          `objectId belongs to a different session`,
          400
        )
      }
      await ctx.state.objects.delete(ctx.params.objectId)
      return { ok: true, objectId: ctx.params.objectId }
    }
  )
}
