import {
  asMaybe,
  asNumber,
  asObject,
  asOptional,
  asString,
  asUnknown
} from 'cleaners'
import { NativeModules, Platform } from 'react-native'

import { showButtonsModal } from '../components/modals/ButtonsModal'
import { lstrings } from '../locales/strings'
import { monotonicNow } from './monotonicTime'
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
  // Monotonic deadline: `monotonicNow()` when the token was received plus the
  // server's `expiresIn` lifetime. Compared only against `monotonicNow()`, so a
  // device date change cannot revive an expired token or kill a live one.
  expiresMono: number
}

/** Per-attempt state shared between `runHandshake` and `performHandshake`. */
interface HandshakeAttempt {
  // Monotonic id of this attempt, so a stale (watchdog-released) handshake
  // never mutates shared state that a newer handshake already owns.
  generation: number
  // Set once the attempt has consumed a platform attestation. Failures before
  // that point cost nothing rate-limited, so they must not grow the backoff.
  usedAttestation: boolean
  // Whether this attempt has already been counted against the backoff, so a
  // later verdict that it spent nothing can take that count back - exactly once.
  countedFailure: boolean
  // This attempt's watchdog, cleared when it settles so a handshake that
  // finished does not leave a timer pending for the whole watchdog window.
  watchdog?: ReturnType<typeof setTimeout>
}

// Relaunch the handshake this long before the current token expires, so a fresh
// token is (re)fetched by the background engine well ahead of expiry. Sized
// above the worst-case recovery path (watchdog + failure backoff + one
// handshake) so a hung refresh can still be replaced before the cached token
// dies.
const REFRESH_LEAD_MS = 5 * 60 * 1000
// Floor for a scheduled refresh. The delay is derived from the server's
// `expiresIn`, and the token lifetime is remote config (info server
// `attestationTokenLifetimeSec`), so treat it as untrusted: a lifetime shorter
// than REFRESH_LEAD_MS would otherwise schedule the next handshake immediately
// and spin the engine as fast as the network answers, for every client at once.
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
// Device vs server wall-clock gap that triggers the once-per-day skew modal.
// Two minutes is where TOTP and similar schemes start failing reliably; a few
// seconds of NTP noise must not trigger a modal.
const CLOCK_WARN_MS = 2 * 60 * 1000
// Max time getAttestationToken() blocks waiting on the initial handshake.
const GET_TOKEN_TIMEOUT_MS = 3 * 1000
// Watchdog: backstop for a bridge that lost the message. Each native module
// answers first (iOS operationTimeout / Android lock timeout), so this is no
// longer the primary hang detector - it only fires when native never replies.
const HANDSHAKE_WATCHDOG_MS = 150 * 1000
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
// `undefined` means no prior stamp. Initializing these to `0` worked with
// `Date.now()` (epoch is always far past) but a monotonic clock starts near
// zero, so `0` would look like "just now" and park every first handshake behind
// the backoff and spacing floors.
let lastFailureAt: number | undefined
let lastHandshakeAt: number | undefined
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
// Last time we showed the clock-skew modal, by monotonic clock. At most one
// warning per day of app uptime so the refresh cadence cannot re-prompt.
let lastClockWarnAtMono: number | undefined

/** Test-only: clear module state between Jest cases. */
export const resetAttestationForTests = (): void => {
  cachedToken = undefined
  inFlight = undefined
  if (refreshTimer != null) clearTimeout(refreshTimer)
  refreshTimer = undefined
  lastFailureAt = undefined
  lastHandshakeAt = undefined
  consecutiveFailures = 0
  handshakeGeneration = 0
  unsupported = false
  lastClockWarnAtMono = undefined
}

/**
 * Whether the cached token may be handed to a gated caller right now.
 *
 * Lifetime is measured on the monotonic clock from the moment the token arrived,
 * so a device date change cannot revive an expired token or kill a live one.
 * The skew margin treats a token about to expire as already unusable - the
 * request still has to travel and be verified.
 */
const canServeToken = (): boolean =>
  cachedToken != null &&
  monotonicNow() < cachedToken.expiresMono - CLOCK_SKEW_MS

