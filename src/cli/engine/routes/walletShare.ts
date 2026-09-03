/**
 * Account-to-account wallet sharing over the login lobby.
 *
 * One account publishes a link, the other scans it, and the sharer's keys
 * travel through the lobby encrypted to the recipient. Each wallet carries its
 * own mode, so a single share can hand over one wallet watch-only and another
 * with full spend authority.
 */
import { asArray, asNumber, asObject, asOptional, asString } from 'cleaners'
import type { EdgeAccount, EdgeWalletShareSpec } from 'edge-core-js'

import { doc } from '../doc'
import { engineError } from '../errors'
import { route } from '../route'
import { asOk, asPendingWalletShare, asWalletShareSpec } from '../schemas'
import { getAccount } from './helpers'

const LOBBY_ID_DOC =
  'From the QR code, or the last path segment of a ' +
  '`https://deep.edge.app/request-wallets/<lobbyId>` link.'

const TIMEOUT_DOC =
  'How long the lobby stays open, in seconds. Defaults to the core lobby ' +
  'default of 10 minutes.'

const WALLETS_DOC =
  'The wallets to share, each with its own mode, as JSON: ' +
  '`[{"walletId":"…","mode":"spend"}]`.'

const DISPLAY_NAME_DOC =
  'A human-readable identity for this account, shown to the other party so ' +
  'they know who they are dealing with. Arbitrary - it need not be a real ' +
  'name. It rides in the `name` parameter of the link this call publishes, ' +
  'so it reaches the person scanning the QR and never the login server.\n\n' +
  'Supply it on every call. It is never filled in from `local-settings`, ' +
  'whose `nickname` is a stored value this command does not read.'

const SENT_NAME_DOC =
  'A human-readable identity for this account, sent to the other party ' +
  'encrypted alongside the wallets.'

const COUNTERPARTY_NAME_DOC =
  "The other party's name, as read from the `name` parameter of the link " +
  "being answered. Recorded in each wallet's sharing history. A name that " +
  'arrives over the wire wins.'

/** Match the core lobby default (10 minutes). */
const DEFAULT_SHARE_TTL_MS = 10 * 60 * 1000

type PendingWalletShare = Awaited<ReturnType<EdgeAccount['requestWalletShare']>>

interface ShareRecord {
  shareId: string
  sessionId: string
  pending: PendingWalletShare
  createdAt: number
  cancelled?: boolean
  unwatchState?: () => void
}

const shareById = new Map<string, ShareRecord>()

/** Whatever the share threw, reduced to something a JSON client can read. */
function errorText(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return JSON.stringify(error) ?? 'Unknown error'
}

function shareSummary(
  record: ShareRecord,
  expiresAt?: string
): Record<string, unknown> {
  const { pending } = record
  const { error } = pending
  return {
    objectId: record.shareId,
    shareId: record.shareId,
    kind: 'pendingWalletShare',
    expiresAt: expiresAt ?? null,
    lobbyId: pending.id,
    uri: pending.uri,
    state: pending.state,
    counterpartyName: pending.counterpartyName ?? null,
    sharedWallets: pending.sharedWallets ?? null,
    receivedWalletIds: pending.receivedWalletIds ?? null,
    error: error == null ? null : errorText(error)
  }
}

function getShare(shareId: string, sessionId: string): ShareRecord {
  const record = shareById.get(shareId)
  if (record == null) {
    throw engineError(
      'PENDING_SHARE_NOT_FOUND',
      `No pending wallet share: ${shareId}`,
      404
    )
  }
  if (record.sessionId !== sessionId) {
    throw engineError(
      'OBJECT_SESSION_MISMATCH',
      'Pending wallet share belongs to a different session',
      403
    )
  }
  return record
}

/**
 * Holds a pending share so later calls can find it by handle, and cancels the
 * lobby if nobody claims it before the handle expires.
 */
function trackPending(
  ctx: { params: Record<string, string>; state: any },
  pending: PendingWalletShare,
  ttlMs: number = DEFAULT_SHARE_TTL_MS
): { record: ShareRecord; expiresAt: string } {
  const record: ShareRecord = {
    shareId: '',
    sessionId: ctx.params.sessionId,
    pending,
    createdAt: Date.now()
  }
  const handle = ctx.state.objects.create({
    kind: 'pendingWalletShare',
    prefix: 'share_',
    value: record,
    sessionId: ctx.params.sessionId,
    ttlMs,
    onExpire: async (value: ShareRecord) => {
      value.cancelled = true
      try {
        value.unwatchState?.()
      } catch {
        // best effort
      }
      shareById.delete(value.shareId)
      try {
        await value.pending.cancelRequest()
      } catch {
        // best effort
      }
    }
  })
  record.shareId = handle.objectId
  shareById.set(handle.objectId, record)
  record.unwatchState = pending.watch('state', () => {
    // State is read on poll; nothing to cache here.
  })
  return { record, expiresAt: handle.expiresAt }
}

