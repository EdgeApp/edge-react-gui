/**
 * Sync-repo identity and the sync server's WebSocket endpoints, as the
 * sync-server subscription protocol names them.
 */
import crypto from 'crypto'

import { base58 } from './encoding'

/** Where the sync server accepts WebSocket upgrades. */
export const SYNC_WEBSOCKET_PATH = '/api/v2/ws'

/** `walletId` of the account's own repo, which is no wallet. */
export const ACCOUNT_REPO = 'account'

/**
 * The repo ID the sync server files a repo under:
 * `base58(sha256(sha256(syncKey)))`. It names the repo without granting
 * access to it, so it is what subscriptions carry instead of the sync key.
 */
export function syncKeyToRepoId(syncKey: Uint8Array): string {
  const once = crypto.createHash('sha256').update(syncKey).digest()
  const twice = crypto.createHash('sha256').update(once).digest()
  return base58.stringify(twice)
}

/**
 * The repo ID for a wallet's raw keys, or null when the keys carry no
 * `syncKey` (a wallet type with no storage repo).
 */
export function repoIdFromKeys(keys: unknown): string | null {
  if (keys == null || typeof keys !== 'object') return null
  const { syncKey } = keys as { syncKey?: unknown }
  if (typeof syncKey !== 'string' || syncKey === '') return null
  return syncKeyToRepoId(Buffer.from(syncKey, 'base64'))
}

/**
 * Turns a sync server address into its WebSocket endpoint: `http` becomes
 * `ws`, `https` becomes `wss`, and a bare host gains the `/api/v2/ws` path.
 * Matches edge-core-js, so the CLI watches the socket core would open.
 */
export function toSyncWebSocketUrl(server: string): string {
  const url = server.replace(/^http(s?):/i, 'ws$1:')
  const match = /^(wss?:\/\/[^/?#]+)\/?$/i.exec(url)
  return match == null ? url : match[1] + SYNC_WEBSOCKET_PATH
}

/**
 * The WebSocket endpoints for a server set: `syncWebSocketServer` when
 * configured, otherwise the `syncServer` hosts scheme-swapped, leaving out
 * `sync-eu` as core does. Empty when the engine names no socket-capable sync
 * server: core's built-in production fleet, or the fake world.
 */
export function syncWebSocketUrls(servers: {
  syncServer?: string | string[]
  syncWebSocketServer?: string[]
}): string[] {
  const sync = servers.syncServer
  const urls = (
    servers.syncWebSocketServer ??
    (typeof sync === 'string' ? [sync] : sync ?? [])
  )
    .map(toSyncWebSocketUrl)
    // The fake world's `fake://sync` has no socket to offer.
    .filter(url => /^wss?:\/\//i.test(url))
  if (servers.syncWebSocketServer != null) return urls
  const primary = urls.filter(url => !/^wss?:\/\/sync-eu\b/i.test(url))
  return primary.length > 0 ? primary : urls
}
