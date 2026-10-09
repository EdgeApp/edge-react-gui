import { asBoolean, asObject, asOptional, asString, asUnknown } from 'cleaners'
import type {
  EdgeCurrencyWallet,
  EdgeMemo,
  EdgeMetadata,
  EdgeSpendInfo,
  EdgeSpendTarget,
  EdgeTokenId,
  EdgeTransaction
} from 'edge-core-js'
import { base64 } from 'rfc4648'

import { createEdgeMemo, getMemoError } from '../../../util/memoUtils'
import { saveTxAndMetadata } from '../../../util/txTagging'
import { doc } from '../doc'
import { HANDLE_ERRORS, WALLET_ERRORS } from '../errorGroups'
import {
  EngineError,
  engineError,
  errorMessage,
  isNetworkFailure,
  mapCoreError
} from '../errors'
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
  asWalletId,
  SPEND_SHORTHAND_CORE_EXTRA,
  withoutUndefined
} from '../schemas'
import { getAccount, requireOwnedHandle } from './helpers'

/**
 * A caller's metadata over whatever the URI carried.
 *
 * `withoutUndefined` on both sides, because `asEdgeMetadata` materialises
 * all five keys: spreading the cleaned value directly meant any
 * `--metadata` blanked every field it did not itself set. Measured —
 * `{ notes: 'x' }` over a transaction with a payee, a category and a bizId
 * left `notes` and `undefined` for the other three, and `JSON.stringify`
 * printed the cleaned value as `{"notes":"x"}` either way.
 */