function ttlFor(timeout: number | undefined): number {
  return timeout == null
    ? DEFAULT_SHARE_TTL_MS
    : Math.max(timeout * 1000, DEFAULT_SHARE_TTL_MS)
}

/**
 * Ask another account for wallets.
 *
 * Publishes a lobby and returns the link to show as a QR code. The other
 * device scans it and picks which of its wallets to send, so this side chooses
 * nothing — poll the handle until `state` is `done` to see what arrived.
 */
export const requestWalletShare = route({
  core: 'account.requestWalletShare',
  method: 'POST',
  path: '/account/{sessionId}/request-wallet-share',
  cli: { command: 'request-wallet-share' },
  body: asObject({
    displayName: asOptional(doc(asString, DISPLAY_NAME_DOC)),
    timeout: asOptional(doc(asNumber, TIMEOUT_DOC))
  }).withRest,
  returns: asPendingWalletShare,
  errors: ['NETWORK_ERROR'],

  async handler(ctx) {
    const { displayName, timeout } = ctx.body
    const pending = await getAccount(ctx).requestWalletShare({
      displayName,
      timeout
    })
    const { record, expiresAt } = trackPending(ctx, pending, ttlFor(timeout))
    return shareSummary(record, expiresAt)
  }
})

/**
 * Offer wallets to another account.
 *
 * The mirror of `request-wallet-share`: this side picks the wallets and their
 * modes up front, then publishes a link for the recipient to scan. The keys
 * only move once they accept.
 *
 * @note View-only is refused for currencies that need a private key to sync
 *   (Monero, Zcash, Zano, Pirate Chain, FIO). Share those with `spend` or not
 *   at all.
 */
export const offerWalletShare = route({
  core: 'account.offerWalletShare',
  method: 'POST',
  path: '/account/{sessionId}/offer-wallet-share',
  cli: { command: 'offer-wallet-share' },
  body: asObject({
    wallets: doc(asArray(asWalletShareSpec), WALLETS_DOC),
    displayName: asOptional(doc(asString, DISPLAY_NAME_DOC)),
    timeout: asOptional(doc(asNumber, TIMEOUT_DOC))
  }).withRest,
  returns: asPendingWalletShare,
  errors: ['BAD_REQUEST', 'NETWORK_ERROR'],

  async handler(ctx) {
    const { wallets, displayName, timeout } = ctx.body
    if (wallets.length === 0) {
      throw engineError('BAD_REQUEST', 'Must share at least one wallet', 400)
    }
    const pending = await getAccount(ctx).offerWalletShare(
      wallets as EdgeWalletShareSpec[],
      { displayName, timeout }
    )
    const { record, expiresAt } = trackPending(ctx, pending, ttlFor(timeout))
    return shareSummary(record, expiresAt)
  }
})

/**
 * Send wallets to an account that asked for them.
 *
 * Answers a `request-wallets` lobby. This is where the sharer decides both
 * which wallets go and what the recipient may do with each one, so it is the
 * point where spend authority is granted. It cannot be taken back.
 *
 * @note View-only is refused for currencies that need a private key to sync
 *   (Monero, Zcash, Zano, Pirate Chain, FIO).
 */
export const approveWalletShare = route({
  core: 'account.approveWalletShare',
  method: 'POST',
  path: '/account/{sessionId}/approve-wallet-share',
  cli: { command: 'approve-wallet-share', positional: 'lobbyId' },
  body: asObject({
    lobbyId: doc(asString, LOBBY_ID_DOC),
    wallets: doc(asArray(asWalletShareSpec), WALLETS_DOC),
    displayName: asOptional(doc(asString, SENT_NAME_DOC)),
    counterpartyName: asOptional(doc(asString, COUNTERPARTY_NAME_DOC))
  }).withRest,
  returns: asOk,
  errors: ['BAD_REQUEST', 'NETWORK_ERROR'],

  async handler(ctx) {
    const { lobbyId, wallets, displayName, counterpartyName } = ctx.body
    if (wallets.length === 0) {
      throw engineError('BAD_REQUEST', 'Must share at least one wallet', 400)
    }
    await getAccount(ctx).approveWalletShare(
      lobbyId,
      wallets as EdgeWalletShareSpec[],
      { displayName, counterpartyName }
    )
    return { ok: true }
  }
})

