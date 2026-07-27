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
  // iOS-only: refresh a token via an App Attest assertion using the stored key.
  generateAssertion: (challenge: string) => Promise<{
    keyId?: string
    assertion?: string
    bundleId?: string
  }>
  // Android-only: refresh a token by signing the challenge with the enrolled
  // Keystore key.
  signChallenge: (challenge: string) => Promise<{
    keyId?: string
    signature?: string
  }>
  // Discard the stored attested key so the next handshake re-attests.
  // Available on both platforms. Guarded by Platform.OS for the assert paths.
  clearKey: () => Promise<void>
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
// Max time getAttestationToken() blocks waiting on the initial handshake.
const GET_TOKEN_TIMEOUT_MS = 3 * 1000
// Watchdog: a handshake that has not settled after this long is considered
// hung; release the lock so a later attempt can start. Sized well above a
// slow-but-legitimate handshake so concurrent handshakes never overlap in
// normal operation (Apple rate-limits attestation).
const HANDSHAKE_WATCHDOG_MS = 90 * 1000
// After a failed handshake, don't retry (and don't make gated callers wait)
// for this long. Keeps a persistently-failing device from adding 3s of
// latency to every gated request.
const FAILURE_BACKOFF_MS = 60 * 1000

let cachedToken: CachedToken | undefined
let inFlight: Promise<void> | undefined
let refreshTimer: ReturnType<typeof setTimeout> | undefined
let lastFailureAt = 0
// Monotonic id of the latest handshake attempt; used so a stale (watchdog-
// released) completion cannot clobber a token a newer handshake already
// cached (see runHandshake).
let handshakeGeneration = 0

/** Test-only: clear module state between Jest cases. */
export const resetAttestationForTests = (): void => {
  cachedToken = undefined
  inFlight = undefined
  if (refreshTimer != null) clearTimeout(refreshTimer)
  refreshTimer = undefined
  lastFailureAt = 0
  handshakeGeneration = 0
}

/** Test-only: expose timing constants used by unit tests. */
export const attestationTimingForTests = {
  GET_TOKEN_TIMEOUT_MS,
  HANDSHAKE_WATCHDOG_MS,
  FAILURE_BACKOFF_MS
}

const hasLiveToken = (): boolean =>
  cachedToken != null && Date.now() < cachedToken.expires - CLOCK_SKEW_MS

/** Obtain a single-use challenge from the info server. */
const fetchChallenge = async (): Promise<string> => {
  const challengeResponse = await fetchInfo('v1/attest/challenge')
  if (!challengeResponse.ok) {
    throw new Error(`challenge request failed: ${challengeResponse.status}`)
  }
  const { challenge } = await challengeResponse.json()
  if (typeof challenge !== 'string' || challenge === '') {
    throw new Error('challenge response missing challenge')
  }
  return challenge
}

/**
 * Validate an attest/assert token response. Both `token` and `expires` are
 * validated; a malformed response throws and is treated as a failed handshake
 * (a non-finite `expires` would otherwise fire `setTimeout` immediately and
 * spin the handshake loop). The parsed token is returned to the caller rather
 * than cached directly, so `runHandshake` can drop a stale (watchdog-released)
 * result before it clobbers a fresher token.
 */
const parseTokenResponse = (json: unknown): CachedToken => {
  const { token, expires } = (json ?? {}) as {
    token?: unknown
    expires?: unknown
  }
  if (typeof token !== 'string') {
    throw new Error('attest response missing token')
  }
  if (typeof expires !== 'number' || !Number.isFinite(expires)) {
    throw new Error('attest response missing expires')
  }
  return { token, expires }
}

/**
 * Run one attestation handshake and return the fresh token, or `undefined` when
 * there is nothing to do (no native module / unsupported platform). Never
 * caches directly; the caller commits the result. `generation` identifies this
 * attempt so a stale (watchdog-released) handshake never mutates shared token
 * state that a newer handshake already owns.
 */
