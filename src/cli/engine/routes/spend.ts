import { asBoolean, asObject, asOptional, asString, asUnknown } from 'cleaners'
import type {
  EdgeCurrencyWallet,
  EdgeMemo,
  EdgeMetadata,
  EdgeSpendInfo,
  EdgeSpendTarget,
  EdgeTransaction
} from 'edge-core-js'
import { base64 } from 'rfc4648'

import { saveTxAndMetadata } from '../../../util/txTagging'
import { doc } from '../doc'
import { HANDLE_ERRORS, WALLET_ERRORS } from '../errorGroups'
import { engineError } from '../errors'
import type { HandleRecord, ObjectHandleInfo } from '../objectHandles'
import { assertTokenId, findWallet } from '../resolve'
import { route } from '../route'
import type { RouteContext } from '../router'
import {
  asCoreValue,
  type asEdgeMetadata,
  asOkObject,
  type asSpendInfo,
  asSpendShorthandBody,
  asSweepSpendInfo,
  asTransactionHandle,
  asTransactionInput,
  asWalletId
} from '../schemas'
import { getAccount, requireOwnedHandle } from './helpers'

function mergeMetadata(
  base: EdgeMetadata | undefined,
  overlay: EdgeMetadata | undefined
): EdgeMetadata | undefined {
  if (base == null && overlay == null) return undefined
  const merged = { ...base, ...overlay }
  return Object.keys(merged).length > 0 ? merged : undefined
}

/**
 * The fields `buildSpendInfo` reads, as its three callers declare them.
 *
 * Named rather than `Record<string, unknown>`: the erased type threw away
 * what `route.ts` had already validated, so every field was checked twice
 * with two different messages and a renamed declaration would have left the
 * helper's string literals silently stale.
 */
interface SpendInput {
  spendInfo?: ReturnType<typeof asSpendInfo>
  to?: string
  nativeAmount?: string
  amount?: string
  tokenId?: string | null
  // Typed, because the declaration validates it now: it was `unknown` while
  // the field was `asCoreValue` and the handler re-checked it by hand.
  metadata?: ReturnType<typeof asEdgeMetadata>
}

/**
 * Every target says where the money goes, and how much when the route needs it.
 *
 * `requireAmount` mirrors the `to` path exactly: the routes that broadcast
 * demand an amount, and `make-spend` and `--max` leave it to core. The index
 * is in the message because a caller sending several targets otherwise has no
 * way to tell which one it got wrong.
 */
function assertSpendTargets(
  targets: EdgeSpendTarget[] | undefined,
  requireAmount: boolean
): void {
  if (targets == null) return
  targets.forEach((target, index) => {
    const where = `spendTargets[${index}]`
    if (target.publicAddress == null || target.publicAddress === '') {
      throw engineError(
        'BAD_REQUEST',
        `Missing required field "${where}.publicAddress"`,
        400
      )
    }
    if (
      requireAmount &&
      (target.nativeAmount == null || target.nativeAmount === '')
    ) {
      throw engineError(
        'BAD_REQUEST',
        `Missing required field "${where}.nativeAmount"`,
        400
      )
    }
  })
}

async function buildSpendInfo(
  wallet: EdgeCurrencyWallet,
  body: SpendInput,
  opts: { requireAmount: boolean }
): Promise<EdgeSpendInfo> {
  const bodyMetadata = body.metadata

  if (body.spendInfo != null) {
    const spendInfo = { ...body.spendInfo } as unknown as EdgeSpendInfo
    // Above the return, not below it. Core does
    // `tokenId == null ? currencyInfo : allTokens[tokenId]` and destructures
    // the result, so an unknown tokenId inside a caller-supplied `spendInfo`
    // was a `TypeError` — `500 INTERNAL_ERROR` with no field name, on routes
    // that declare `TOKEN_NOT_FOUND`.
    assertTokenId(wallet, spendInfo.tokenId ?? null)
    // Above the return for the same reason, and this gap was worse than the
    // tokenId one. Core does `if (publicAddress == null) continue`, so a
    // target with no address is dropped and the *rest* of the transaction is
    // still signed and broadcast: the engine answered 200 with a transaction
    // paying fewer outputs than the caller asked for, which no amount of
    // retrying can take back. `.withRest` keeps a typo such as
    // `publicAdress` as an unread rest field, which is the common way in,
    // and the `spendTargets.length === 0` guard cannot see any of it because
    // the array is not empty. The `to` shorthand below has always checked
    // both of these; only the caller-supplied `spendInfo` escaped.
    assertSpendTargets(spendInfo.spendTargets, opts.requireAmount)
    const metadata = mergeMetadata(spendInfo.metadata, bodyMetadata)
    if (metadata != null) spendInfo.metadata = metadata
    return spendInfo
  }

  const tokenId = body.tokenId ?? null
  const to = body.to
  const amount = body.nativeAmount ?? body.amount
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

  assertTokenId(wallet, tokenId)
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
    createdAt: handle.createdAt,
    expiresAt: handle.expiresAt,
    sessionId: handle.sessionId,
    walletId: handle.walletId,
    transaction: opts.transaction
  }
}

