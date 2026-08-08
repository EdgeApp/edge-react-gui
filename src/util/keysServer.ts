import { asNumber, asObject, asOptional, asString } from 'cleaners'
import type { EdgeFetchFunction } from 'edge-core-js'

import { isPlainObject } from '../envFiles'
import { signHmacAuthorization } from './hmacAuth'
import { fetchInfo } from './network'

/** Plugin maps inside the payload, which must stay objects to merge safely. */
const PLUGIN_MAP_FIELDS = ['pluginApiKeys', 'rampPlugins']

/**
 * Structural check on the served payload.
 *
 * Deliberately not `asKeysJson`: that cleaner defaults every absent field, and
 * the remote payload is a partial overlay, so defaulting would let a sparse
 * response blank out baked-in values during the merge. What matters here is
 * that the shape is mergeable - a top-level object whose plugin maps are also
 * objects - so a malformed response fails the fetch instead of being deep-
 * merged into ENV and written to the on-disk cache.
 */
const asRemoteKeys = (raw: unknown): Record<string, unknown> => {
  if (!isPlainObject(raw)) {
    throw new TypeError('getKeys payload is not an object')
  }
  for (const field of PLUGIN_MAP_FIELDS) {
    const value = raw[field]
    if (value !== undefined && !isPlainObject(value)) {
      throw new TypeError(`getKeys payload field ${field} is not an object`)
    }
  }
  return raw
}

const asGetKeysResponse = asObject({
  keys: asRemoteKeys,
  ttlSeconds: asNumber,
  // Added by the info server so the client can record which layer it was
  // actually served, rather than inferring it from whether it sent a token.
  assuranceLevel: asOptional(asString)
})

export interface RemoteKeysResult {
  keys: Record<string, unknown>
  ttlSeconds: number
  assuranceLevel?: string
}

/**
 * Ceiling on the network portion of a getKeys fetch. Passed explicitly because
 * `fetchInfo` otherwise applies its 5s-per-server waterfall default, which can
 * outlast the caller's own cold-start budget across multiple info servers.
 */
const FETCH_TIMEOUT_MS = 5000

/** Mirrors the info server's `DEFAULT_TTL_SECONDS`. */
const DEFAULT_TTL_SECONDS = 3600

export async function fetchRemoteKeys(opts: {
  apiKey: string
  secret: Uint8Array
  appId: string
  infoFetch?: EdgeFetchFunction
  attestationToken?: string
  timeoutMs?: number
}): Promise<RemoteKeysResult> {
  const { apiKey, secret, appId, infoFetch, attestationToken } = opts
  const encodedAppId = encodeURIComponent(appId)
  const fetchPath = `v1/getKeys?appId=${encodedAppId}`
  // The server signs `req.originalUrl`, which includes the `/v1` mount point
  // that `fetchInfo` supplies as part of the server prefix.
  const signPath = `/${fetchPath}`
  const method = 'GET'
  const body = ''
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const authorization = signHmacAuthorization(
    method,
    signPath,
    body,
    timestamp,
    apiKey,
    secret
  )

  const headers: Record<string, string> = {
    Authorization: authorization,
    'X-Timestamp': timestamp
  }
  if (attestationToken != null && attestationToken !== '') {
    headers['x-attestation-token'] = attestationToken
  }

  const response = await fetchInfo(
    fetchPath,
    { method, headers },
    opts.timeoutMs ?? FETCH_TIMEOUT_MS,
    infoFetch
  )
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`fetchRemoteKeys ${response.status}: ${text}`)
  }

  const json = await response.json()
  const { keys, ttlSeconds, assuranceLevel } = asGetKeysResponse(json)
  // `asNumber` admits NaN and Infinity, either of which would poison the cache
  // metadata, so fall back to the server's documented default instead.
  const usableTtl =
    Number.isFinite(ttlSeconds) && ttlSeconds > 0
      ? ttlSeconds
      : DEFAULT_TTL_SECONDS
  return { keys, ttlSeconds: usableTtl, assuranceLevel }
}
