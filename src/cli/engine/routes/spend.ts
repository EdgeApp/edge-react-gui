import { asBoolean, asObject, asOptional, asString } from 'cleaners'
import type {
  EdgeCurrencyWallet,
  EdgeMemo,
  EdgeMetadata,
  EdgeSpendInfo,
  EdgeSpendTarget,
  EdgeTransaction
} from 'edge-core-js'

import { saveTxAndMetadata } from '../../../util/txTagging'
import { doc } from '../doc'
import { engineError } from '../errors'
import type { ObjectHandleInfo } from '../objectHandles'
import { findWallet, parseTokenId } from '../resolve'
import { route } from '../route'
import type { RouteContext } from '../router'
import {
  asCoreValue,
  asOkObject,
  asTokenId,
  asTransactionHandle,
  asWalletId
} from '../schemas'
import { getAccount, optionalBoolean, optionalString } from './helpers'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

/** The cleaned body, still carrying whatever `.withRest` let through. */
type SpendBody = Record<string, unknown>

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

/**
 * The wallet and transaction behind a `tx_` handle.
 *
 * A handle records the wallet it was staged against, so the later steps do
 * not ask for it again: `make-spend` names a wallet, and everything after it
 * names the handle. The session check still runs, so one session cannot
 * advance another's transaction.
 */