/**
 * The staged transaction named by `objectId`, checked against a wallet.
 *
 * `walletId` must be a resolved `wallet.id`, never the caller's raw input:
 * `asWalletId` accepts any unique prefix, so comparing raw strings rejected a
 * prefix and a full id that name the same wallet.
 */
function requireTxHandle(
  ctx: RouteContext,
  body: { objectId?: string },
  walletId: string
): {
  objectId: string
  transaction: EdgeTransaction
  /** The record itself, for a caller that has to `hold` it across a call. */
  record: HandleRecord<EdgeTransaction>
} {
  const objectId = body.objectId
  if (objectId == null) {
    throw engineError(
      'BAD_REQUEST',
      'Missing required field "objectId" (from make-spend / prior step)',
      400
    )
  }
  const record = requireOwnedHandle<EdgeTransaction>(
    ctx,
    objectId,
    'transaction'
  )
  if (record.walletId != null && record.walletId !== walletId) {
    throw engineError(
      'OBJECT_WALLET_MISMATCH',
      `objectId ${objectId} belongs to a different wallet`,
      400
    )
  }
  return { objectId, transaction: record.value, record }
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
  record: HandleRecord<EdgeTransaction>
} {
  const record = requireOwnedHandle<EdgeTransaction>(
    ctx,
    objectId,
    'transaction'
  )
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
    transaction: record.value,
    record
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

/**
 * Largest sendable amount.
 *
 * What empties the wallet after fees. A destination is still required, since
 * fees depend on it.
 */
export const getMaxSpendable = route({
  core: 'wallet.getMaxSpendable',
  // Inline, not shared. `scripts/extractRoutes.ts` reads `coreExtra` with
  // the TypeScript checker as an object literal, so a reference to an
  // imported const is invisible to it and `checkCoreAlignment` then reports
  // every shorthand field as unexplained. The body above *can* be shared,
  // because that is a type the checker resolves.
  coreExtra: {
    to:
      'Shorthand the engine expands into `spendTargets`, so a one-output ' +
      'send needs no nested JSON.',
    nativeAmount: 'Amount for the `to` shorthand, in the smallest unit.',
    amount:
      'Alias of `nativeAmount` for the `to` shorthand: the chain\u2019s smallest unit, not whole coins.'
  },
  method: 'POST',
  path: '/account/{sessionId}/wallet/get-max-spendable',
  cli: 'get-max-spendable',
  body: asSpendShorthandBody.withRest,
  returns: asObject({
    nativeAmount: doc(asString, 'The most this wallet can send.')
  }),
  errors: [
    'TOKEN_NOT_FOUND',
    'INSUFFICIENT_FUNDS',
    'BAD_REQUEST',
    'NETWORK_ERROR',
    ...WALLET_ERRORS
  ],

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.body.walletId)
    const spendInfo = await buildSpendInfo(wallet, ctx.body, {
      requireAmount: false
    })
    if (spendInfo.spendTargets.length === 0) {
      throw engineError(
        'BAD_REQUEST',
        'A destination is required: pass `to`, or `spendTargets`. Fees depend on it, so core cannot compute a maximum without one.',
        400
      )
    }
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
      summary: 'Send a wallet\u2019s entire spendable balance.',
      notes: 'The same route with `useMax` preset, so it sends everything.'
    }
  ],
  body: asObject({
    ...asSpendShorthandBody.shape,
    useMax: asOptional(
      doc(asBoolean, 'Replace the first target’s amount with the maximum.')
    ),
    dryRun: asOptional(
      doc(asBoolean, 'Build only. Never signs or broadcasts.')
    ),
    broadcast: asOptional(
      doc(
        asBoolean,
        'Defaults to **true**. With `false` the transaction is signed and not sent, so `save` then defaults to false as well — recording an unsent transaction marks its inputs spent locally for something the network will never confirm.'
      )
    ),
    save: asOptional(
      doc(
        asBoolean,
        'Record the transaction in the wallet. Defaults to whatever `broadcast` is. Setting it true alongside `broadcast: false` is refused: use `--dry-run`, or the staged `make-spend` → `sign-tx` → `broadcast-tx` → `save-tx` flow.'
      )
    )
  }).withRest,
  returns: doc(
    asCoreValue,
    '`{ transaction }`, plus `saveError` when the broadcast succeeded but saving failed. With dryRun, a TransactionHandle instead.'
  ),
  errors: [
    'TOKEN_NOT_FOUND',
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
    const broadcast = ctx.body.broadcast ?? true
    // `save` follows `broadcast` rather than defaulting to true on its own.
    // The pair `broadcast: false, save: true` signed a transaction, never
    // sent it, and then wrote it into the wallet as a real one:
    // `wallet.saveTx` reaches the UTXO engine's `saveTx`, which stores the
    // transaction *and* processes its own UTXOs, so the inputs are marked
    // spent locally for something that will never confirm and will never be
    // dropped, because nothing on the network has it. The wallet shows a
    // phantom pending send and a reduced balance until a full
    // `resync-blockchain`.
    //
    // Refused up front: it is a usage error, so it must not depend on the
    // wallet having enough funds to get as far as signing.
    const save = ctx.body.save ?? broadcast
    if (!broadcast && save) {
      throw engineError(
        'BAD_REQUEST',
        'save requires broadcast: recording a transaction that was never sent marks its inputs spent for something the network will not confirm. Use dryRun to build only, or make-spend → sign-tx → broadcast-tx → save-tx to stage it.',
        400
      )
    }

    const wallet = findWallet(getAccount(ctx), ctx.body.walletId)
    // `ctx.body` is the cleaned value `route.ts` substituted. Re-reading the
    // raw body through `optionalBoolean` validated every field a second time,
    // with a different message, and left the string literals silently stale
    // if a declaration were renamed.
    const useMax = ctx.body.useMax ?? false
    const spendInfo = await buildSpendInfo(wallet, ctx.body, {
      requireAmount: !useMax
    })

    // The same guard `get-max-spendable` has, 90 lines up. `spend` only
    // consulted the maximum when a target already existed and otherwise fell
    // through to `makeSpend({ spendTargets: [] })`, where the plugin throws a
    // plain `Error` — so `edge-cli spend-max --wallet-id=<id>`, a one-flag
    // mistake on a documented command, answered `500 INTERNAL_ERROR` outside
    // the route's declared errors instead of saying what was missing.
    if (spendInfo.spendTargets.length === 0) {
      throw engineError(
        'BAD_REQUEST',
        'A destination is required: pass `to`, or `spendTargets`.',
        400
      )
    }
    if (useMax) {
      const nativeAmount = await wallet.getMaxSpendable(spendInfo)
      spendInfo.spendTargets[0].nativeAmount = nativeAmount
    }

    const unsignedTx = await wallet.makeSpend(spendInfo)
    const dryRun = ctx.body.dryRun ?? false
    if (dryRun) {
      // Dry-run returns a handle so the caller can inspect fees, then the
      // object expires (or they delete it) — nothing is signed/broadcast.
      return storeTransaction(ctx, {
        sessionId: ctx.params.sessionId,
        walletId: wallet.id,
        transaction: unsignedTx
      })
    }

    const signedTx = await wallet.signTx(unsignedTx)

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
          walletId: wallet.id,
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
  // Inline, not shared. `scripts/extractRoutes.ts` reads `coreExtra` with
  // the TypeScript checker as an object literal, so a reference to an
  // imported const is invisible to it and `checkCoreAlignment` then reports
  // every shorthand field as unexplained. The body above *can* be shared,
  // because that is a type the checker resolves.
  coreExtra: {
    to:
      'Shorthand the engine expands into `spendTargets`, so a one-output ' +
      'send needs no nested JSON.',
    nativeAmount: 'Amount for the `to` shorthand, in the smallest unit.',
    amount:
      'Alias of `nativeAmount` for the `to` shorthand: the chain\u2019s smallest unit, not whole coins.'
  },
  method: 'POST',
  path: '/account/{sessionId}/wallet/make-spend',
  cli: 'make-spend',
  body: asSpendShorthandBody.withRest,
  returns: asTransactionHandle,
  errors: [
    'TOKEN_NOT_FOUND',
    'INSUFFICIENT_FUNDS',
    'DUST_SPEND',
    'NO_AMOUNT_SPECIFIED',
    'BAD_REQUEST',
    ...WALLET_ERRORS
  ],

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.body.walletId)
    const spendInfo = await buildSpendInfo(wallet, ctx.body, {
      requireAmount: true
    })
    const transaction = await wallet.makeSpend(spendInfo)
    return storeTransaction(ctx, {
      sessionId: ctx.params.sessionId,
      walletId: wallet.id,
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
      transaction: unsigned,
      record
    } = stagedTx(ctx, ctx.body.objectId)
    const transaction = await ctx.state.objects.hold(
      record,
      async () => await wallet.signTx(unsigned)
    )
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
      transaction: signed,
      record
    } = stagedTx(ctx, ctx.body.objectId)
    const transaction = await ctx.state.objects.hold(
      record,
      async () => await wallet.broadcastTx(signed)
    )
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
    transaction: asOptional(
      doc(asTransactionInput, 'Or the transaction itself.')
    )
  }).withRest,
  returns: doc(
    asTransactionHandle,
    'Given objectId the same handle is updated; given a transaction a new one is created.'
  ),
  errors: ['BAD_REQUEST', ...HANDLE_ERRORS, ...WALLET_ERRORS],

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.body.walletId)
    const objectId = ctx.body.objectId
    let transaction: EdgeTransaction | null
    if (objectId != null) {
      // `hold`, like `sign-tx` and `broadcast-tx`. The expiry is checked on
      // the way *out*, through `update`, so an unguarded plugin call that
      // crossed the five-minute boundary had its handle collected by the
      // 15-second sweeper and the accelerated transaction was then thrown
      // away with a 404 the caller cannot tell from "wrong id".
      const staged = requireTxHandle(ctx, ctx.body, wallet.id)
      transaction = await ctx.state.objects.hold(
        staged.record,
        async () => await wallet.accelerate(staged.transaction)
      )
    } else if (ctx.body.transaction != null) {
      transaction = await wallet.accelerate(
        ctx.body.transaction as unknown as EdgeTransaction
      )
    } else {
      throw engineError(
        'BAD_REQUEST',
        'Missing required field "objectId" or "transaction"',
        400
      )
    }
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
      walletId: wallet.id,
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
      asSweepSpendInfo,
      'The keys to sweep in `privateKeys`, plus the optional `spendTargets`, `tokenId`, `metadata` and `memos` of a spend.'
    )
  }).withRest,
  returns: asTransactionHandle,
  errors: [
    'BAD_REQUEST',
    'INSUFFICIENT_FUNDS',
    'NETWORK_ERROR',
    'TOKEN_NOT_FOUND',
    ...WALLET_ERRORS
  ],

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.body.walletId)
    // The declaration requires `spendInfo` and names its fields, so a
    // missing or malformed one is the 400 this route publishes rather than a
    // plain `Error` from the plugin surfacing as 500.
    assertTokenId(wallet, ctx.body.spendInfo.tokenId)
    const transaction = await wallet.sweepPrivateKeys(
      ctx.body.spendInfo as unknown as EdgeSpendInfo
    )
    return storeTransaction(ctx, {
      sessionId: ctx.params.sessionId,
      walletId: wallet.id,
      transaction
    })
  }
})

