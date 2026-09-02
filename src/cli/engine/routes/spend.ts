import type {
  EdgeCurrencyWallet,
  EdgeMemo,
  EdgeMetadata,
  EdgeSpendInfo,
  EdgeSpendTarget,
  EdgeTransaction
} from 'edge-core-js'

import { saveTxAndMetadata } from '../../../util/txTagging'
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

function asMetadata(value: unknown): EdgeMetadata | undefined {
  if (!isPlainObject(value)) return undefined
  return value as EdgeMetadata
}

function mergeMetadata(
  base: EdgeMetadata | undefined,
  overlay: EdgeMetadata | undefined
): EdgeMetadata | undefined {
  if (base == null && overlay == null) return undefined
  const merged = { ...base, ...overlay }
  return Object.keys(merged).length > 0 ? merged : undefined
}

async function buildSpendInfo(
  wallet: EdgeCurrencyWallet,
  body: Record<string, unknown>,
  opts: { requireAmount: boolean }
): Promise<EdgeSpendInfo> {
  const bodyMetadata = asMetadata(body.metadata)

  if (isPlainObject(body.spendInfo)) {
    const spendInfo = { ...(body.spendInfo as unknown as EdgeSpendInfo) }
    const metadata = mergeMetadata(spendInfo.metadata, bodyMetadata)
    if (metadata != null) spendInfo.metadata = metadata
    return spendInfo
  }

  const tokenId = parseTokenId(optionalString(body, 'tokenId'))
  const to = optionalString(body, 'to')
  const amount =
    optionalString(body, 'nativeAmount') ?? optionalString(body, 'amount')
  const spendTargets: EdgeSpendTarget[] = []
  let metadata = bodyMetadata
  let memos: EdgeMemo[] | undefined

  if (to != null) {
    let parsed
    try {
      parsed = await wallet.parseUri(to)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      throw engineError(
        'BAD_REQUEST',
        `Could not parse destination: ${message}`,
        400
      )
    }
    if (parsed.publicAddress == null || parsed.publicAddress === '') {
      throw engineError(
        'BAD_REQUEST',
        parsed.paymentProtocolUrl != null
          ? 'Payment protocol URIs are not supported on convenience spend; use GET .../payment-protocol'
          : 'Destination did not contain a public address',
        400
      )
    }
    const nativeAmount = amount ?? parsed.nativeAmount
    if (opts.requireAmount && nativeAmount == null) {
      throw engineError(
        'BAD_REQUEST',
        'Missing required field "nativeAmount" or "amount"',
        400
      )
    }
    spendTargets.push({
      publicAddress: parsed.publicAddress,
      nativeAmount
    })
    if (parsed.uniqueIdentifier != null) {
      memos = [{ type: 'text', value: parsed.uniqueIdentifier }]
    }
    metadata = mergeMetadata(parsed.metadata, bodyMetadata)
  }

  const spendInfo: EdgeSpendInfo = { tokenId, spendTargets }
  if (metadata != null) spendInfo.metadata = metadata
  if (memos != null) spendInfo.memos = memos
  return spendInfo
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
    '/account/{sessionId}/wallets/{walletId}/get-max-spendable',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      const spendInfo = await buildSpendInfo(wallet, body, {
        requireAmount: false
      })
      const nativeAmount = await wallet.getMaxSpendable(spendInfo)
      return { nativeAmount }
    }
  )

  router.add(
    'POST',
    '/account/{sessionId}/wallets/{walletId}/spend',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      const useMax = optionalBoolean(body, 'useMax') ?? false
      const spendInfo = await buildSpendInfo(wallet, body, {
        requireAmount: !useMax
      })

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
        const txToSave: EdgeTransaction = {
          ...finalTx,
          metadata: {
            ...spendInfo.metadata,
            ...finalTx.metadata
          }
        }
        try {
          await saveTxAndMetadata(wallet, txToSave)
          finalTx = txToSave
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
    '/account/{sessionId}/wallets/{walletId}/make-spend',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      const spendInfo = await buildSpendInfo(wallet, body, {
        requireAmount: true
      })
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
    '/account/{sessionId}/wallets/{walletId}/sign-tx',
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
    '/account/{sessionId}/wallets/{walletId}/broadcast-tx',
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
    '/account/{sessionId}/wallets/{walletId}/save-tx',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      const { objectId, transaction } = requireTxHandle(
        ctx,
        body,
        ctx.params.walletId
      )
      await saveTxAndMetadata(wallet, transaction)
      await ctx.state.objects.delete(objectId)
      return { ok: true, objectId }
    }
  )

  router.add(
    'POST',
    '/account/{sessionId}/wallets/{walletId}/accelerate',
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
    '/account/{sessionId}/wallets/{walletId}/sweep-private-keys',
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
    '/account/{sessionId}/wallets/{walletId}/sign-bytes',
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
    '/account/{sessionId}/wallets/{walletId}/get-payment-protocol-info',
    async ctx => {
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      const paymentProtocolUrl = requireQueryString(
        ctx.query,
        'paymentProtocolUrl'
      )
      return await wallet.getPaymentProtocolInfo(paymentProtocolUrl)
    }
  )

  // Inspect / release ephemeral transaction handles
  router.add('GET', '/account/{sessionId}/objects/{objectId}', async ctx => {
    const record = ctx.state.objects.get(ctx.params.objectId)
    if (record.sessionId != null && record.sessionId !== ctx.params.sessionId) {
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
  })

  router.add(
    'POST',
    '/account/{sessionId}/objects/{objectId}/delete',
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