function mergeMetadata(
  base: EdgeMetadata | undefined,
  overlay: EdgeMetadata | undefined
): EdgeMetadata | undefined {
  if (base == null && overlay == null) return undefined
  const merged = {
    ...(base == null ? {} : withoutUndefined(base)),
    ...(overlay == null ? {} : withoutUndefined(overlay))
  }
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
 * Every spend needs somewhere for the money to go.
 *
 * Core's `makeSpend` hands an empty `spendTargets` to the plugin, which
 * throws a plain `Error` — `500 INTERNAL_ERROR`, outside the declared errors
 * of every route that calls it — so a one-flag mistake on a documented
 * command answered a fault rather than saying what was missing.
 *
 * `get-max-spendable` and `spend` each had this guard written out; the third
 * caller, `make-spend`, did not, which is what a third copy is for.
 */
function assertDestination(spendInfo: EdgeSpendInfo, extra: string = ''): void {
  if (spendInfo.spendTargets.length > 0) return
  throw engineError(
    'BAD_REQUEST',
    `A destination is required: pass \`to\`, or \`spendTargets\`.${extra}`,
    400
  )
}

/**
 * Every target says how much, on the routes that need it.
 *
 * `requireAmount` mirrors the `to` path exactly: the broadcasting routes and
 * `make-spend` demand an amount, and the two that cannot have one —
 * `get-max-spendable` and `spend --use-max` — leave it to core. The index is
 * in the message because a caller sending several targets otherwise has no
 * way to tell which one it got wrong.
 *
 * Where the money goes is not here: `publicAddress` is required by
 * `asSpendTarget` itself, so every route taking a target gets it — including
 * `sweep-private-keys`, which never reaches this helper.
 */
function assertSpendAmounts(
  targets: EdgeSpendTarget[] | undefined,
  requireAmount: boolean
): void {
  if (!requireAmount || targets == null) return
  targets.forEach((target, index) => {
    if (target.nativeAmount == null || target.nativeAmount === '') {
      throw engineError(
        'BAD_REQUEST',
        `Missing required field "spendTargets[${index}].nativeAmount"`,
        400
      )
    }
  })
}

/**
 * The currency code of the asset a request spends.
 *
 * `parseUri`'s second argument, so a URI amount is scaled by the
 * denomination of the asset actually being sent. Safe to index because
 * `assertTokenId` has already run.
 */
function currencyCodeFor(
  wallet: EdgeCurrencyWallet,
  tokenId: EdgeTokenId
): string {
  if (tokenId == null) return wallet.currencyInfo.currencyCode
  return wallet.currencyConfig.allTokens[tokenId].currencyCode
}

/**
 * A URI's `uniqueIdentifier` as a memo of the kind the chain expects.
 *
 * `createEdgeMemo` reads the type off the wallet's first non-hidden
 * `memoOptions` entry, which is how the GUI does it. The fallbacks cover a
 * plugin that still only declares the deprecated `memoType`, and one that
 * declares no memo support at all — where `text` is the historical
 * behaviour and the plugin is what refuses it.
 *
 * Exported for its test: the URI spend path needs a funded wallet, so the
 * offline suites cannot reach it, and getting the memo *kind* wrong is
 * irreversible once broadcast.
 */
export function memoFromUri(
  wallet: EdgeCurrencyWallet,
  value: string
): EdgeMemo {
  const { memoOptions, memoType } = wallet.currencyInfo
  const usable = (memoOptions ?? []).filter(option => option.hidden !== true)
  if (usable.length > 0) {
    const memo = createEdgeMemo(usable, value)
    // The option's own limits — a destination tag above 2^32, a memo longer
    // than the chain allows — reported as the 400 this route publishes
    // rather than as whatever the plugin throws deeper in.
    const problem = getMemoError(memo, usable[0])
    if (problem != null) {
      throw engineError(
        'BAD_REQUEST',
        `Destination's ${usable[0].memoName ?? 'memo'} is not usable: ` +
          problem,
        400
      )
    }
    return memo
  }
  if (memoType === 'number' || memoType === 'hex' || memoType === 'text') {
    return { type: memoType, value }
  }
  return { type: 'text', value }
}

/**
 * Exported for its tests.
 *
 * Everything this function decides is irreversible once broadcast — which
 * asset, how much, and what memo — and the path that reaches it needs a
 * funded wallet, so the offline suites cannot drive it.
 */
export async function buildSpendInfo(
  wallet: EdgeCurrencyWallet,
  body: SpendInput,
  opts: { requireAmount: boolean }
): Promise<EdgeSpendInfo> {
  const bodyMetadata = body.metadata

  if (body.spendInfo != null) {
    // Refused rather than ranked. `spendInfo` was used as-is and the
    // shorthand siblings were never read, so on the three irreversible
    // routes that share this body a caller could name an asset or a
    // destination and have it silently dropped:
    // `spend --token-id=<usdc> --spend-info='{"spendTargets":[…]}'` signed
    // and broadcast native ETH, because `asSpendInfo.tokenId` defaults to
    // null and null means the chain's own coin; `--to=<address>` beside a
    // spendInfo sent to the spendInfo's address. The six fields are
    // published as peer optionals and only the `spendInfo` prose hints at
    // precedence. This file's stance for a contradictory pair is already a
    // refusal up front — see `save` with `broadcast: false` — because a
    // usage error must not depend on the wallet having enough funds to get
    // as far as signing.
    const shorthand = (
      [
        ['tokenId', body.tokenId],
        ['to', body.to],
        ['nativeAmount', body.nativeAmount],
        ['amount', body.amount]
      ] as Array<[string, unknown]>
    )
      .filter(([, value]) => value != null)
      .map(([name]) => name)
    if (shorthand.length > 0) {
      throw engineError(
        'BAD_REQUEST',
        `spendInfo cannot be combined with ${shorthand.join(', ')}: ` +
          'a spendInfo already names the asset, the destinations and the ' +
          'amounts, so the other field would be silently ignored.',
        400
      )
    }
    const spendInfo = { ...body.spendInfo } as unknown as EdgeSpendInfo
    // Above the return, not below it. Core does
    // `tokenId == null ? currencyInfo : allTokens[tokenId]` and destructures
    // the result, so an unknown tokenId inside a caller-supplied `spendInfo`
    // was a `TypeError` — `500 INTERNAL_ERROR` with no field name, on routes
    // that declare `TOKEN_NOT_FOUND`.
    assertTokenId(wallet, spendInfo.tokenId ?? null)
    // Only the amount: `asSpendTarget` requires `publicAddress`, which is
    // where that rule belongs, because core drops an address-less target and
    // signs the rest of the transaction anyway, and this helper is not on
    // `sweep-private-keys`' path.
    assertSpendAmounts(spendInfo.spendTargets, opts.requireAmount)
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

  // Hoisted above the parse, because the token's own currency code is what
  // `parseUri` has to be told to scale `?amount=` by, and reading it from an
  // unknown tokenId is the `TypeError` `assertTokenId` exists to turn into a
  // 404.
  assertTokenId(wallet, tokenId)
  const currencyCode = currencyCodeFor(wallet, tokenId)

  if (to != null) {
    let parsed
    try {
      // With the currency code, not without. `parseUriCommon` does
      // `if (currencyCode == null) currencyCode = currencyInfo.currencyCode`
      // and then scales by *that* denomination, so omitting it made the
      // amount and the asset come from different places.
      parsed = await wallet.parseUri(to, currencyCode)
    } catch (error: unknown) {
      const message = errorMessage(error)
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
    // The URI's own asset has to agree with the one being spent. `parseUri`
    // scales `?amount=` by whatever denomination it resolved, so taking the
    // amount while ignoring `parsed.currencyCode` mixed two assets: an XRP
    // URI's `?amount=5` became `5000000`, and spent against a token with
    // eighteen decimals that is 0.000000000005 of it — signed and broadcast,
    // twelve orders of magnitude under what the caller asked for, because
    // core and the plugin both trust `nativeAmount` as already-scaled base
    // units. The other direction asks for too much and fails safe on
    // `InsufficientFundsError`, which is why only one half was silent.
    if (parsed.nativeAmount != null && parsed.currencyCode != null) {
      if (parsed.currencyCode !== currencyCode) {
        throw engineError(
          'BAD_REQUEST',
          `Destination names ${parsed.currencyCode} but the request spends ` +
            `${currencyCode}. Drop the amount from the URI, or ask for the ` +
            'asset it names.',
          400
        )
      }
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
      // The chain's own memo type, not `text`. XRP's first non-hidden option
      // is `{ type: 'number', memoName: 'destination tag' }` and `text` is
      // its *second* — a real, different memo kind on that chain — so
      // hard-coding `text` passed `validateMemos`, took `RippleEngine`'s
      // text branch and landed the destination tag in `payment.Memos` with
      // `payment.DestinationTag` unset. The payment broadcasts and succeeds,
      // and an exchange deposit credited on that field is unrecoverable.
      // Zano is the same shape the other way round, with `hex` first.
      //
      // `createEdgeMemo` is the GUI's own derivation, which is the branch's
      // premise: one answer for scene and script.
      memos = [memoFromUri(wallet, parsed.uniqueIdentifier)]
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

/**
 * The handle's new value, and the response that reports it.
 *
 * Called *inside* `hold`, so `consuming` is still set while `update` runs. It
 * used to run after `hold` returned, and `hold`'s `finally` clears
 * `consuming` before that — so a bulk release already inside `deleteMany`'s
 * busy-wait could remove the record in the window between, and `update` then
 * threw `OBJECT_NOT_FOUND`. On `broadcast-tx` that is a 404 with no txid for
 * money that has already left the wallet, which is the failure `hold` exists
 * to prevent.
 */
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
  coreExtra: SPEND_SHORTHAND_CORE_EXTRA,
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
    assertDestination(
      spendInfo,
      ' Fees depend on it, so core cannot compute a maximum without one.'
    )
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

    // Before the maximum is consulted: `spend` used to look at it only when
    // a target already existed and otherwise fell through to
    // `makeSpend({ spendTargets: [] })`.
    assertDestination(spendInfo)
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
        // the failure alongside the transaction instead. This block only
        // runs when `broadcast` is true — `save` follows it, and the pair
        // `broadcast: false, save: true` is refused above — so there is no
        // unsent case left to rethrow for.
        saveError = errorMessage(error)
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
  coreExtra: SPEND_SHORTHAND_CORE_EXTRA,
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
    // `asSpendShorthandBody` makes both `to` and `spendInfo` optional, so
    // `make-spend --wallet-id=<id>` is a complete body as far as the
    // declaration is concerned.
    assertDestination(spendInfo)
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
    return await ctx.state.objects.hold(record, async () => {
      const transaction = await wallet.signTx(unsigned)
      return txHandleResponse(ctx, objectId, transaction)
    })
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
    return await ctx.state.objects.hold(record, async () => {
      const transaction = await wallet.broadcastTx(signed)
      return txHandleResponse(ctx, objectId, transaction)
    })
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
  returns: doc(
    asOkObject,
    '`{ ok: true, objectId }`, plus `saveError` when the transaction was recorded but re-applying its metadata failed.'
  ),
  errors: ['BAD_REQUEST', ...HANDLE_ERRORS],

  async handler(ctx) {
    const { objectId, wallet, record } = stagedTx(ctx, ctx.body.objectId)
    // Under `consume`, like every other handle-advancing route. This was the
    // one that set neither `consuming` nor `hold`, so three guards were
    // blind to an in-flight save: `get`'s `OBJECT_IN_USE`, the sweeper's
    // skip, and the bounded wait a bulk release does. A slow `save-tx`
    // overlapping a `broadcast-tx` for the same handle — what a client
    // timeout and a retry of the other step produce — passed `stagedTx`
    // because `consuming` was false, and the bare `delete` below removed the
    // record under the in-flight broadcast, so that call answered
    // `OBJECT_NOT_FOUND` *after the funds had left*, with no txid in the
    // response. `consume` also does the delete in its own `finally`, which
    // is what this handler was doing by hand.
    let saveError: string | undefined
    await ctx.state.objects.consume(record, async transaction => {
      // `onMetadataError`, which is what that option exists for: "so a
      // tagging failure cannot look like a failed send after broadcast". The
      // transaction is recorded by the time the metadata write runs, and
      // `consume` has already released the handle — so letting the tagging
      // failure out answered `500 INTERNAL_ERROR`, outside this route's
      // declared errors, for a send that had succeeded, and the retry a
      // script would make answered `OBJECT_NOT_FOUND`. Reported beside the
      // result instead, exactly as `spend`'s own save arm does.
      // The whole call, not just its metadata half. `onMetadataError`
      // diverted the tagging failure and left `wallet.saveTx` itself to
      // propagate — out of `consume`, whose `finally` has already deleted
      // the record. `save-tx` is the last step of the staged flow, so by
      // then the money has left: a disklet or encryption failure answered
      // `500 INTERNAL_ERROR`, outside this route's declared errors, and
      // the retry a script makes answered `OBJECT_NOT_FOUND` — no API
      // path left to record the transaction. That is the state the
      // comment above says was fixed, one call deeper. `spend`'s own save
      // arm takes this stance: once broadcast, the spend is real.
      try {
        await saveTxAndMetadata(wallet, transaction, {
          onMetadataError: error => {
            saveError = errorMessage(error)
            ctx.state.logger.warn('saveTxMetadata failed after saveTx', {
              walletId: wallet.id,
              txid: transaction.txid,
              error: saveError
            })
          }
        })
      } catch (error: unknown) {
        saveError = errorMessage(error)
        ctx.state.logger.warn('saveTx failed after broadcast', {
          walletId: wallet.id,
          txid: transaction.txid,
          error: saveError
        })
      }
    })
    return saveError == null
      ? { ok: true, objectId }
      : { ok: true, objectId, saveError }
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
      // `hold`, like `sign-tx` and `broadcast-tx`, with the response built
      // inside it. The expiry is checked on the way *out*, through `update`,
      // so an unguarded plugin call that crossed the five-minute boundary had
      // its handle collected by the 15-second sweeper and the accelerated
      // transaction was then thrown away with a 404 the caller cannot tell
      // from "wrong id".
      const staged = requireTxHandle(ctx, ctx.body, wallet.id)
      return await ctx.state.objects.hold(staged.record, async () => {
        const bumped = await wallet.accelerate(staged.transaction)
        if (bumped == null) {
          throw engineError(
            'BAD_REQUEST',
            'Wallet could not accelerate this transaction',
            400
          )
        }
        return txHandleResponse(ctx, objectId, bumped)
      })
    }
    if (ctx.body.transaction != null) {
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
    //
    // The two defaults are here rather than in `asSweepSpendInfo`, because a
    // nested `asOptional` with a fallback is published as *required* — see
    // that cleaner. `null` is the chain's own coin and an empty
    // `spendTargets` is what a sweep normally has, which is why this shape
    // exists apart from `asSpendInfo`.
    const spendInfo = {
      ...ctx.body.spendInfo,
      tokenId: ctx.body.spendInfo.tokenId ?? null,
      spendTargets: ctx.body.spendInfo.spendTargets ?? []
    }
    assertTokenId(wallet, spendInfo.tokenId)
    const transaction = await wallet.sweepPrivateKeys(
      spendInfo as unknown as EdgeSpendInfo
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
        `bytes must be valid base64: ${errorMessage(error)}`,
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
      // Already classified, by a guard or by `errors.ts`: rethrow, so core's
      // own `NetworkError` still answers NETWORK_ERROR and a wallet error
      // still answers as itself.
      if (error instanceof EngineError) throw error
      if (mapCoreError(error) != null) throw error
      const message = errorMessage(error)
      // Only a failure that never got an answer is the retryable class. This
      // arm used to rewrite *every* failure as `NETWORK_ERROR` with status
      // 503, which `EXIT_CODE_BY_ERROR` maps to exit 6 and the published
      // table presents as retryable — so a merchant answering 404, a payment
      // request whose payload will not parse, and a plugin with no
      // `getPaymentProtocolInfo` all told a script to try again for ever,
      // and the `BAD_REQUEST` this route declares was unreachable from its
      // own handler.
      if (isNetworkFailure(error)) {
        throw engineError(
          'NETWORK_ERROR',
          `Could not reach the payment request: ${message}`,
          503
        )
      }
      // Named, because the likeliest thing to land here is not the URL at
      // all: core answers `'getPaymentProtocolInfo' is not implemented on
      // wallets of this type` for every chain whose engine does not have it,
      // and blaming `paymentProtocolUrl` sent the caller to check a field
      // they got right. Not retryable either way, so the class stays.
      if (message.includes('not implemented on wallets of this type')) {
        throw engineError(
          'BAD_REQUEST',
          `${wallet.currencyInfo.pluginId} wallets do not support payment ` +
            `requests: ${message}`,
          400
        )
      }
      throw engineError(
        'BAD_REQUEST',
        `Could not read the payment request: ${message}`,
        400
      )
    }
  }
})