/**
 * Sign arbitrary bytes.
 *
 * Message signing and proof-of-ownership, for plugins that support it.
 *
 * @note Invalid base64 is refused with `BAD_REQUEST` rather than signed.
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
    // `asObject(asUnknown)`, so a non-object is a 400 naming the field. As
    // `asCoreValue` it passed the declaration and was then *dropped* by the
    // handler, so `--other-params='"x"'` signed with no options at all and
    // produced a confusing plugin failure instead of saying what was wrong —
    // and on bitcoin that is where `publicAddress` lives.
    otherParams: asOptional(
      doc(
        asObject(asUnknown),
        'Plugin-specific options. Bitcoin needs `{ publicAddress }`; other ' +
          'plugins take nothing, or refuse the call entirely.'
      )
    )
  }).withRest,
  returns: asObject({ signature: doc(asString, 'Base64.') }),
  errors: ['BAD_REQUEST', ...WALLET_ERRORS],

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.body.walletId)
    // `Buffer.from(.., 'base64')` scrubs anything it cannot decode and hands
    // back short or empty bytes, so a typo produced a valid signature over the
    // wrong payload. `base64.parse` rejects instead.
    let bytes: Uint8Array
    try {
      bytes = base64.parse(ctx.body.bytes ?? '')
    } catch (error) {
      throw engineError(
        'BAD_REQUEST',
        `bytes must be valid base64: ${String(
          error instanceof Error ? error.message : error
        )}`,
        400
      )
    }
    const signature = await wallet.signBytes(bytes, {
      otherParams: ctx.body.otherParams
    })
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
    try {
      return await wallet.getPaymentProtocolInfo(
        ctx.query.valid.paymentProtocolUrl
      )
    } catch (error: unknown) {
      // core surfaces an unreachable or non-BIP70 URL as a plain Error, which
      // would otherwise be reported as an engine fault.
      throw engineError(
        'NETWORK_ERROR',
        `Could not fetch the payment request: ${
          error instanceof Error ? error.message : String(error)
        }`,
        503
      )
    }
  }
})
