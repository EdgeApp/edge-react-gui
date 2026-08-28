import { asJSON, asMaybe } from 'cleaners'
import type { EdgeAccount } from 'edge-core-js'
import { generateSecureRandom } from 'react-native-securerandom'

import { debugLog } from '../../util/logger'
import { makeUuid } from '../../util/rnUtils'
import {
  bytesToHex,
  CTX_SPEND_PRIVATE_KEY_LENGTH,
  getJwtExpiryMs,
  getPublicKeyHex,
  hexToBytes,
  isValidPrivateKey,
  signLoginNonce
} from './ctxSpendCrypto'
import {
  asCtxSpendError,
  asCtxSpendLoginNonce,
  asCtxSpendStoredIdentity,
  asCtxSpendTokens,
  type CtxSpendStoredIdentity,
  type CtxSpendTokens
} from './ctxSpendTypes'

/**
 * Anonymous secp256k1 session against the CTX spend-api.
 *
 * The keypair is the account: there is no email, password, or server-side
 * recovery. It is generated on first use and kept in the account's encrypted
 * dataStore, so the same anonymous CTX user is recovered on every launch and
 * on every device synced to the Edge account. Losing the key means losing the
 * CTX user, which is why tokens are treated as disposable and the key is not.
 */

/** Encrypted dataStore namespace. Mirrors the Phaze identity layout. */
const STORE_ID = 'ctx-spend'
const IDENTITY_KEY_PREFIX = 'identity-'

/**
 * Refresh this long before the access token's own expiry, so a request never
 * races the boundary. The live staging access token lasts ~8h.
 */
const TOKEN_EXPIRY_MARGIN_MS = 60 * 1000

const asStoredIdentityJson = asJSON(asCtxSpendStoredIdentity)

export interface CtxSpendAuthConfig {
  /** `X-Client-Id`. Registered server-side; not a value the client invents. */
  clientId: string
  baseUrl: string
}

/**
 * Why an account does or does not have a CTX identity. `light-account` is a
 * permanent property of the account, not a failure, so it is a return value.
 * Everything that could succeed on a retry throws instead.
 */
export type CtxSpendIdentityStatus = 'ready' | 'light-account'

export interface CtxSpendSession {
  /** The active identity's compressed public key, once loaded. */
  getPublicKeyHex: () => string | undefined

  /**
   * Load the stored identity, generating and persisting one on first use.
   * Light accounts have no encrypted store, so they get no CTX identity.
   * Throws when the store cannot be read or the new identity cannot be saved.
   */
  ensureIdentity: (account: EdgeAccount) => Promise<CtxSpendIdentityStatus>

  /**
   * Return a usable access token, performing whatever work that requires:
   * reusing the cached one, refreshing it, or running a full nonce/sign login.
   */
  getAccessToken: () => Promise<string>

  /** Drop cached tokens so the next call re-authenticates from the keypair. */
  invalidateTokens: () => void
}

/**
 * Build the identity's storage key. One item per identity keeps concurrent
 * writes from different devices from clobbering each other.
 */
const makeIdentityKey = (uniqueId: string): string =>
  `${IDENTITY_KEY_PREFIX}${uniqueId}`

/**
 * Draw a valid secp256k1 scalar from the platform CSPRNG.
 *
 * `generateSecureRandom` is the entropy source already trusted elsewhere in
 * the app. A random 32-byte string is astronomically unlikely to fall outside
 * the curve order, but the retry keeps that case correct rather than fatal.
 */
const generatePrivateKey = async (): Promise<Uint8Array> => {
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = await generateSecureRandom(CTX_SPEND_PRIVATE_KEY_LENGTH)
    if (isValidPrivateKey(candidate)) return candidate
  }
  throw new Error('Unable to generate a valid CTX spend private key')
}

