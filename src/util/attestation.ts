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
  // Discard the stored attested key so the next handshake re-attests. Available
  // on both platforms. Guarded by Platform.OS for the assert paths.
  //
  // Takes the key id the caller means to discard, because this call can sit
  // behind a slow native operation for a long time and the stored key may have
  // been replaced by a newer handshake before it runs. Native drops the key only
  // while it is still that one. Omit the id to discard whatever is stored.
  clearKey: (keyId?: string) => Promise<void>
}

const EdgeAttestation: NativeAttestation | undefined =
  NativeModules.EdgeAttestation

interface CachedToken {
  token: string
  expires: number // epoch milliseconds
}

/** Per-attempt state shared between `runHandshake` and `performHandshake`. */
interface HandshakeAttempt {
  // Monotonic id of this attempt, so a stale (watchdog-released) handshake
  // never mutates shared state that a newer handshake already owns.
  generation: number
  // Set once the attempt has consumed a platform attestation. Failures before
  // that point cost nothing rate-limited, so they must not grow the backoff.
  usedAttestation: boolean
  // This attempt's watchdog, cleared when it settles so a handshake that
  // finished does not leave a timer pending for the whole watchdog window.
  watchdog?: ReturnType<typeof setTimeout>
}

// Relaunch the handshake this long before the current token expires, so a fresh
// token is (re)fetched by the background engine well ahead of expiry.
const REFRESH_LEAD_MS = 2 * 60 * 1000
// Floor for a scheduled refresh. The delay is derived from the server's
// `expires`, and the token lifetime is remote config (info server
// `attestationTokenLifetimeSec`), so treat it as untrusted: a lifetime shorter
// than REFRESH_LEAD_MS - or a device clock running fast - would otherwise
// schedule the next handshake immediately and spin the engine as fast as the
// network answers, for every client at once.
const MIN_REFRESH_MS = 60 * 1000
// Floor between handshake starts, whatever the previous one returned. The
// backoff only covers failures and MIN_REFRESH_MS only covers the timer, but a
// token whose lifetime is shorter than that floor leaves a window where nothing
// is cached and every gated call would start a handshake of its own - the Banxa
// order poll runs every 3s. Kept below FAILURE_BACKOFF_MS so it never relaxes
// the failure backoff, only bounds the success path.
const MIN_HANDSHAKE_SPACING_MS = 30 * 1000
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
// Ceiling for the backoff once attempts start burning platform attestations.
// A device the server keeps rejecting must not re-attest every minute for as
// long as the app is open: Apple App Attest and Android Keystore attestation
// are both rate-limited, and tripping those limits locks out the devices that
// could otherwise recover.
const MAX_BACKOFF_MS = 30 * 60 * 1000

let cachedToken: CachedToken | undefined
let inFlight: Promise<void> | undefined
let refreshTimer: ReturnType<typeof setTimeout> | undefined
let lastFailureAt = 0
let lastHandshakeAt = 0
// Attempts that burned a platform attestation and still failed, since the last
// success. Only these grow the backoff (see `failureBackoffMs`). Reset wherever
// `lastFailureAt` is cleared.
let consecutiveFailures = 0
// Monotonic id of the latest handshake attempt; used so a stale (watchdog-
// released) completion cannot clobber a token a newer handshake already
// cached (see runHandshake).
let handshakeGeneration = 0
// Set once the platform has told us it can never attest: no native module, or
// `isSupported` resolved false. Terminal, so the engine stops rather than waking
// up forever on a device that will never produce a token. A native *rejection*
// is not this - that is a bridge failure, and it retries (see performHandshake).
let unsupported = false

/** Test-only: clear module state between Jest cases. */
export const resetAttestationForTests = (): void => {
  cachedToken = undefined
  inFlight = undefined
  if (refreshTimer != null) clearTimeout(refreshTimer)
  refreshTimer = undefined
  lastFailureAt = 0
  lastHandshakeAt = 0
  consecutiveFailures = 0
  handshakeGeneration = 0
  unsupported = false
}

