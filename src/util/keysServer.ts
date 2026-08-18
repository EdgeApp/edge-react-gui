import { asJSON, asObject, asOptional, asString } from 'cleaners'
import type { EdgeFetchFunction } from 'edge-core-js'

import { asMergeableKeys } from '../configKeysMerge'
import { signHmacAuthorization } from './hmacAuth'
import { fetchInfo } from './network'

const asGetKeysResponse = asObject({
  // Shared with the cache tier so both are held to one definition of mergeable,
  // and a malformed response fails the fetch rather than reaching KEYS or disk.
  keys: asMergeableKeys,
  // Added by the info server so the client can record which layer it was
  // actually served, rather than inferring it from whether it sent a token.
  assuranceLevel: asOptional(asString)
})

const asGetKeysResponseFile = asJSON(asGetKeysResponse)

export type RemoteKeysResult = ReturnType<typeof asGetKeysResponse>

/**
 * Per-server stagger passed to `fetchInfo` / `asyncWaterfall` (same as its
 * default). Not a hard ceiling on the whole getKeys call: with multiple info
 * servers the waterfall can outlast this value. The cold-start gate in
 * `keysStore` is what bounds how long boot waits.
 */
const FETCH_TIMEOUT_MS = 5000

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
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const authorization = signHmacAuthorization(
    'GET',
    signPath,
    '',
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
    { method: 'GET', headers },
    opts.timeoutMs ?? FETCH_TIMEOUT_MS,
    infoFetch
  )
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`fetchRemoteKeys ${response.status}: ${text.slice(0, 200)}`)
  }

  return asGetKeysResponseFile(await response.text())
}
