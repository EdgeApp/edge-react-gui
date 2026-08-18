import { asJSON, asObject, asOptional, asString } from 'cleaners'
import type { EdgeApiSigner, EdgeFetchFunction } from 'edge-core-js'

import { asMergeableKeys } from '../configKeysMerge'
import { buildSignedRequestText, signHmacAuthorization } from './hmacAuth'
import { fetchInfo } from './network'

const asSignedInfoRollupKeys = asObject({
  // Shared with the cache tier so both are held to one definition of mergeable,
  // and a malformed overlay fails the fetch rather than reaching KEYS or disk.
  appKeys: asMergeableKeys,
  // Added by the info server so the client can record which layer it was
  // actually served, rather than inferring it from whether it sent a token.
  assuranceLevel: asOptional(asString)
}).withRest

const asSignedInfoRollupKeysFile = asJSON(asSignedInfoRollupKeys)

export interface RemoteKeysResult {
  keys: Record<string, unknown>
  assuranceLevel: string | undefined
  /** Raw rollup object (public fields plus appKeys). */
  rollup: Record<string, unknown>
}

/**
 * Per-server stagger passed to `fetchInfo` / `asyncWaterfall` (same as its
 * default). Not a hard ceiling on the whole signed infoRollup call: with
 * multiple info servers the waterfall can outlast this value. The cold-start
 * gate in `keysStore` is what bounds how long boot waits.
 */
const FETCH_TIMEOUT_MS = 5000

/**
 * Either signer works, but one of them is required, so the choice is a union
 * rather than two optional fields: a caller cannot pass neither.
 */
export type FetchCredentials =
  | { apiSigner: EdgeApiSigner }
  | { apiKey: string; secret: Uint8Array }

export async function fetchRemoteKeys(
  opts: FetchCredentials & {
    appId: string
    os: string
    osVersion: string
    appVersion: string
    infoFetch?: EdgeFetchFunction
    attestationToken?: string
    timeoutMs?: number
  }
): Promise<RemoteKeysResult> {
  const { appId, os, osVersion, appVersion, infoFetch, attestationToken } = opts
  const encodedAppId = encodeURIComponent(appId)
  const query = `os=${encodeURIComponent(os)}&osVersion=${encodeURIComponent(
    osVersion
  )}&appVersion=${encodeURIComponent(appVersion)}`
  const fetchPath = `v1/infoRollup/${encodedAppId}?${query}`
  // The server signs `req.originalUrl`, which includes the `/v1` mount point.
  // `fetchPath` already carries that prefix; `fetchInfo` only joins the server
  // origin, so the leading slash here reproduces the request target exactly.
  const signPath = `/${fetchPath}`
  const method = 'GET'
  const body = ''
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const signedText = buildSignedRequestText(method, signPath, body, timestamp)

  // Narrowing needs the bare union: `in` cannot discriminate the intersection
  // that carries the request options.
  const credentials: FetchCredentials = opts

  let authorization: string
  if ('apiSigner' in credentials) {
    const signed = await credentials.apiSigner.signMessage(signedText)
    authorization = `HMAC ${signed.apiKey} ${signed.signature}`
  } else {
    authorization = signHmacAuthorization(
      method,
      signPath,
      body,
      timestamp,
      credentials.apiKey,
      credentials.secret
    )
  }

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
    throw new Error(`fetchRemoteKeys ${response.status}: ${text.slice(0, 200)}`)
  }

  const parsed = asSignedInfoRollupKeysFile(await response.text())
  const { appKeys, assuranceLevel, ...rest } = parsed
  const rollup: Record<string, unknown> = { appKeys, assuranceLevel, ...rest }
  return {
    keys: appKeys,
    assuranceLevel,
    rollup
  }
}