/** Test-only: expose timing constants used by unit tests. */
export const attestationTimingForTests = {
  GET_TOKEN_TIMEOUT_MS,
  HANDSHAKE_WATCHDOG_MS,
  FAILURE_BACKOFF_MS,
  MAX_BACKOFF_MS,
  MIN_HANDSHAKE_SPACING_MS,
  MIN_REFRESH_MS,
  REFRESH_LEAD_MS
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
 * (an `expires` that is non-finite or already past would otherwise cache a
 * token no caller can use). The parsed token is returned to the caller rather
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
  // Never cache a token that is not usable on arrival (see `hasLiveToken`).
  // Failing the handshake sends it into backoff, where a bad mint or a skewed
  // device clock costs one attempt per backoff rather than a refresh loop.
  if (expires - CLOCK_SKEW_MS <= Date.now()) {
    throw new Error('attest response expires is not in the future')
  }
  return { token, expires }
}

/**
 * Abandon a handshake the watchdog has already retired. `runHandshake` ignores
 * whatever a retired attempt settles with, so continuing only spends state and
 * rate-limited quota that a live attempt now owns.
 */
const assertCurrent = (attempt: HandshakeAttempt): void => {
  if (attempt.generation !== handshakeGeneration) {
    throw new Error('handshake retired by watchdog')
  }
}

/**
 * Whether a non-OK assert response means the server actually judged our enrolled
 * key and found it untrusted, as opposed to failing to answer at all. A 5xx is
 * the info server (or Couch behind it) being down and a 429 is it throttling;
 * neither says anything about the key. Reading those as a rejection would have
 * every device in the fleet discard its key and re-attest during an outage - a
 * fleet-wide run at the platform rate limits, caused by something that fixes
 * itself.
 */
const isKeyRejection = (status: number): boolean =>
  status < 500 && status !== 429

// Native rejection codes that say nothing about whether the enrolled key can
// sign, so the cheap path deserves another try instead of a rate-limited
// attestation. Everything else (`noKey`, `invalidKey`, a native signing failure)
// means the key is unusable, and re-enrolling is the only way forward.
const TRANSIENT_NATIVE_CODES = new Set(['timeout'])

/**
 * Refresh the token with the enrolled key: an assertion on iOS, a challenge
 * signature on Android. Both are local signatures - no Apple/Google round trip
 * and no new key - so this is the path every handshake after enrollment takes.
 *
 * Returns `undefined` when there is no usable enrolled key and the caller should
 * fall back to a full platform attestation. That fallback is the expensive,
 * rate-limited path, so it is reserved for the cases it can actually fix: a key
 * that cannot sign, and a key the server has judged and rejected. Everything
 * else - an unusable 200 body, a server that failed to answer, a native failure
 * that says nothing about the key - throws and fails the handshake into backoff,
 * because re-attesting cannot fix any of them and would spend quota every retry
 * to hide them.
 */
const refreshWithEnrolledKey = async (
  native: NativeAttestation,
  attempt: HandshakeAttempt,
  challenge: string
): Promise<CachedToken | undefined> => {
  const isIos = Platform.OS === 'ios'

  let body: unknown
  // Remembered outside the try so a rejection below can name the exact key the
  // server refused, rather than asking native to discard whatever it holds.
  let signedKeyId: string | undefined
  try {
    if (isIos) {
      const { keyId, assertion } = await native.generateAssertion(challenge)
      signedKeyId = keyId
      body = { keyId, assertion, challenge }
    } else {
      const { keyId, signature } = await native.signChallenge(challenge)
      signedKeyId = keyId
      body = { keyId, signature, challenge }
    }
  } catch (error) {
    const code = (error as { code?: unknown } | undefined)?.code
    if (typeof code === 'string' && TRANSIENT_NATIVE_CODES.has(code)) {
      throw error
    }
    // noKey / invalidKey / native signing failure: fall back to full attestation.
    console.log('[attestation] assertion unavailable:', String(error))
    return undefined
  }

  const response = await fetchInfo(
    isIos ? 'v1/attest/apple/assert' : 'v1/attest/android/assert',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }
  )
  if (response.ok) return parseTokenResponse(await response.json())
  if (!isKeyRejection(response.status)) {
    throw new Error(`assert request failed: ${response.status}`)
  }

  // Server rejected the assertion: the enrolled key is no longer trusted, so any
  // previously-minted token is suspect too. Drop it now so gated callers do not
  // keep sending a token the server already rejects while re-enrollment is in
  // progress; discard the key and re-attest. Stop if the watchdog already retired
  // this attempt - the key and token belong to a live handshake now, and clearing
  // them would force it into a needless re-attestation.
  assertCurrent(attempt)
  cachedToken = undefined
  console.warn(
    `[attestation] assertion rejected (${response.status}); re-attesting`
  )
  // Name the key the server actually refused. This call can queue behind a slow
  // native operation, and by the time it runs a newer handshake may have enrolled
  // a replacement - which is working fine and must not be discarded on the
  // strength of a verdict about its predecessor.
  await native.clearKey(signedKeyId).catch(() => {})
  return undefined
}

