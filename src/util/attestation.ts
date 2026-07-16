import { NativeModules, Platform } from 'react-native'

import { fetchInfo } from './network'

/**
 * Shape of the native EdgeAttestation module (iOS Swift / Android Kotlin).
 * iOS returns `{ keyId, attestation }`; Android returns `{ certChain }`.
 */
interface NativeAttestation {
  isSupported: () => Promise<boolean>
  getAttestation: (challenge: string) => Promise<{
    keyId?: string
    attestation?: string
    bundleId?: string
    certChain?: string[]
  }>
}

const EdgeAttestation: NativeAttestation | undefined =
  NativeModules.EdgeAttestation

interface CachedToken {
  token: string
  expires: number // epoch milliseconds
}

// Relaunch the handshake this long before the current token expires, so a fresh
// token is (re)fetched by the background engine well ahead of expiry.
const REFRESH_LEAD_MS = 2 * 60 * 1000
// Small skew so a token that is about to expire is treated as unusable.
const CLOCK_SKEW_MS = 5 * 1000
// Max time a caller waits and one handshake attempt holds the shared lock.
const GET_TOKEN_TIMEOUT_MS = 3 * 1000

let cachedToken: CachedToken | undefined
let inFlight: Promise<void> | undefined
let refreshTimer: ReturnType<typeof setTimeout> | undefined

const hasLiveToken = (): boolean =>
  cachedToken != null && Date.now() < cachedToken.expires - CLOCK_SKEW_MS

const performHandshake = async (): Promise<void> => {
  // No native module (e.g. unsupported platform / dev environment).
  if (EdgeAttestation == null) return

  let supported = false
  try {
    supported = await EdgeAttestation.isSupported()
  } catch {
    supported = false
  }
  if (!supported) return

  // 1. Obtain a single-use challenge from the info server.
  const challengeResponse = await fetchInfo('v1/attest/challenge')
  if (!challengeResponse.ok) {
    throw new Error(`challenge request failed: ${challengeResponse.status}`)
  }
  const { challenge } = await challengeResponse.json()
  if (typeof challenge !== 'string' || challenge === '') {
    throw new Error('challenge response missing challenge')
  }

  // 2. Produce a platform attestation bound to the challenge.
  const native = await EdgeAttestation.getAttestation(challenge)

  // 3. Submit the attestation and receive a signed token.
  const isIos = Platform.OS === 'ios'
  const path = isIos ? 'v1/attest/apple' : 'v1/attest/android'
  const body = isIos
    ? {
        keyId: native.keyId,
        attestation: native.attestation,
        bundleId: native.bundleId,
        challenge
      }
    : { certChain: native.certChain, challenge }

  const attestResponse = await fetchInfo(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!attestResponse.ok) {
    const text = await attestResponse.text()
    throw new Error(`attest request failed: ${attestResponse.status} ${text}`)
  }
  const { token, expires } = await attestResponse.json()
  if (typeof token !== 'string') {
    throw new Error('attest response missing token')
  }
  if (typeof expires !== 'number' || !Number.isFinite(expires)) {
    throw new Error('attest response missing expires')
  }
  cachedToken = { token, expires }
}

const delay = async (ms: number): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Schedule the next handshake to run `REFRESH_LEAD_MS` before the given token
 * expiry, so the background engine keeps a fresh token cached ahead of time.
 */
const scheduleRefresh = (expires: number): void => {
  if (refreshTimer != null) clearTimeout(refreshTimer)
  const delayMs = Math.max(0, expires - Date.now() - REFRESH_LEAD_MS)
  refreshTimer = setTimeout(() => {
    runHandshake()
  }, delayMs)
}

/**
 * Kick off a handshake in the background if one is not already running. Never
 * throws (failures are logged) and never blocks the caller. On success, caches
 * the token and schedules the next refresh.
 */
const runHandshake = (): void => {
  if (inFlight != null) return
  const handshake: Promise<void> = performHandshake()
    .then(() => {
      if (cachedToken != null) scheduleRefresh(cachedToken.expires)
    })
    .catch((error: unknown) => {
      console.warn('[attestation] handshake failed:', String(error))
    })
    .finally(() => {
      if (inFlight === handshake) inFlight = undefined
    })
  inFlight = handshake
  // A stuck native call may continue, but it must not block later attempts.
  setTimeout(() => {
    if (inFlight === handshake) inFlight = undefined
  }, GET_TOKEN_TIMEOUT_MS)
}

/**
 * Start the background attestation engine. Called once at app boot. Kicks off an
 * initial handshake (unless a live token is already cached) without blocking;
 * the engine then self-reschedules to refresh the token ahead of each expiry.
 */
export const initAttestation = (): void => {
  if (hasLiveToken()) return
  runHandshake()
}

/**
 * Return the most recent attestation token for an attestation-gated caller.
 * Resolves immediately with the cached token when one is live. Otherwise it
 * ensures a handshake is running and waits at most `GET_TOKEN_TIMEOUT_MS`,
 * returning `undefined` on timeout. Callers treat `undefined` as "no token" and
 * let the info server decide (it may still serve a fallback response).
 */
export const getAttestationToken = async (): Promise<string | undefined> => {
  if (hasLiveToken()) return cachedToken?.token
  runHandshake()
  if (inFlight != null) {
    await Promise.race([inFlight, delay(GET_TOKEN_TIMEOUT_MS)])
  }
  return hasLiveToken() ? cachedToken?.token : undefined
}