const performHandshake = async (
  generation: number
): Promise<CachedToken | undefined> => {
  // No native module (e.g. unsupported platform / dev environment).
  if (EdgeAttestation == null) return undefined

  let supported = false
  try {
    supported = await EdgeAttestation.isSupported()
  } catch {
    supported = false
  }
  if (!supported) return undefined

  const isIos = Platform.OS === 'ios'

  // 1. Obtain a single-use challenge from the info server.
  let challenge = await fetchChallenge()

  // iOS fast path: assert with the stored attested key (no Apple round
  // trip, no new key). Falls back to full attestation when there is no
  // stored key, the key is invalid, or the server rejects the assertion.
  if (isIos) {
    try {
      const native = await EdgeAttestation.generateAssertion(challenge)
      const assertResponse = await fetchInfo('v1/attest/apple/assert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyId: native.keyId,
          assertion: native.assertion,
          challenge
        })
      })
      if (assertResponse.ok) {
        return parseTokenResponse(await assertResponse.json())
      }
      // Server rejected the assertion: the enrolled key is no longer trusted,
      // so any previously-minted token is suspect too. Drop it now so gated
      // callers do not keep sending a token the server already rejects while
      // re-enrollment is in progress; discard the key and re-attest. Only when
      // this is still the current handshake, so a stale (watchdog-released)
      // attempt cannot wipe a token a newer handshake already cached.
      if (generation === handshakeGeneration) cachedToken = undefined
      console.warn(
        `[attestation] assertion rejected (${assertResponse.status}); re-attesting`
      )
      await EdgeAttestation.clearKey().catch(() => {})
    } catch (error) {
      // noKey / invalidKey / native failure: fall through to full attestation.
      console.log('[attestation] assertion unavailable:', String(error))
    }
    // The challenge above was consumed (or expired); fetch a fresh one for
    // the fallback attestation.
    challenge = await fetchChallenge()
  }

  // Android fast path: sign the challenge with the enrolled Keystore key
  // (no new key, no RKP dependency). Falls back to full attestation when
  // there is no stored key or the server rejects the assertion.
  if (!isIos) {
    try {
      const native = await EdgeAttestation.signChallenge(challenge)
      const assertResponse = await fetchInfo('v1/attest/android/assert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyId: native.keyId,
          signature: native.signature,
          challenge
        })
      })
      if (assertResponse.ok) {
        return parseTokenResponse(await assertResponse.json())
      }
      // Server rejected the assertion: drop the now-suspect cached token (see
      // the iOS branch above), guarded by the current generation, before
      // discarding the key and re-attesting.
      if (generation === handshakeGeneration) cachedToken = undefined
      console.warn(
        `[attestation] assertion rejected (${assertResponse.status}); re-attesting`
      )
      await EdgeAttestation.clearKey().catch(() => {})
    } catch (error) {
      // noKey / native failure: fall through to full attestation.
      console.log('[attestation] assertion unavailable:', String(error))
    }
    // The challenge above was consumed (or expired); fetch a fresh one for
    // the fallback attestation.
    challenge = await fetchChallenge()
  }

  // 2. Produce a platform attestation bound to the challenge.
  const native = await EdgeAttestation.getAttestation(challenge)

  // 3. Submit the attestation and receive a signed token.
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
  return parseTokenResponse(await attestResponse.json())
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
  if (Date.now() - lastFailureAt < FAILURE_BACKOFF_MS) return
  // A handshake whose native call hangs past the watchdog has its `inFlight`
  // lock released so a newer handshake can start. Tag each attempt so a stale
  // one that finally resolves cannot clobber the newer handshake's token.
  const generation = ++handshakeGeneration
  const handshake: Promise<void> = performHandshake(generation)
    .then(freshToken => {
      if (generation !== handshakeGeneration) {
        // Watchdog-superseded: a newer attempt already owns the generation.
        // Still accept a late valid JWT when nothing fresher is cached (the
        // newer attempt may have failed and entered backoff). Never clobber
        // a live token a newer handshake already produced.
        if (freshToken == null || hasLiveToken()) return
      }
      lastFailureAt = 0
      if (freshToken != null) {
        cachedToken = freshToken
        scheduleRefresh(freshToken.expires)
      }
    })
    .catch((error: unknown) => {
      if (generation !== handshakeGeneration) return
      lastFailureAt = Date.now()
      console.warn('[attestation] handshake failed:', String(error))
    })
    .finally(() => {
      if (inFlight === handshake) inFlight = undefined
    })
  inFlight = handshake
  // A hung native call must not block all future attempts. Only clear the
  // lock if this same handshake still holds it.
  setTimeout(() => {
    if (inFlight === handshake) {
      console.warn('[attestation] handshake watchdog fired; releasing lock')
      inFlight = undefined
    }
  }, HANDSHAKE_WATCHDOG_MS)
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