/**
 * Run one attestation handshake and return the fresh token, or `undefined` when
 * this device can never attest. Never caches directly; the caller commits the
 * result. Records progress on `attempt` so the caller can tell a stale handshake
 * from the current one, and a cheap failure from one that burned a platform
 * attestation.
 */
const performHandshake = async (
  attempt: HandshakeAttempt
): Promise<CachedToken | undefined> => {
  // No native module (e.g. unsupported platform / dev environment).
  if (EdgeAttestation == null) return undefined

  // Let a rejection here throw: that is the bridge failing to answer, not the
  // device saying no, and swallowing it would retire the engine over a hiccup.
  // Only an explicit `false` is terminal.
  if (!(await EdgeAttestation.isSupported())) return undefined

  const isIos = Platform.OS === 'ios'

  // 1. Obtain a single-use challenge from the info server, and try to refresh
  // with the key enrolled by an earlier handshake.
  const refreshed = await refreshWithEnrolledKey(
    EdgeAttestation,
    attempt,
    await fetchChallenge()
  )
  if (refreshed != null) return refreshed

  // The challenge above was consumed (or expired); fetch a fresh one for the
  // fallback attestation.
  const challenge = await fetchChallenge()

  // 2. Produce a platform attestation bound to the challenge. Everything up to
  // here is a plain info-server round trip (assertions are signed locally), so
  // only from this point on does a failure cost rate-limited quota - which is
  // reason enough not to spend it for an attempt nobody is waiting on.
  assertCurrent(attempt)
  attempt.usedAttestation = true
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
 * Arm the background timer, replacing whatever was pending. Every path that
 * declines to start a handshake has to come through here: the engine has no
 * other clock, so a path that neither starts a handshake nor arms a timer stalls
 * it until the next gated call (see `runHandshake`).
 */
const armTimer = (delayMs: number): void => {
  if (refreshTimer != null) clearTimeout(refreshTimer)
  refreshTimer = setTimeout(() => {
    runHandshake()
  }, delayMs)
}

/**
 * Schedule the next handshake to run `REFRESH_LEAD_MS` before the given token
 * expiry, so the background engine keeps a fresh token cached ahead of time,
 * but never sooner than `MIN_REFRESH_MS`.
 */
const scheduleRefresh = (expires: number): void => {
  armTimer(Math.max(MIN_REFRESH_MS, expires - Date.now() - REFRESH_LEAD_MS))
}

/**
 * How long to wait before the next attempt. `FAILURE_BACKOFF_MS` while failures
 * are cheap (offline, info server down), doubling up to `MAX_BACKOFF_MS` once
 * attempts start burning rate-limited platform attestations.
 *
 * Both the background retry timer and the gate in `runHandshake` use this, so
 * gated plugin traffic - the Banxa order poll runs every 3s - cannot outpace
 * the policy. Keeping cheap failures at the floor is what makes that safe: a
 * user whose network dropped still recovers within a minute of coming back,
 * while a device the server keeps rejecting backs off. That device would fail
 * its gated requests either way, so the only thing a faster retry buys it is
 * burnt quota and a 3s stall per request.
 */
const failureBackoffMs = (): number =>
  Math.min(
    FAILURE_BACKOFF_MS * 2 ** Math.max(0, consecutiveFailures - 1),
    MAX_BACKOFF_MS
  )

/**
 * Schedule the next handshake after a failed or hung attempt. `scheduleRefresh`
 * only runs on success, so without this the engine would sit idle until a gated
 * call or an app restart.
 */
const scheduleRetryAfterFailure = (): void => {
  // A cached token may still have most of its life left - a stale handshake can
  // land one while a newer attempt is failing. Never retry sooner than
  // `scheduleRefresh` would have, or a failing device would re-attest every
  // backoff while a perfectly good token sits in the cache.
  const refreshMs =
    cachedToken == null ? 0 : cachedToken.expires - Date.now() - REFRESH_LEAD_MS
  armTimer(Math.max(failureBackoffMs(), refreshMs))
}

/**
 * How long `runHandshake` must wait before it may start another attempt: the
 * failure backoff, and a floor between handshakes that applies whatever the last
 * one returned. Zero when an attempt may start now.
 */
const handshakeWaitMs = (): number =>
  Math.max(
    0,
    lastFailureAt + failureBackoffMs() - Date.now(),
    lastHandshakeAt + MIN_HANDSHAKE_SPACING_MS - Date.now()
  )

/**
 * Kick off a handshake in the background if one is not already running. Never
 * throws (failures are logged) and never blocks the caller. On success, caches
 * the token and schedules the next refresh; on failure or hang, schedules a
 * backoff retry. Every exit path leaves either a handshake in flight or a timer
 * armed, unless the device is `unsupported` and there is nothing left to try.
 */
const runHandshake = (): void => {
  if (unsupported) return
  if (inFlight != null) return
  const waitMs = handshakeWaitMs()
  if (waitMs > 0) {
    // Re-arm instead of just returning. This path swallows whatever tick woke
    // us, and a timer armed for exactly the backoff can land a hair short of it
    // when the wall clock steps backwards, so returning bare would strand the
    // engine until the next gated call.
    armTimer(waitMs)
    return
  }
  lastHandshakeAt = Date.now()
  // A handshake whose native call hangs past the watchdog has its `inFlight`
  // lock released so a newer handshake can start. Tag each attempt so a stale
  // one that finally resolves cannot clobber a token a newer handshake already
  // produced - while still accepting a late valid JWT when nothing is cached
  // (the newer attempt may have failed into backoff).
  const attempt: HandshakeAttempt = {
    generation: ++handshakeGeneration,
    usedAttestation: false
  }
  const handshake: Promise<void> = performHandshake(attempt)
    .then(freshToken => {
      if (freshToken == null) {
        // Terminal: this device cannot attest, so stop the engine rather than
        // waking up forever to ask again.
        unsupported = true
        return
      }
      // A stale (watchdog-released) attempt may still land a valid JWT. Take
      // it when nothing live is cached - the newer attempt may have failed
      // into backoff - but never clobber a token a newer handshake produced.
      if (attempt.generation !== handshakeGeneration && hasLiveToken()) return
      lastFailureAt = 0
      consecutiveFailures = 0
      cachedToken = freshToken
      scheduleRefresh(freshToken.expires)
    })
    .catch((error: unknown) => {
      if (attempt.generation !== handshakeGeneration) return
      lastFailureAt = Date.now()
      if (attempt.usedAttestation) consecutiveFailures += 1
      console.warn('[attestation] handshake failed:', String(error))
      scheduleRetryAfterFailure()
    })
    .finally(() => {
      if (attempt.watchdog != null) clearTimeout(attempt.watchdog)
      if (inFlight === handshake) inFlight = undefined
    })
  inFlight = handshake
  // A hung native call must not block all future attempts. Only clear the
  // lock if this same handshake still holds it.
  attempt.watchdog = setTimeout(() => {
    if (inFlight !== handshake) return
    console.warn('[attestation] handshake watchdog fired; releasing lock')
    inFlight = undefined
    // Releasing the lock abandons this attempt, so retire its generation too.
    // Otherwise it still reads as current until some other handshake starts,
    // and a late settle would count this one failure twice, overwrite the
    // `lastFailureAt` set below, and push out the retry scheduled here.
    handshakeGeneration += 1
    // A hang is a failure and has to be recorded as one. The backoff is what
    // stops a device whose native call never answers from starting a fresh
    // handshake on every gated request - and stalling each of those requests
    // for GET_TOKEN_TIMEOUT_MS, which is the latency this backoff exists to
    // avoid. A hang inside the native attestation spends the rate-limited
    // quota just like a rejection does, so it grows the backoff too.
    lastFailureAt = Date.now()
    if (attempt.usedAttestation) consecutiveFailures += 1
    // An attempt that never settles leaves nothing else to re-arm the loop.
    scheduleRetryAfterFailure()
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
 *
 * A caller that arrives while the engine is backing off returns `undefined`
 * without waiting at all: `runHandshake` declines to start one, so there is
 * nothing to await. That is what keeps a persistently-failing device from adding
 * `GET_TOKEN_TIMEOUT_MS` to every gated request.
 */
export const getAttestationToken = async (): Promise<string | undefined> => {
  if (hasLiveToken()) return cachedToken?.token
  runHandshake()
  if (inFlight != null) {
    await Promise.race([inFlight, delay(GET_TOKEN_TIMEOUT_MS)])
  }
  return hasLiveToken() ? cachedToken?.token : undefined
}