/**
 * Warn once per day of app uptime when the device wall clock disagrees with the
 * server by more than `CLOCK_WARN_MS`. `serverTime` is a UX signal only - it
 * never feeds lifetimes, backoff, or refresh math.
 */
const maybeWarnClockSkew = (serverTime: unknown): void => {
  if (typeof serverTime !== 'string') return
  const parsed = Date.parse(serverTime)
  if (Number.isNaN(parsed)) return
  if (Math.abs(Date.now() - parsed) < CLOCK_WARN_MS) return
  if (
    lastClockWarnAtMono != null &&
    monotonicNow() - lastClockWarnAtMono < 24 * 60 * 60 * 1000
  ) {
    return
  }
  lastClockWarnAtMono = monotonicNow()
  showButtonsModal({
    title: lstrings.clock_skew_title,
    message: lstrings.clock_skew_message,
    buttons: { ok: { label: lstrings.string_ok_cap } }
  }).catch(() => {})
}

/**
 * `serverTime` is advisory: it only drives the clock-skew warning, and is read
 * before the rest of the body is validated so a malformed response still warns.
 * Parsed on its own for that reason, rather than as part of the cleaners below.
 */
const asServerTimeCue = asObject({ serverTime: asOptional(asUnknown) })

const asChallengeResponse = asObject({ challenge: asString })

const asTokenResponse = asObject({
  token: asString,
  expiresIn: asNumber
})

/** Obtain a single-use challenge from the info server. */
const fetchChallenge = async (): Promise<string> => {
  const challengeResponse = await fetchInfo('v1/attest/challenge')
  if (!challengeResponse.ok) {
    throw new Error(`challenge request failed: ${challengeResponse.status}`)
  }
  const body = await challengeResponse.json()
  maybeWarnClockSkew(asMaybe(asServerTimeCue)(body)?.serverTime)
  const { challenge } = asChallengeResponse(body)
  if (challenge === '') {
    throw new Error('challenge response missing challenge')
  }
  return challenge
}

/**
 * Validate an attest/assert token response. Both `token` and `expiresIn` are
 * validated; a malformed response throws and is treated as a failed handshake
 * (a lifetime that is non-finite, non-positive, or at or under `CLOCK_SKEW_MS`
 * would otherwise cache a token no caller can use). The parsed token is returned
 * to the caller rather than cached directly, so `runHandshake` can drop a stale
 * (watchdog-released) result before it clobbers a fresher token.
 *
 * `serverTime` is read only for the skew warning; it never enters `expiresMono`.
 */