/**
 * Take wallets from an account that offered them.
 *
 * Answers a `share-wallets` lobby. The offering side already chose the wallets
 * and their modes, so there is nothing to pick here — poll the handle until
 * `state` is `done`.
 */
export const acceptWalletShare = route({
  core: 'account.acceptWalletShare',
  method: 'POST',
  path: '/account/{sessionId}/accept-wallet-share',
  cli: { command: 'accept-wallet-share', positional: 'lobbyId' },
  body: asObject({
    lobbyId: doc(
      asString,
      'From the QR code, or the last path segment of a ' +
        '`https://deep.edge.app/share-wallets/<lobbyId>` link.'
    ),
    displayName: asOptional(doc(asString, SENT_NAME_DOC)),
    counterpartyName: asOptional(doc(asString, COUNTERPARTY_NAME_DOC)),
    timeout: asOptional(doc(asNumber, TIMEOUT_DOC))
  }).withRest,
  returns: asPendingWalletShare,
  errors: ['BAD_REQUEST', 'NETWORK_ERROR'],

  async handler(ctx) {
    const { lobbyId, displayName, counterpartyName, timeout } = ctx.body
    const pending = await getAccount(ctx).acceptWalletShare(lobbyId, {
      displayName,
      counterpartyName,
      timeout
    })
    const { record, expiresAt } = trackPending(ctx, pending, ttlFor(timeout))
    return shareSummary(record, expiresAt)
  }
})

/**
 * Check how far a wallet share has got.
 *
 * @coreNote Engine state for an in-flight share; core exposes it as an
 *   `EdgePendingWalletShare` object rather than a call.
 */
export const pollWalletShare = route({
  core: null,
  method: 'GET',
  path: '/account/{sessionId}/pending-wallet-share',
  cli: { command: 'poll-wallet-share', positional: 'shareId' },
  returns: asPendingWalletShare,
  errors: [
    'PENDING_SHARE_NOT_FOUND',
    'OBJECT_SESSION_MISMATCH',
    'OBJECT_EXPIRED'
  ],

  handler(ctx) {
    const { shareId, sessionId } = ctx.params
    let expiresAt: string | undefined
    try {
      const handle = ctx.state.objects.get<ShareRecord>(
        shareId,
        'pendingWalletShare'
      )
      if (handle.sessionId != null && handle.sessionId !== sessionId) {
        throw engineError(
          'OBJECT_SESSION_MISMATCH',
          'Pending wallet share belongs to a different session',
          403
        )
      }
      expiresAt = ctx.state.objects.toInfo(handle).expiresAt
    } catch (error: unknown) {
      const code =
        error instanceof Error && 'code' in error
          ? (error as { code: string }).code
          : ''
      if (code === 'OBJECT_EXPIRED') {
        shareById.delete(shareId)
        throw error
      }
      if (code === 'OBJECT_SESSION_MISMATCH') throw error
      // Otherwise fall through; getShare reports PENDING_SHARE_NOT_FOUND.
    }
    return shareSummary(getShare(shareId, sessionId), expiresAt)
  }
})

/**
 * Close a wallet share before it completes.
 *
 * Shuts the lobby so a link that was shown by mistake stops working. Keys
 * already delivered are not recalled — nothing can do that.
 */
export const cancelWalletShare = route({
  core: 'EdgePendingWalletShare.cancelRequest',
  coreExtra: {
    shareId:
      'Core calls cancelRequest() on the pending object. Over HTTP there is ' +
      'no object to hold, so the handle names which share to close.'
  },
  method: 'POST',
  path: '/account/{sessionId}/cancel-wallet-share',
  cli: { command: 'cancel-wallet-share', positional: 'shareId' },
  returns: asOk,
  errors: ['PENDING_SHARE_NOT_FOUND', 'OBJECT_SESSION_MISMATCH'],

  async handler(ctx) {
    const record = getShare(ctx.params.shareId, ctx.params.sessionId)
    record.cancelled = true
    try {
      record.unwatchState?.()
    } catch {
      // best effort
    }
    shareById.delete(record.shareId)
    try {
      await ctx.state.objects.delete(record.shareId)
    } catch {
      // best effort
    }
    try {
      await record.pending.cancelRequest()
    } catch {
      // best effort
    }
    return { ok: true }
  }
})