function stagedTx(
  ctx: RouteContext,
  objectId: string
): {
  objectId: string
  wallet: EdgeCurrencyWallet
  transaction: EdgeTransaction
} {
  const record = ctx.state.objects.get<EdgeTransaction>(objectId, 'transaction')
  if (record.sessionId != null && record.sessionId !== ctx.params.sessionId) {
    throw engineError(
      'OBJECT_SESSION_MISMATCH',
      `objectId ${objectId} belongs to a different session`,
      400
    )
  }
  if (record.walletId == null) {
    throw engineError(
      'OBJECT_WALLET_MISMATCH',
      `objectId ${objectId} is not bound to a wallet`,
      400
    )
  }
  return {
    objectId,
    wallet: findWallet(getAccount(ctx), record.walletId),
    transaction: record.value
  }
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

const WALLET_ERRORS = ['WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID']
const HANDLE_ERRORS = [
  'OBJECT_NOT_FOUND',
  'OBJECT_EXPIRED',
  'OBJECT_KIND_MISMATCH',
  'OBJECT_WALLET_MISMATCH',
  'OBJECT_SESSION_MISMATCH'
]

/**
 * Largest sendable amount.
 *
 * What empties the wallet after fees. A destination is still required, since
 * fees depend on it.
 */
export const getMaxSpendable = route({
  core: 'wallet.getMaxSpendable',
  coreExtra: {
    to:
      'Shorthand the engine expands into `spendTargets`, so a one-output ' +
      'send needs no nested JSON.',
    nativeAmount: 'Amount for the `to` shorthand, in the smallest unit.',
    amount: 'Amount for the `to` shorthand, in whole coins.'
  },
  method: 'POST',
  path: '/account/{sessionId}/wallet/get-max-spendable',
  cli: 'get-max-spendable',
  body: asObject({
    walletId: asWalletId,
    spendInfo: asOptional(
      doc(asCoreValue, 'A full `EdgeSpendInfo`, used as-is when present.')
    ),
    to: asOptional(
      doc(asString, 'Address or BIP21 URI, run through `wallet.parseUri`.')
    ),
    nativeAmount: asOptional(doc(asString, 'How much, in native units.')),
    amount: asOptional(doc(asString, 'Alias of `nativeAmount`.')),
    tokenId: asOptional(doc(asTokenId, 'Defaults to the native asset.')),
    metadata: asOptional(
      doc(asCoreValue, 'Wins over anything parsed out of the URI.')
    )
  }).withRest,
  returns: asObject({
    nativeAmount: doc(asString, 'The most this wallet can send.')
  }),
  errors: [
    'INSUFFICIENT_FUNDS',
    'BAD_REQUEST',
    'NETWORK_ERROR',
    ...WALLET_ERRORS
  ],

  async handler(ctx) {
    const body = ctx.body as SpendBody
    const wallet = findWallet(getAccount(ctx), ctx.body.walletId)
    const spendInfo = await buildSpendInfo(wallet, body, {
      requireAmount: false
    })
    const nativeAmount = await wallet.getMaxSpendable(spendInfo)
    return { nativeAmount }
  }
})

/**
 * Send funds.
 *
 * `makeSpend`, then `signTx`, then optionally `broadcastTx` and `saveTx`, in
 * one request. `broadcast` and `save` both default to true, so a bare body
 * with a destination and an amount moves real money. A completed spend leaves
 * no handle behind.
 *
 * @note BIP21 `label` and `message` from `to` become metadata name and notes.
 *   An explicit `metadata` object wins.
 * @note `saveError` is the case to handle. Once broadcast, the money is gone,
 *   so a failure inside saveTx cannot throw — it would hide the txid of a real
 *   payment. The response is 200 with the transaction plus `saveError`.
 * @note With `dryRun`, only makeSpend runs and the response is a transaction
 *   handle that expires in 5 minutes.
 * @coreNote GUI composite: makeSpend, signTx, broadcastTx and saveTx together.
 */
export const spend = route({
  core: null,
  method: 'POST',
  path: '/account/{sessionId}/wallet/spend',
  cli: [
    { command: 'spend' },
    {
      command: 'spend-max',
      preset: { useMax: true },
      notes: 'The same route with `useMax` preset, so it sends everything.'
    }
  ],
  body: asObject({
    walletId: asWalletId,
    spendInfo: asOptional(
      doc(asCoreValue, 'A full `EdgeSpendInfo`, used as-is when present.')
    ),
    to: asOptional(
      doc(asString, 'Address or BIP21 URI, run through `wallet.parseUri`.')
    ),
    nativeAmount: asOptional(doc(asString, 'How much, in native units.')),
    amount: asOptional(doc(asString, 'Alias of `nativeAmount`.')),
    tokenId: asOptional(doc(asTokenId, 'Defaults to the native asset.')),
    metadata: asOptional(
      doc(asCoreValue, 'Wins over anything parsed out of the URI.')
    ),
    useMax: asOptional(
      doc(asBoolean, "Replace the first target's amount with the maximum.")
    ),
    dryRun: asOptional(
      doc(asBoolean, 'Build only. Never signs or broadcasts.')
    ),
    broadcast: asOptional(doc(asBoolean, 'Defaults to **true**.')),
    save: asOptional(doc(asBoolean, 'Defaults to **true**.'))
  }).withRest,
  returns: doc(
    asCoreValue,
    '`{ transaction }`, plus `saveError` when the broadcast succeeded but saving failed. With dryRun, a TransactionHandle instead.'
  ),
  errors: [
    'INSUFFICIENT_FUNDS',
    'DUST_SPEND',
    'PENDING_FUNDS',
    'SPEND_TO_SELF',
    'NO_AMOUNT_SPECIFIED',
    'BAD_REQUEST',
    'NETWORK_ERROR',
    ...WALLET_ERRORS
  ],

  async handler(ctx) {
    const body = ctx.body as SpendBody
    const wallet = findWallet(getAccount(ctx), ctx.body.walletId)
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
        walletId: ctx.body.walletId,
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
          walletId: ctx.body.walletId,
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
})

/**
 * Build an unsigned transaction.
 *
 * First step of the staged workflow: nothing is signed and no funds move.
 * Inspect `transaction.networkFee` on the result before signing.
 */
export const makeSpend = route({
  core: 'wallet.makeSpend',
  coreExtra: {
    to:
      'Shorthand the engine expands into `spendTargets`, so a one-output ' +
      'send needs no nested JSON.',
    nativeAmount: 'Amount for the `to` shorthand, in the smallest unit.',
    amount: 'Amount for the `to` shorthand, in whole coins.'
  },
  method: 'POST',
  path: '/account/{sessionId}/wallet/make-spend',
  cli: 'make-spend',
  body: asObject({
    walletId: asWalletId,
    spendInfo: asOptional(
      doc(asCoreValue, 'A full `EdgeSpendInfo`, used as-is when present.')
    ),
    to: asOptional(
      doc(asString, 'Address or BIP21 URI, run through `wallet.parseUri`.')
    ),
    nativeAmount: asOptional(doc(asString, 'How much, in native units.')),
    amount: asOptional(doc(asString, 'Alias of `nativeAmount`.')),
    tokenId: asOptional(doc(asTokenId, 'Defaults to the native asset.')),
    metadata: asOptional(
      doc(asCoreValue, 'Wins over anything parsed out of the URI.')
    )
  }).withRest,
  returns: asTransactionHandle,
  errors: [
    'INSUFFICIENT_FUNDS',
    'DUST_SPEND',
    'NO_AMOUNT_SPECIFIED',
    'BAD_REQUEST',
    ...WALLET_ERRORS
  ],

  async handler(ctx) {
    const body = ctx.body as SpendBody
    const wallet = findWallet(getAccount(ctx), ctx.body.walletId)
    const spendInfo = await buildSpendInfo(wallet, body, {
      requireAmount: true
    })
    const transaction = await wallet.makeSpend(spendInfo)
    return storeTransaction(ctx, {
      sessionId: ctx.params.sessionId,
      walletId: ctx.body.walletId,
      transaction
    })
  }
})

/**
 * Sign a staged transaction.
 *
 * Keeps the same handle and pushes its expiry out another five minutes.
 */
export const signTx = route({
  core: 'wallet.signTx',
  method: 'POST',
  path: '/account/{sessionId}/sign-tx',
  cli: { command: 'sign-tx', positional: 'objectId' },
  body: asObject({
    objectId: doc(asString, 'From `make-spend`.')
  }).withRest,
  returns: asTransactionHandle,
  errors: ['BAD_REQUEST', ...HANDLE_ERRORS],

  async handler(ctx) {
    const {
      objectId,
      wallet,
      transaction: unsigned
    } = stagedTx(ctx, ctx.body.objectId)
    const transaction = await wallet.signTx(unsigned)
    return txHandleResponse(ctx, objectId, transaction)
  }
})

/**
 * Broadcast a signed transaction.
 *
 * The irreversible step: once this returns, the funds have left the wallet.
 *
 * @note Broadcasting does not record the transaction locally. Follow with
 *   `save-tx`, or it stays missing from history until a sync finds it.
 */
export const broadcastTx = route({
  core: 'wallet.broadcastTx',
  method: 'POST',
  path: '/account/{sessionId}/broadcast-tx',
  cli: { command: 'broadcast-tx', positional: 'objectId' },
  body: asObject({
    objectId: doc(asString, 'From `sign-tx`.')
  }).withRest,
  returns: doc(
    asTransactionHandle,
    'The handle survives, so `save-tx` can still run.'
  ),
  errors: ['BAD_REQUEST', 'NETWORK_ERROR', ...HANDLE_ERRORS],

  async handler(ctx) {
    const {
      objectId,
      wallet,
      transaction: signed
    } = stagedTx(ctx, ctx.body.objectId)
    const transaction = await wallet.broadcastTx(signed)
    return txHandleResponse(ctx, objectId, transaction)
  }
})

/**
 * Record a transaction and release its handle.
 *
 * Final step. The handle is gone afterwards, so a second call is a 404.
 */
export const saveTx = route({
  core: 'wallet.saveTx',
  method: 'POST',
  path: '/account/{sessionId}/save-tx',
  cli: { command: 'save-tx', positional: 'objectId' },
  body: asObject({
    objectId: doc(asString, 'The handle to persist and release.')
  }).withRest,
  returns: asOkObject,
  errors: ['BAD_REQUEST', ...HANDLE_ERRORS],

  async handler(ctx) {
    const { objectId, wallet, transaction } = stagedTx(ctx, ctx.body.objectId)
    await saveTxAndMetadata(wallet, transaction)
    await ctx.state.objects.delete(objectId)
    return { ok: true, objectId }
  }
})

/**
 * Fee-bump a pending transaction.
 *
 * Replace-by-fee, where the plugin supports it. Returns a new unsigned
 * transaction to sign and broadcast.
 *
 * @note A plugin that cannot accelerate returns 400 rather than a null
 *   transaction.
 */
export const accelerate = route({
  core: 'wallet.accelerate',
  coreExtra: {
    transaction:
      'Core names the parameter `tx`. Spelled out here to match the ' +
      '`transaction` field every staged-transaction response returns.'
  },
  method: 'POST',
  path: '/account/{sessionId}/wallet/accelerate',
  cli: 'accelerate',
  body: asObject({
    walletId: asWalletId,
    objectId: asOptional(doc(asString, 'Handle of the transaction to bump.')),
    transaction: asOptional(doc(asCoreValue, 'Or the transaction itself.'))
  }).withRest,
  returns: doc(
    asTransactionHandle,
    'Given objectId the same handle is updated; given a transaction a new one is created.'
  ),
  errors: ['BAD_REQUEST', ...HANDLE_ERRORS, ...WALLET_ERRORS],

  async handler(ctx) {
    const body = ctx.body as SpendBody
    const wallet = findWallet(getAccount(ctx), ctx.body.walletId)
    const objectId = optionalString(body, 'objectId')
    let source: EdgeTransaction
    if (objectId != null) {
      source = requireTxHandle(ctx, body, ctx.body.walletId).transaction
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
      walletId: ctx.body.walletId,
      transaction
    })
  }
})

/**
 * Sweep private keys into this wallet.
 *
 * Builds a transaction moving everything from an external key. Returns an
 * unsigned handle: sign, broadcast and save it like any staged spend.
 */
export const sweepPrivateKeys = route({
  core: 'wallet.sweepPrivateKeys',
  coreExtra: {
    spendInfo:
      'Core names this one `edgeSpendInfo` while `makeSpend` names the same ' +
      'type `spendInfo`. Both are `spendInfo` here.'
  },
  method: 'POST',
  path: '/account/{sessionId}/wallet/sweep-private-keys',
  cli: 'sweep-private-keys',
  body: asObject({
    walletId: asWalletId,
    spendInfo: doc(
      asCoreValue,
      'A full `EdgeSpendInfo`, with the keys to sweep in `privateKeys`.'
    )
  }).withRest,
  returns: asTransactionHandle,
  errors: [
    'BAD_REQUEST',
    'INSUFFICIENT_FUNDS',
    'NETWORK_ERROR',
    ...WALLET_ERRORS
  ],

  async handler(ctx) {
    const body = ctx.body as SpendBody
    const wallet = findWallet(getAccount(ctx), ctx.body.walletId)
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
      walletId: ctx.body.walletId,
      transaction
    })
  }
})