const parseTokenResponse = (json: unknown): CachedToken => {
  maybeWarnClockSkew(asMaybe(asServerTimeCue)(json)?.serverTime)
  const { token, expiresIn } = asTokenResponse(json)
  // `asNumber` admits NaN and Infinity, so the range still has to be checked
  // here: both would otherwise become a nonsense `expiresMono` deadline.
  if (!Number.isFinite(expiresIn) || expiresIn <= 0) {
    throw new Error('attest response missing expiresIn')
  }
  const lifetimeMs = expiresIn * 1000
  // Never cache a token that is not usable on arrival (see `canServeToken`).
  // Failing the handshake sends it into backoff, where a bad mint costs one
  // attempt per backoff rather than a refresh loop.
  if (lifetimeMs <= CLOCK_SKEW_MS) {
    throw new Error('attest response expiresIn is too short')
  }
  return { token, expiresMono: monotonicNow() + lifetimeMs }
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
const TRANSIENT_NATIVE_CODES = new Set(['timeout', 'lockTimeout'])

// Native rejection codes proving the platform attestation never ran, so the
// attempt spent nothing rate-limited even though it had reached the step that
// normally would. Android reports this when it gives up waiting for the Keystore
// lock, before the lock is held and before any key is generated.
//
// iOS's `timeout` is deliberately absent: it fires while waiting on attestKey's
// callback, so App Attest did start and Apple may already have counted it.
// Assuming otherwise there would under-count real quota burn, which is the
// expensive mistake; assuming it here would over-count a failure that cost
// nothing and push a merely contended device toward MAX_BACKOFF_MS.
const UNSPENT_NATIVE_CODES = new Set(['lockTimeout'])

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
  let native
  try {
    native = await EdgeAttestation.getAttestation(challenge)
  } catch (error) {
    // The flag has to be set before the call, because a native call that hangs
    // or never answers may well have spent the attestation. When native tells us
    // it never got that far, take it back rather than growing the backoff for a
    // failure that cost nothing.
    const code = (error as { code?: unknown } | undefined)?.code
    if (typeof code === 'string' && UNSPENT_NATIVE_CODES.has(code)) {
      attempt.usedAttestation = false
    }
    throw error
  }

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
const scheduleRefresh = (expiresMono: number): void => {
  armTimer(
    Math.max(MIN_REFRESH_MS, expiresMono - monotonicNow() - REFRESH_LEAD_MS)
  )
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
 * The retry after a failure is never sooner than the refresh a servable token
 * would already have had. A token no caller can be given earns no such delay.
 */
const retryFloorMs = (): number =>
  !canServeToken() || cachedToken == null
    ? 0
    : cachedToken.expiresMono - monotonicNow() - REFRESH_LEAD_MS

/**
 * Schedule the next handshake after a failed or hung attempt. `scheduleRefresh`
 * only runs on success, so without this the engine would sit idle until a gated
 * call or an app restart.
 */
const scheduleRetryAfterFailure = (): void => {
  armTimer(Math.max(failureBackoffMs(), retryFloorMs()))
}

/** Test-only: expose timing constants used by unit tests. */
export const attestationTimingForTests = {
  CLOCK_SKEW_MS,
  GET_TOKEN_TIMEOUT_MS,
  HANDSHAKE_WATCHDOG_MS,
  FAILURE_BACKOFF_MS,
  MAX_BACKOFF_MS,
  MIN_HANDSHAKE_SPACING_MS,
  MIN_REFRESH_MS,
  REFRESH_LEAD_MS,
  /**
   * Exposes `retryFloorMs` so Phase 5 can catch a mutant that drops the
   * `!canServeToken()` guard. `Math.max(backoff, floor)` hides a negative floor
   * in the timer path; asserting the helper itself is what pins the predicate.
   */
  retryFloorMs
}

/**
 * Whether a late token from a retired attempt is worth taking: only when it
 * outlives what is cached, so the cached expiry never moves backwards. Both
 * values are monotonic deadlines derived from the server's lifetime, so this
 * asks nothing of the device wall clock.
 *
 * Being retired is not evidence the token is worse. A retired attempt is by
 * definition the one that finished last, so its remaining lifetime usually
 * outlives the cached one. What the comparison rules out is a shorter-lived
 * token taking a longer-lived one's place. A tie goes to the arrival (`>=`).
 */
const outlivesCached = (fresh: CachedToken): boolean =>
  cachedToken == null || fresh.expiresMono >= cachedToken.expiresMono

/**
 * How long `runHandshake` must wait before it may start another attempt: the
 * failure backoff, and a floor between handshakes that applies whatever the last
 * one returned. Zero when an attempt may start now.
 */
const handshakeWaitMs = (): number =>
  Math.max(
    0,
    lastFailureAt == null
      ? 0
      : lastFailureAt + failureBackoffMs() - monotonicNow(),
    lastHandshakeAt == null
      ? 0
      : lastHandshakeAt + MIN_HANDSHAKE_SPACING_MS - monotonicNow()
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
    // us, so returning bare would strand the engine until the next gated call.
    armTimer(waitMs)
    return
  }
  lastHandshakeAt = monotonicNow()
  // A handshake whose native call hangs past the watchdog has its `inFlight`
  // lock released so a newer handshake can start. Tag each attempt so a stale
  // one that finally resolves cannot clobber a token a newer handshake already
  // produced - while still accepting a late valid JWT when nothing is cached
  // (the newer attempt may have failed into backoff).
  const attempt: HandshakeAttempt = {
    generation: ++handshakeGeneration,
    usedAttestation: false,
    countedFailure: false
  }
  const handshake: Promise<void> = performHandshake(attempt)
    .then(freshToken => {
      if (freshToken == null) {
        // Terminal: this device cannot attest, so stop the engine rather than
        // waking up forever to ask again. Only the current attempt may say so:
        // a hung `isSupported()` that answers after the watchdog retired it has
        // no standing to retire the engine a live attempt is now driving, and
        // nothing but `resetAttestationForTests` ever clears this flag.
        if (attempt.generation !== handshakeGeneration) return
        unsupported = true
        return
      }
      if (
        attempt.generation !== handshakeGeneration &&
        !outlivesCached(freshToken)
      ) {
        return
      }
      lastFailureAt = undefined
      consecutiveFailures = 0
      cachedToken = freshToken
      console.log('[attestation] handshake ok')
      scheduleRefresh(freshToken.expiresMono)
    })
    .catch((error: unknown) => {
      if (attempt.generation !== handshakeGeneration) {
        // The watchdog counted this attempt while its native call was still
        // outstanding, because a call that may never answer may also have spent
        // the attestation. It has now answered saying it spent nothing, so take
        // that count back - a later attempt's own increment is untouched, which
        // is why this cannot simply reset the counter.
        if (attempt.countedFailure && !attempt.usedAttestation) {
          attempt.countedFailure = false
          consecutiveFailures = Math.max(0, consecutiveFailures - 1)
        }
        return
      }
      lastFailureAt = monotonicNow()
      if (attempt.usedAttestation) {
        consecutiveFailures += 1
        attempt.countedFailure = true
      }
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
    lastFailureAt = monotonicNow()
    if (attempt.usedAttestation) {
      consecutiveFailures += 1
      attempt.countedFailure = true
    }
    // An attempt that never settles leaves nothing else to re-arm the loop.
    scheduleRetryAfterFailure()
  }, HANDSHAKE_WATCHDOG_MS)
}

/**
 * Start the background attestation engine. Kicks off an initial handshake
 * (unless a live token is already cached) without blocking; the engine then
 * self-reschedules to refresh the token ahead of each expiry.
 *
 * Called from `initInfoServer`, which runs on every network reconnect and not
 * just at boot, so this has to be idempotent: it returns immediately while a
 * token is live, and `runHandshake` single-flights and rate-limits the rest.
 */
export const initAttestation = (): void => {
  if (canServeToken()) return
  runHandshake()
}

/**
 * Return the most recent attestation token for an attestation-gated caller.
 * Resolves immediately with the cached token when one is live. Otherwise it
 * ensures a handshake is running and waits at most `timeoutMs` (default
 * `GET_TOKEN_TIMEOUT_MS`), returning `undefined` on timeout. Callers treat
 * `undefined` as "no token" and let the info server decide (it may still serve
 * a fallback response).
 *
 * A caller that arrives while the engine is backing off returns `undefined`
 * without waiting at all: `runHandshake` declines to start one, so there is
 * nothing to await. That is what keeps a persistently-failing device from adding
 * the wait budget to every gated request.
 *
 * Pass a longer `timeoutMs` for cold-start paths that intentionally budget more
 * time for a first attestation (e.g. getKeys's five-second budget).
 */
export const getAttestationToken = async (
  timeoutMs: number = GET_TOKEN_TIMEOUT_MS
): Promise<string | undefined> => {
  if (canServeToken()) return cachedToken?.token
  runHandshake()
  if (inFlight != null) {
    await Promise.race([inFlight, delay(timeoutMs)])
  }
  return canServeToken() ? cachedToken?.token : undefined
}

/**
 * Headers for a JSON POST to an attestation-gated info-server route: the
 * content type, plus `x-attestation-token` when the engine has a live token.
 * The header is omitted rather than faked when it has none, and the info server
 * decides what an unattested request gets (it may still serve a fallback).
 *
 * Every gated call site goes through here instead of spreading the header
 * itself, so the header name, a second gated header, or the null-handling
 * policy each change in one place. A site that quietly stops sending the token
 * still succeeds locally and only surfaces as a 403 from the server, which is
 * not a regression that announces itself.
 */
export const attestedJsonHeaders = async (): Promise<
  Record<string, string>
> => {
  const attestationToken = await getAttestationToken()
  return {
    'Content-Type': 'application/json',
    ...(attestationToken != null
      ? { 'x-attestation-token': attestationToken }
      : {})
  }
}