/**
 * Decode a stored private key, treating anything unusable as absent.
 *
 * `asCtxSpendStoredIdentity` only requires a string, so the stored hex can be
 * odd-length or non-hex, which makes `hexToBytes` throw. An unusable key is a
 * record to replace, not an error to propagate, so both that and an
 * out-of-range scalar collapse to `undefined`.
 */
const parseStoredPrivateKey = (
  privateKeyHex: string
): Uint8Array | undefined => {
  let bytes: Uint8Array
  try {
    bytes = hexToBytes(privateKeyHex)
  } catch {
    return undefined
  }
  return isValidPrivateKey(bytes) ? bytes : undefined
}

export const makeCtxSpendSession = (
  config: CtxSpendAuthConfig
): CtxSpendSession => {
  const baseUrl = config.baseUrl.replace(/\/$/, '')

  let identity: CtxSpendStoredIdentity | undefined
  let privateKey: Uint8Array | undefined
  let tokens: CtxSpendTokens | undefined
  let accessTokenExpiryMs = 0
  /** In-flight authentication, so concurrent callers share one handshake. */
  let pendingAuth: Promise<string> | undefined
  /** In-flight identity load, so concurrent callers share one keypair. */
  let pendingIdentity: Promise<CtxSpendIdentityStatus> | undefined

  const postJson = async (path: string, body: unknown): Promise<unknown> => {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': config.clientId
      },
      body: JSON.stringify(body)
    })
    const text = await response.text()
    if (!response.ok) {
      const parsed = asMaybe(asJSON(asCtxSpendError))(text)
      throw new Error(
        parsed != null
          ? `CTX ${path} failed (${response.status}): ${parsed.error}`
          : `CTX ${path} failed (${response.status})`
      )
    }
    return JSON.parse(text)
  }

  /**
   * Load every identity this account has stored, newest first.
   *
   * Read failures propagate on purpose. Swallowing them would make a transient
   * dataStore error indistinguishable from "no identity yet", and the caller
   * answers that by minting a new keypair, which would orphan the existing CTX
   * user for good: CTX has no server-side recovery. A store that has never
   * been written returns an empty list rather than throwing, so first run is
   * still the empty case.
   */
  const loadIdentities = async (
    account: EdgeAccount
  ): Promise<CtxSpendStoredIdentity[]> => {
    const itemIds = await account.dataStore.listItemIds(STORE_ID)
    const stored: CtxSpendStoredIdentity[] = []
    for (const itemId of itemIds) {
      if (!itemId.startsWith(IDENTITY_KEY_PREFIX)) continue
      const text = await account.dataStore.getItem(STORE_ID, itemId)
      const parsed = asMaybe(asStoredIdentityJson)(text)
      if (parsed == null) {
        // Written by a newer or corrupted format: unusable, but readable, so
        // it is a record to skip rather than a failure to report.
        debugLog('ctxSpend', 'Skipping unreadable identity:', itemId)
        continue
      }
      stored.push(parsed)
    }
    return stored.sort((a, b) =>
      b.createdIsoDate.localeCompare(a.createdIsoDate)
    )
  }

  /**
   * Run the two-leg login: register the public key to get a nonce, then prove
   * ownership by signing it. The server signs `nonce + 1`, not the nonce it
   * returned, which is what stops a returned nonce being replayed as-is.
   */
  const login = async (): Promise<CtxSpendTokens> => {
    if (identity == null || privateKey == null) {
      throw new Error('CTX spend identity is not loaded')
    }

    const nonceResponse = asCtxSpendLoginNonce(
      await postJson('/login', {
        key: identity.publicKeyHex,
        scheme: identity.scheme
      })
    )
    const signedNonce = nonceResponse.nonce + 1

    const newTokens = asCtxSpendTokens(
      await postJson('/login', {
        nonce: signedNonce,
        sig: signLoginNonce(privateKey, signedNonce)
      })
    )
    debugLog('ctxSpend', 'Logged in with identity:', identity.uniqueId)
    return newTokens
  }

  const refresh = async (refreshToken: string): Promise<CtxSpendTokens> => {
    const newTokens = asCtxSpendTokens(
      await postJson('/refresh-token', { refreshToken })
    )
    debugLog('ctxSpend', 'Refreshed access token')
    return newTokens
  }

  const applyTokens = (newTokens: CtxSpendTokens): string => {
    tokens = newTokens
    // Treat an unreadable expiry as immediate, so the next call re-authenticates
    // rather than sending a token the server will reject.
    accessTokenExpiryMs = getJwtExpiryMs(newTokens.accessToken) ?? 0
    return newTokens.accessToken
  }

  /**
   * Refresh when possible, fall back to a full login. The refresh token
   * outlives the access token by months, but it does eventually expire, and
   * the keypair is always able to mint a fresh pair.
   */
  const authenticate = async (): Promise<string> => {
    if (tokens != null) {
      try {
        return applyTokens(await refresh(tokens.refreshToken))
      } catch (error: unknown) {
        debugLog('ctxSpend', 'Refresh failed, re-running login:', error)
      }
    }
    return applyTokens(await login())
  }

  const loadOrCreateIdentity = async (
    account: EdgeAccount
  ): Promise<CtxSpendIdentityStatus> => {
    // Light accounts have no encrypted store to persist a key into, and a
    // key that cannot be persisted is a CTX user lost on next launch.
    if (account.username == null) {
      debugLog('ctxSpend', 'Light account - CTX spend unavailable')
      return 'light-account'
    }

    // Newest first, so a usable key wins over an older or unusable one.
    for (const candidate of await loadIdentities(account)) {
      const storedKey = parseStoredPrivateKey(candidate.privateKeyHex)
      if (storedKey != null) {
        identity = candidate
        privateKey = storedKey
        debugLog('ctxSpend', 'Loaded identity:', candidate.uniqueId)
        return 'ready'
      }
      debugLog('ctxSpend', 'Unusable key, skipping:', candidate.uniqueId)
    }

    // A generate or save failure propagates: it is retryable, and reporting
    // it as "no identity" would present a broken store as a light account.
    const newPrivateKey = await generatePrivateKey()
    const newIdentity: CtxSpendStoredIdentity = {
      uniqueId: await makeUuid(),
      scheme: 'secp256k1',
      privateKeyHex: bytesToHex(newPrivateKey),
      publicKeyHex: getPublicKeyHex(newPrivateKey),
      createdIsoDate: new Date().toISOString()
    }
    await account.dataStore.setItem(
      STORE_ID,
      makeIdentityKey(newIdentity.uniqueId),
      JSON.stringify(newIdentity)
    )
    identity = newIdentity
    privateKey = newPrivateKey
    debugLog('ctxSpend', 'Created identity:', newIdentity.uniqueId)
    return 'ready'
  }

  return {
    getPublicKeyHex: () => identity?.publicKeyHex,

    async ensureIdentity(account) {
      if (identity != null) return 'ready'
      // Collapse concurrent callers onto one load, the same way
      // `getAccessToken` does. Two first-run callers racing here would each
      // generate and persist a keypair and then clobber the in-memory one,
      // which strands whichever CTX user lost the race with no recovery.
      pendingIdentity ??= loadOrCreateIdentity(account).finally(() => {
        pendingIdentity = undefined
      })
      return await pendingIdentity
    },

    async getAccessToken() {
      if (
        tokens != null &&
        Date.now() < accessTokenExpiryMs - TOKEN_EXPIRY_MARGIN_MS
      ) {
        return tokens.accessToken
      }
      // Collapse concurrent callers onto a single handshake. Two parallel
      // logins would each consume a nonce and the loser's tokens would be
      // written over the winner's.
      pendingAuth ??= authenticate().finally(() => {
        pendingAuth = undefined
      })
      return await pendingAuth
    },

    invalidateTokens() {
      tokens = undefined
      accessTokenExpiryMs = 0
    }
  }
}