/**
 * Sign arbitrary bytes.
 *
 * Message signing and proof-of-ownership, for plugins that support it.
 *
 * @note Invalid base64 decodes to empty rather than erroring, so validate
 *   before sending.
 * @note Support is per plugin, and failures surface as `500 INTERNAL_ERROR`
 *   from the plugin rather than as a typed error: litecoin answers
 *   "litecoin doesn't support signBytes", and bitcoin requires
 *   `otherParams.publicAddress` naming which address to sign with.
 */
export const signBytes = route({
  core: 'wallet.signBytes',
  coreExtra: {
    bytes:
      'Core takes a Uint8Array named `buf`. JSON cannot carry bytes, so this ' +
      'is base64 text.'
  },
  method: 'POST',
  path: '/account/{sessionId}/wallet/sign-bytes',
  cli: 'sign-bytes',
  body: asObject({
    walletId: asWalletId,
    bytes: asOptional(doc(asString, 'Base64. Defaults to empty when absent.')),
    otherParams: asOptional(
      doc(
        asCoreValue,
        'Plugin-specific options. Bitcoin needs `{ publicAddress }`; other ' +
          'plugins take nothing, or refuse the call entirely.'
      )
    )
  }).withRest,
  returns: asObject({ signature: doc(asString, 'Base64.') }),
  errors: ['BAD_REQUEST', ...WALLET_ERRORS],

  async handler(ctx) {
    const body = ctx.body as SpendBody
    const wallet = findWallet(getAccount(ctx), ctx.body.walletId)
    const bytes = new Uint8Array(
      Buffer.from(optionalString(body, 'bytes') ?? '', 'base64')
    )
    const otherParams = isPlainObject(body.otherParams)
      ? body.otherParams
      : undefined
    const signature = await wallet.signBytes(bytes, { otherParams })
    return { signature }
  }
})

/**
 * Fetch a BIP70 payment request.
 *
 * Feed `spendTargets` from the result into `make-spend` to pay it.
 */
export const getPaymentProtocolInfo = route({
  core: 'wallet.getPaymentProtocolInfo',
  method: 'GET',
  path: '/account/{sessionId}/wallet/get-payment-protocol-info',
  cli: 'get-payment-protocol-info',
  query: asObject({
    walletId: asWalletId,
    paymentProtocolUrl: doc(asString, 'The payment-request URL.')
  }).withRest,
  returns: doc(
    asCoreValue,
    '`EdgePaymentProtocolInfo`: domain, memo, merchant, nativeAmount, spendTargets.'
  ),
  errors: ['BAD_REQUEST', 'NETWORK_ERROR', ...WALLET_ERRORS],

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.query.valid.walletId)
    return await wallet.getPaymentProtocolInfo(
      ctx.query.valid.paymentProtocolUrl
    )
  }
})
