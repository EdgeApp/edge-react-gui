import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'
import { NativeModules, Platform } from 'react-native'

interface MockResponse {
  ok: boolean
  status: number
  json: () => Promise<unknown>
  text: () => Promise<string>
}

const mockFetchInfo =
  jest.fn<(path: string, opts?: RequestInit) => Promise<MockResponse>>()

jest.mock('../../util/network', () => ({
  fetchInfo: async (...args: unknown[]) =>
    await mockFetchInfo(...(args as [string]))
}))

const mockShowButtonsModal = jest.fn(async () => 'ok')

jest.mock('../../components/modals/ButtonsModal', () => ({
  showButtonsModal: async (...args: unknown[]) =>
    await mockShowButtonsModal(...(args as []))
}))

const mockIsSupported = jest.fn<() => Promise<boolean>>()
const mockGetAttestation = jest.fn<
  (challenge: string) => Promise<{
    keyId?: string
    attestation?: string
    bundleId?: string
    certChain?: string[]
  }>
>()
const mockGenerateAssertion = jest.fn<
  (challenge: string) => Promise<{
    keyId?: string
    assertion?: string
    bundleId?: string
  }>
>()
const mockClearKey = jest.fn<(keyId?: string) => Promise<void>>()
const mockSignChallenge =
  jest.fn<
    (challenge: string) => Promise<{ keyId?: string; signature?: string }>
  >()

NativeModules.EdgeAttestation = {
  isSupported: mockIsSupported,
  getAttestation: mockGetAttestation,
  generateAssertion: mockGenerateAssertion,
  signChallenge: mockSignChallenge,
  clearKey: mockClearKey
}

// Import after mocks so the module binds to mockFetchInfo / NativeModules.
const {
  attestationTimingForTests,
  attestedJsonHeaders,
  getAttestationToken,
  initAttestation,
  onAttestationToken,
  resetAttestationForTests
} = require('../../util/attestation')

/**
 * Drain the handshake promise chain without advancing the fake clock. A
 * handshake is a long series of awaits (challenge, assertion, second challenge,
 * native attestation, token POST, then the commit/schedule tail), so drain
 * generously: a short drain samples a half-finished handshake and reads as
 * "nothing happened".
 */
const flush = async (): Promise<void> => {
  for (let i = 0; i < 100; i++) await Promise.resolve()
}

const jsonResponse = (body: unknown, ok = true, status = 200): MockResponse => {
  const response: MockResponse = {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body)
  }
  return response
}

describe('attestation engine', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    resetAttestationForTests()
    mockFetchInfo.mockReset()
    mockIsSupported.mockReset()
    mockGetAttestation.mockReset()
    mockGenerateAssertion.mockReset()
    mockSignChallenge.mockReset()
    mockClearKey.mockReset()
    mockShowButtonsModal.mockReset()
    mockShowButtonsModal.mockResolvedValue('ok')
    mockIsSupported.mockResolvedValue(true)
    mockGetAttestation.mockResolvedValue({
      keyId: 'key',
      attestation: 'att',
      bundleId: 'co.edgesecure.app'
    })
    // Default: no stored key yet, so the assert fast path fails over to full
    // attestation (matches first-run behavior on both platforms).
    mockGenerateAssertion.mockRejectedValue(new Error('noKey'))
    mockSignChallenge.mockRejectedValue(new Error('noKey'))
    mockClearKey.mockResolvedValue(undefined)
  })

  afterEach(() => {
    resetAttestationForTests()
    jest.useRealTimers()
  })

  const mockSuccessfulHandshake = (expiresIn = 600): void => {
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({ challenge: 'chal-1' })
      }
      if (path === 'v1/attest/apple' || path === 'v1/attest/android') {
        return jsonResponse({ token: 'jwt-token', expiresIn })
      }
      throw new Error(`unexpected path ${path}`)
    })
  }

  it('rejects attest responses with a non-finite expiresIn', async () => {
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({ challenge: 'chal-1' })
      }
      return jsonResponse({ token: 'jwt-token', expiresIn: 'soon' })
    })

    initAttestation()
    const tokenPromise = getAttestationToken()
    await jest.advanceTimersByTimeAsync(
      attestationTimingForTests.GET_TOKEN_TIMEOUT_MS
    )
    await expect(tokenPromise).resolves.toBeUndefined()
  })

  it('fails the handshake when expiresIn is at or under the clock skew', async () => {
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({ challenge: 'chal-1' })
      }
      return jsonResponse({ token: 'jwt-token', expiresIn: 1 })
    })

    initAttestation()
    const tokenPromise = getAttestationToken()
    await jest.advanceTimersByTimeAsync(
      attestationTimingForTests.GET_TOKEN_TIMEOUT_MS
    )
    await expect(tokenPromise).resolves.toBeUndefined()
    const callsAfterMint = mockFetchInfo.mock.calls.length

    // Caching an unusable token would leave the engine in its success state,
    // free to hand the next caller straight back into another handshake.
    await expect(getAttestationToken()).resolves.toBeUndefined()
    await flush()
    expect(mockFetchInfo.mock.calls.length).toBe(callsAfterMint)
  })

  it('caches a token when expiresIn is a positive finite number', async () => {
    mockSuccessfulHandshake(600)

    initAttestation()
    const tokenPromise = getAttestationToken()
    // Flush the in-flight handshake promise chain.
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    await expect(tokenPromise).resolves.toBe('jwt-token')
  })

  it('releases a hung handshake after the watchdog so a later attempt can succeed (Task 2.2)', async () => {
    mockGetAttestation.mockImplementation(
      async () => await new Promise(() => {}) // never settles
    )
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({ challenge: 'chal-hung' })
      }
      throw new Error(`unexpected path ${path}`)
    })

    initAttestation()
    // Let the hung handshake start and grab the lock.
    await flush()

    // Watchdog fires and clears the lock.
    await jest.advanceTimersByTimeAsync(
      attestationTimingForTests.HANDSHAKE_WATCHDOG_MS
    )

    // A subsequent attempt can start once the lock is released and the hang's
    // backoff has elapsed.
    mockGetAttestation.mockResolvedValue({
      keyId: 'key2',
      attestation: 'att2',
      bundleId: 'co.edgesecure.app'
    })
    mockSuccessfulHandshake(600)
    await jest.advanceTimersByTimeAsync(
      attestationTimingForTests.FAILURE_BACKOFF_MS
    )
    await flush()

    await expect(getAttestationToken()).resolves.toBe('jwt-token')
  })

  it('keeps a late valid JWT when a post-watchdog retry fails into backoff', async () => {
    // Handshake A hangs in native attestation after fetching a challenge.
    let resolveHungAttestation:
      | ((value: {
          keyId?: string
          attestation?: string
          bundleId?: string
        }) => void)
      | undefined
    mockGetAttestation.mockImplementation(
      async () =>
        await new Promise(resolve => {
          resolveHungAttestation = resolve
        })
    )
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({ challenge: 'chal-hung' })
      }
      throw new Error(`unexpected path ${path}`)
    })

    initAttestation()
    await flush()
    expect(resolveHungAttestation).toBeDefined()

    // Watchdog releases A's lock so a newer attempt can start.
    await jest.advanceTimersByTimeAsync(
      attestationTimingForTests.HANDSHAKE_WATCHDOG_MS
    )

    // Handshake B starts once the hang's backoff elapses, then fails quickly at
    // the challenge step and enters a backoff of its own.
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({}, false, 500)
      }
      throw new Error(`unexpected path ${path}`)
    })
    await jest.advanceTimersByTimeAsync(
      attestationTimingForTests.FAILURE_BACKOFF_MS
    )
    await flush()
    await expect(getAttestationToken()).resolves.toBeUndefined()

    // A finally completes with a valid JWT after B has entered backoff. The
    // generation guard must still accept it because nothing fresher is cached.
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({ challenge: 'chal-late' })
      }
      if (path === 'v1/attest/apple' || path === 'v1/attest/android') {
        return jsonResponse({ token: 'late-jwt', expiresIn: 600 })
      }
      throw new Error(`unexpected path ${path}`)
    })
    resolveHungAttestation?.({
      keyId: 'key-late',
      attestation: 'att-late',
      bundleId: 'co.edgesecure.app'
    })
    await flush()

    // During B's backoff window, callers still get A's late token.
    await expect(getAttestationToken()).resolves.toBe('late-jwt')
  })

  it('suppresses retries during the failure backoff window (Task 2.3)', async () => {
    // First handshake fails at the challenge step.
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({}, false, 500)
      }
      throw new Error(`unexpected path ${path}`)
    })

    initAttestation()
    const firstPromise = getAttestationToken()
    await jest.advanceTimersByTimeAsync(
      attestationTimingForTests.GET_TOKEN_TIMEOUT_MS
    )
    await expect(firstPromise).resolves.toBeUndefined()

    const callsAfterFailure = mockFetchInfo.mock.calls.length

    // A subsequent call during the backoff window must not start a new
    // handshake and must return immediately without the 3s wait.
    const backoffPromise = getAttestationToken()
    await Promise.resolve()
    await expect(backoffPromise).resolves.toBeUndefined()
    expect(mockFetchInfo.mock.calls.length).toBe(callsAfterFailure)

    // After the backoff elapses, a handshake can succeed again.
    mockSuccessfulHandshake(600)
    await jest.advanceTimersByTimeAsync(
      attestationTimingForTests.FAILURE_BACKOFF_MS
    )

    const retryPromise = getAttestationToken()
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    await expect(retryPromise).resolves.toBe('jwt-token')
  })

  it('retries a failed proactive refresh after the backoff without a gated call', async () => {
    // First handshake succeeds with a token that refreshes in
    // `REFRESH_UNTIL_MS` - comfortably past `MIN_REFRESH_MS`, so the floor
    // does not decide this schedule.
    const REFRESH_UNTIL_MS = 5 * 60 * 1000
    mockSuccessfulHandshake(
      (attestationTimingForTests.REFRESH_LEAD_MS + REFRESH_UNTIL_MS) / 1000
    )

    initAttestation()
    await flush()
    await expect(getAttestationToken()).resolves.toBe('jwt-token')
    const callsAfterSuccess = mockFetchInfo.mock.calls.length

    // Next proactive refresh fails at the challenge step.
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({}, false, 500)
      }
      throw new Error(`unexpected path ${path}`)
    })
    await jest.advanceTimersByTimeAsync(REFRESH_UNTIL_MS)
    await flush()
    expect(mockFetchInfo.mock.calls.length).toBeGreaterThan(callsAfterSuccess)
    const callsAfterFailedRefresh = mockFetchInfo.mock.calls.length

    // Nothing happens until the backoff has fully elapsed.
    await jest.advanceTimersByTimeAsync(
      attestationTimingForTests.FAILURE_BACKOFF_MS - 1
    )
    await flush()
    expect(mockFetchInfo.mock.calls.length).toBe(callsAfterFailedRefresh)

    // After backoff, the engine retries on its own (no getAttestationToken).
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({ challenge: 'chal-retry' })
      }
      if (path === 'v1/attest/apple' || path === 'v1/attest/android') {
        return jsonResponse({
          token: 'jwt-retried',
          expiresIn: 600
        })
      }
      throw new Error(`unexpected path ${path}`)
    })
    await jest.advanceTimersByTimeAsync(
      attestationTimingForTests.FAILURE_BACKOFF_MS
    )
    await flush()
    expect(mockFetchInfo.mock.calls.length).toBeGreaterThan(
      callsAfterFailedRefresh
    )
    await expect(getAttestationToken()).resolves.toBe('jwt-retried')
  })

  /** Fails before any platform attestation is spent (offline, server down). */
  const mockCheapFailingHandshake = (): void => {
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({}, false, 500)
      }
      throw new Error(`unexpected path ${path}`)
    })
  }

  /** Fails only after the attestation is produced (device rejected). */
  const mockAttestFailingHandshake = (): void => {
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({ challenge: 'chal-rejected' })
      }
      if (path === 'v1/attest/apple' || path === 'v1/attest/android') {
        return jsonResponse({}, false, 403)
      }
      throw new Error(`unexpected path ${path}`)
    })
  }

  it('doubles the retry backoff after each rejected attestation', async () => {
    const { FAILURE_BACKOFF_MS } = attestationTimingForTests
    mockAttestFailingHandshake()

    initAttestation()
    await flush()
    const afterFirst = mockFetchInfo.mock.calls.length
    expect(afterFirst).toBeGreaterThan(0)

    // Second attempt lands one backoff after the first failure.
    await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS)
    await flush()
    const afterSecond = mockFetchInfo.mock.calls.length
    expect(afterSecond).toBeGreaterThan(afterFirst)

    // The third waits two backoffs, so one is not enough.
    await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS)
    await flush()
    expect(mockFetchInfo.mock.calls.length).toBe(afterSecond)

    await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS)
    await flush()
    expect(mockFetchInfo.mock.calls.length).toBeGreaterThan(afterSecond)
  })

  it('keeps retrying every backoff while failures cost no attestation', async () => {
    const { FAILURE_BACKOFF_MS } = attestationTimingForTests
    mockCheapFailingHandshake()

    initAttestation()
    await flush()

    // An offline device must not back off into a half-hour silence: nothing
    // rate-limited was spent, and it may be back on the network any moment.
    for (let i = 0; i < 5; i++) {
      const callsBefore = mockFetchInfo.mock.calls.length
      await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS)
      await flush()
      expect(mockFetchInfo.mock.calls.length).toBeGreaterThan(callsBefore)
    }
  })

  it('does not let a retired attempt replace a longer-lived token', async () => {
    const { FAILURE_BACKOFF_MS, HANDSHAKE_WATCHDOG_MS } =
      attestationTimingForTests
    let resolveHung:
      | ((value: {
          keyId?: string
          attestation?: string
          bundleId?: string
          certChain?: string[]
        }) => void)
      | undefined
    let attestCalls = 0
    mockGetAttestation.mockImplementation(async () => {
      attestCalls += 1
      if (attestCalls === 1) {
        return await new Promise(resolve => {
          resolveHung = resolve
        })
      }
      return {
        keyId: 'key-b',
        attestation: 'att-b',
        bundleId: 'co.edgesecure.app'
      }
    })

    let token = 'jwt-stale'
    // Shorter lifetime for A; B will outlive it. Driven by expiresIn rather than
    // absolute expires, so the comparison is on monotonic deadlines.
    let expiresIn = 300
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({ challenge: 'chal-1' })
      }
      return jsonResponse({ token, expiresIn })
    })

    // Handshake A hangs inside the native attestation, so the watchdog retires
    // it and releases the lock.
    initAttestation()
    await flush()
    expect(resolveHung).toBeDefined()
    await jest.advanceTimersByTimeAsync(HANDSHAKE_WATCHDOG_MS)
    await flush()

    // Handshake B then caches a token that outlives A's by 25 minutes.
    token = 'jwt-fresh'
    expiresIn = 1800
    await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS)
    await flush()
    await expect(getAttestationToken()).resolves.toBe('jwt-fresh')

    // Only now does A answer. Its token is genuine but shorter-lived, so taking
    // B's place would cost callers the longer-lived token.
    token = 'jwt-stale'
    expiresIn = 300
    resolveHung?.({
      keyId: 'key-a',
      attestation: 'att-a',
      bundleId: 'co.edgesecure.app'
    })
    await flush()
    await expect(getAttestationToken()).resolves.toBe('jwt-fresh')
  })

  it('takes a late token that ties the cached one on expiry', async () => {
    const { FAILURE_BACKOFF_MS, HANDSHAKE_WATCHDOG_MS } =
      attestationTimingForTests
    // A tie on monotonic deadline goes to the arrival (`>=`). Both handshakes
    // return the same expiresIn; A settles in the same fake-timer instant as B
    // finished, so the deadlines match and the late token replaces the cached one.
    let resolveHung:
      | ((value: {
          keyId?: string
          attestation?: string
          bundleId?: string
          certChain?: string[]
        }) => void)
      | undefined
    let attestCalls = 0
    mockGetAttestation.mockImplementation(async () => {
      attestCalls += 1
      if (attestCalls === 1) {
        return await new Promise(resolve => {
          resolveHung = resolve
        })
      }
      return {
        keyId: 'key-b',
        attestation: 'att-b',
        bundleId: 'co.edgesecure.app'
      }
    })

    let token = 'jwt-b'
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({ challenge: 'chal-1' })
      }
      return jsonResponse({ token, expiresIn: 600 })
    })

    initAttestation()
    await flush()
    await jest.advanceTimersByTimeAsync(HANDSHAKE_WATCHDOG_MS)
    await flush()
    await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS)
    await flush()
    await expect(getAttestationToken()).resolves.toBe('jwt-b')

    token = 'jwt-a'
    resolveHung?.({
      keyId: 'key-a',
      attestation: 'att-a',
      bundleId: 'co.edgesecure.app'
    })
    await flush()
    await expect(getAttestationToken()).resolves.toBe('jwt-a')
  })

  it('ignores an absolute expiry the server should not be sending', async () => {
    const { REFRESH_LEAD_MS, MIN_REFRESH_MS } = attestationTimingForTests
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({ challenge: 'chal-1' })
      }
      return jsonResponse({
        token: 'jwt-token',
        expiresIn: 600,
        // Deliberately wrong absolute expiry an hour in the past - must be ignored.
        expires: Date.now() - 60 * 60 * 1000
      })
    })

    initAttestation()
    await flush()
    await expect(getAttestationToken()).resolves.toBe('jwt-token')
    mockFetchInfo.mockClear()

    // Refresh is scheduled off expiresIn (600s - 2 min lead = ~8 min), not the
    // stale absolute expires.
    const refreshDelay = Math.max(MIN_REFRESH_MS, 600 * 1000 - REFRESH_LEAD_MS)
    await jest.advanceTimersByTimeAsync(refreshDelay - 1000)
    await flush()
    expect(mockFetchInfo.mock.calls.length).toBe(0)
    await jest.advanceTimersByTimeAsync(2000)
    await flush()
    expect(mockFetchInfo.mock.calls.length).toBeGreaterThan(0)
  })

  it('fails the handshake when the server sends no lifetime', async () => {
    const { FAILURE_BACKOFF_MS } = attestationTimingForTests
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({ challenge: 'chal-1' })
      }
      // Pre-Task-2.1 server shape: absolute expires only.
      return jsonResponse({
        token: 'jwt-token',
        expires: Date.now() + 10 * 60 * 1000
      })
    })

    initAttestation()
    await flush()
    await expect(getAttestationToken()).resolves.toBeUndefined()
    const callsAfterFailure = mockFetchInfo.mock.calls.length

    // Next attempt comes on the backoff, not immediately.
    await expect(getAttestationToken()).resolves.toBeUndefined()
    await flush()
    expect(mockFetchInfo.mock.calls.length).toBe(callsAfterFailure)

    await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS)
    await flush()
    expect(mockFetchInfo.mock.calls.length).toBeGreaterThan(callsAfterFailure)
  })

  it('serves a token on a device whose clock is an hour behind the server', async () => {
    jest.setSystemTime(Date.now() - 3600_000)
    mockSuccessfulHandshake(600)

    initAttestation()
    await flush()
    await expect(getAttestationToken()).resolves.toBe('jwt-token')
  })

  it('ignores a date change entirely', async () => {
    mockSuccessfulHandshake(600)
    initAttestation()
    await flush()
    await expect(getAttestationToken()).resolves.toBe('jwt-token')
    mockFetchInfo.mockClear()

    jest.setSystemTime(Date.now() - 86_400_000)
    await expect(getAttestationToken()).resolves.toBe('jwt-token')
    expect(mockFetchInfo.mock.calls.length).toBe(0)
  })

  it('warns once when the device clock is more than two minutes off', async () => {
    const skewed = new Date(Date.now() - (2 * 60 * 1000 + 1000)).toISOString()
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({ challenge: 'chal-1', serverTime: skewed })
      }
      return jsonResponse({
        token: 'jwt-token',
        expiresIn: 600,
        serverTime: skewed
      })
    })

    initAttestation()
    await flush()
    await expect(getAttestationToken()).resolves.toBe('jwt-token')
    expect(mockShowButtonsModal.mock.calls.length).toBe(1)

    // A second handshake in the same run must not re-prompt.
    mockShowButtonsModal.mockClear()
    await jest.advanceTimersByTimeAsync(
      attestationTimingForTests.MIN_HANDSHAKE_SPACING_MS
    )
    // Force a refresh by advancing to the refresh lead.
    await jest.advanceTimersByTimeAsync(
      600 * 1000 - attestationTimingForTests.REFRESH_LEAD_MS
    )
    await flush()
    expect(mockShowButtonsModal.mock.calls.length).toBe(0)
  })

  it('does not warn for a few seconds of skew', async () => {
    const slightlyOff = new Date(Date.now() - 5 * 1000).toISOString()
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({ challenge: 'chal-1', serverTime: slightlyOff })
      }
      return jsonResponse({
        token: 'jwt-token',
        expiresIn: 600,
        serverTime: slightlyOff
      })
    })

    initAttestation()
    await flush()
    await expect(getAttestationToken()).resolves.toBe('jwt-token')
    expect(mockShowButtonsModal.mock.calls.length).toBe(0)
  })

  it('still schedules from expiresIn when serverTime says the clock is wrong', async () => {
    const { REFRESH_LEAD_MS, MIN_REFRESH_MS } = attestationTimingForTests
    jest.setSystemTime(Date.now() - 3600_000)
    const skewed = new Date(Date.now() + 3600_000).toISOString()
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({ challenge: 'chal-1', serverTime: skewed })
      }
      return jsonResponse({
        token: 'jwt-token',
        expiresIn: 600,
        serverTime: skewed
      })
    })

    initAttestation()
    await flush()
    await expect(getAttestationToken()).resolves.toBe('jwt-token')
    expect(mockShowButtonsModal.mock.calls.length).toBe(1)
    mockFetchInfo.mockClear()

    // Refresh delay is ~8 minutes of monotonic time, independent of the skew.
    const refreshDelay = Math.max(MIN_REFRESH_MS, 600 * 1000 - REFRESH_LEAD_MS)
    await jest.advanceTimersByTimeAsync(refreshDelay - 1000)
    await flush()
    expect(mockFetchInfo.mock.calls.length).toBe(0)
    await jest.advanceTimersByTimeAsync(2000)
    await flush()
    expect(mockFetchInfo.mock.calls.length).toBeGreaterThan(0)
  })

  it('keeps retrying every backoff when native never acquired the lock', async () => {
    const { FAILURE_BACKOFF_MS } = attestationTimingForTests
    mockSuccessfulHandshake(600)
    mockGetAttestation.mockRejectedValue(
      Object.assign(new Error('Timed out waiting for the Keystore lock'), {
        code: 'lockTimeout'
      })
    )

    initAttestation()
    await flush()

    // Contention on the lock means some earlier native call is wedged; doubling
    // the backoff would take a recoverable device off the air for up to
    // MAX_BACKOFF_MS over failures that cost nothing.
    for (let i = 0; i < 5; i++) {
      const callsBefore = mockGetAttestation.mock.calls.length
      await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS)
      await flush()
      expect(mockGetAttestation.mock.calls.length).toBeGreaterThan(callsBefore)
    }
  })

  it('un-counts a watchdog failure that native later says cost nothing', async () => {
    const { FAILURE_BACKOFF_MS, HANDSHAKE_WATCHDOG_MS } =
      attestationTimingForTests
    // The watchdog has to count an outstanding native call as expensive, since a
    // call that may never answer may also have spent the attestation. But the
    // answer can still arrive afterwards: the 90s watchdog starts at the top of
    // the handshake, so a slow challenge fetch leaves Android's 60s lock timeout
    // landing after it. The attempt is retired by then, so without a correction
    // the count stands for a failure that provably cost nothing.
    let rejectLockWait: ((error: Error) => void) | undefined
    mockGetAttestation.mockImplementation(
      async () =>
        await new Promise((_resolve, reject) => {
          rejectLockWait = reject
        })
    )
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({ challenge: 'chal-1' })
      }
      throw new Error(`unexpected path ${path}`)
    })

    initAttestation()
    await flush()

    // Twice, because the backoff is `FAILURE_BACKOFF_MS * 2 ** (count - 1)`:
    // counts of zero and one give the same flat window, so a single uncorrected
    // count is invisible and cannot tell the two behaviours apart.
    for (let round = 0; round < 2; round++) {
      await jest.advanceTimersByTimeAsync(HANDSHAKE_WATCHDOG_MS)
      await flush()
      rejectLockWait?.(
        Object.assign(new Error('Timed out waiting for the Keystore lock'), {
          code: 'lockTimeout'
        })
      )
      await flush()
      if (round === 0) {
        // Let the retry the watchdog scheduled start, and hang again.
        await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS)
        await flush()
      }
    }

    // Corrected, the count is back to zero and one flat window is enough. Left
    // standing, it would be two and this window would pass in silence.
    mockSuccessfulHandshake(600)
    mockGetAttestation.mockResolvedValue({
      keyId: 'key2',
      attestation: 'att2',
      bundleId: 'co.edgesecure.app'
    })
    await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS)
    await flush()
    await expect(getAttestationToken()).resolves.toBe('jwt-token')
  })

  it('keeps a watchdog failure counted when native may have spent quota', async () => {
    const { FAILURE_BACKOFF_MS, HANDSHAKE_WATCHDOG_MS } =
      attestationTimingForTests
    // The mirror of the test above, and the reason the correction cannot simply
    // undo whatever the watchdog counted. iOS raises `timeout` after attestKey
    // was invoked, so Apple may already have counted it; taking that back would
    // under-count real quota burn and keep a rate-limited device re-attesting.
    let rejectNativeCall: ((error: Error) => void) | undefined
    mockGetAttestation.mockImplementation(
      async () =>
        await new Promise((_resolve, reject) => {
          rejectNativeCall = reject
        })
    )
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({ challenge: 'chal-1' })
      }
      throw new Error(`unexpected path ${path}`)
    })

    initAttestation()
    await flush()

    for (let round = 0; round < 2; round++) {
      await jest.advanceTimersByTimeAsync(HANDSHAKE_WATCHDOG_MS)
      await flush()
      rejectNativeCall?.(
        Object.assign(new Error('App Attest attestation timed out'), {
          code: 'timeout'
        })
      )
      await flush()
      if (round === 0) {
        await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS)
        await flush()
      }
    }

    // Two counted failures put the next attempt two windows out, so one window
    // must pass in silence and the gated caller must still get nothing.
    mockSuccessfulHandshake(600)
    mockGetAttestation.mockResolvedValue({
      keyId: 'key2',
      attestation: 'att2',
      bundleId: 'co.edgesecure.app'
    })
    await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS)
    await flush()
    await expect(getAttestationToken()).resolves.toBeUndefined()
  })

  // The bodies below are parsed by the info server with strict cleaners that
  // reject anything else with a 400, so a renamed field or a swapped path breaks
  // attestation outright for the platform in question - and does it silently,
  // since the engine reads a 400 as a failed handshake and simply backs off.
  const captureBodies = (): Map<string, unknown> => {
    const bodies = new Map<string, unknown>()
    mockFetchInfo.mockImplementation(
      async (path: string, opts?: RequestInit) => {
        if (path === 'v1/attest/challenge') {
          return jsonResponse({ challenge: 'chal-1' })
        }
        const raw = opts?.body
        if (typeof raw !== 'string') {
          throw new Error(`expected a JSON string body for ${path}`)
        }
        bodies.set(path, JSON.parse(raw))
        return jsonResponse({
          token: 'jwt-token',
          expiresIn: 600
        })
      }
    )
    return bodies
  }

  it('sends the App Attest fields iOS enrollment and refresh each need', async () => {
    // The Android block below mutates the shared Platform mock. If its
    // afterEach ever stops restoring, a randomized run can land here while
    // OS is still 'android' and these assertions would still pass against
    // whichever path the engine took - unless we pin the platform.
    expect(Platform.OS).toBe('ios')

    const bodies = captureBodies()
    initAttestation()
    await flush()
    await expect(getAttestationToken()).resolves.toBe('jwt-token')
    expect(bodies.get('v1/attest/apple')).toStrictEqual({
      keyId: 'key',
      attestation: 'att',
      bundleId: 'co.edgesecure.app',
      challenge: 'chal-1'
    })

    // Now with a key enrolled, the cheap path takes over.
    mockGenerateAssertion.mockResolvedValue({
      keyId: 'K1',
      assertion: 'assert-1',
      bundleId: 'co.edgesecure.app'
    })
    const refreshed = captureBodies()
    await jest.advanceTimersByTimeAsync(
      600000 - attestationTimingForTests.REFRESH_LEAD_MS
    )
    await flush()
    expect(refreshed.get('v1/attest/apple/assert')).toStrictEqual({
      keyId: 'K1',
      assertion: 'assert-1',
      challenge: 'chal-1'
    })
    // Without the timer advance the assert path is never hit, so a missing
    // advance would leave this map empty and fail here - not silently pass.
    expect(refreshed.has('v1/attest/apple')).toBe(false)
  })

  describe('android', () => {
    // Every other test in this file runs as iOS, because that is what
    // `Platform.OS` reports under jest. Android takes a different native call, a
    // different request path and a different body shape, none of which any test
    // reached before this block.
    // Captured rather than assumed: restoring a hard-coded 'ios' would quietly
    // change the platform for every later case in this file if the preset's
    // default ever moved, and the tests above would still pass while testing
    // something other than what they say.
    const platform = Platform as unknown as { OS: string }
    const originalOS = platform.OS
    beforeEach(() => {
      platform.OS = 'android'
    })
    afterEach(() => {
      platform.OS = originalOS
    })

    it('enrols with a certificate chain, not an App Attest object', async () => {
      expect(Platform.OS).toBe('android')
      mockGetAttestation.mockResolvedValue({ certChain: ['cert-1', 'cert-2'] })
      const bodies = captureBodies()

      initAttestation()
      await flush()
      await expect(getAttestationToken()).resolves.toBe('jwt-token')

      expect(bodies.get('v1/attest/android')).toStrictEqual({
        certChain: ['cert-1', 'cert-2'],
        challenge: 'chal-1'
      })
      expect(bodies.has('v1/attest/apple')).toBe(false)
    })

    it('refreshes by signing the challenge, not by asserting', async () => {
      expect(Platform.OS).toBe('android')
      mockSignChallenge.mockResolvedValue({ keyId: 'K1', signature: 'sig-1' })
      const bodies = captureBodies()

      initAttestation()
      await flush()
      await expect(getAttestationToken()).resolves.toBe('jwt-token')

      expect(bodies.get('v1/attest/android/assert')).toStrictEqual({
        keyId: 'K1',
        signature: 'sig-1',
        challenge: 'chal-1'
      })
      // The local signature was enough, so nothing rate-limited was spent.
      expect(mockGetAttestation.mock.calls.length).toBe(0)
      expect(mockGenerateAssertion.mock.calls.length).toBe(0)
    })
  })

  it('stops serving a token the server has just rejected', async () => {
    const { REFRESH_LEAD_MS } = attestationTimingForTests
    const REFRESH_UNTIL_MS = 5 * 60 * 1000
    mockSuccessfulHandshake((REFRESH_LEAD_MS + REFRESH_UNTIL_MS) / 1000)
    initAttestation()
    await flush()
    await expect(getAttestationToken()).resolves.toBe('jwt-token')

    // The proactive refresh finds the enrolled key rejected, and re-enrolling
    // then fails - so nothing arrives to replace what is cached.
    mockGenerateAssertion.mockResolvedValue({
      keyId: 'K1',
      assertion: 'assert-1',
      bundleId: 'co.edgesecure.app'
    })
    mockSignChallenge.mockResolvedValue({ keyId: 'K1', signature: 'sig-1' })
    mockGetAttestation.mockRejectedValue(new Error('attestation unavailable'))
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({ challenge: 'chal-2' })
      }
      if (path.endsWith('/assert')) return jsonResponse({}, false, 401)
      throw new Error(`unexpected path ${path}`)
    })
    await jest.advanceTimersByTimeAsync(REFRESH_UNTIL_MS)
    await flush()

    // The token has not expired, but the server has called the key that minted
    // it untrusted. Handing it out anyway means every gated caller keeps
    // presenting a credential that is already being refused.
    await expect(getAttestationToken()).resolves.toBeUndefined()
  })

  it('does not spend an attestation for an attempt the watchdog retired', async () => {
    const { HANDSHAKE_WATCHDOG_MS } = attestationTimingForTests
    // The watchdog can fire before the handshake even reaches the native call:
    // everything before it is info-server round trips, and on a bad enough
    // network those alone outlast the 90s window.
    let releaseChallenge: (() => void) | undefined
    let challenges = 0
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        challenges += 1
        if (challenges === 1) {
          await new Promise<void>(resolve => {
            releaseChallenge = resolve
          })
        }
        return jsonResponse({ challenge: 'chal-1' })
      }
      throw new Error(`unexpected path ${path}`)
    })

    initAttestation()
    await flush()
    await jest.advanceTimersByTimeAsync(HANDSHAKE_WATCHDOG_MS)
    await flush()

    // Let the retired attempt run on. It has to stop rather than carry through
    // into the one step that costs rate-limited quota.
    releaseChallenge?.()
    await flush()
    expect(mockGetAttestation.mock.calls.length).toBe(0)
  })

  it('leaves the lock alone when a retired attempt settles under a newer one', async () => {
    const {
      FAILURE_BACKOFF_MS,
      GET_TOKEN_TIMEOUT_MS,
      HANDSHAKE_WATCHDOG_MS,
      MIN_HANDSHAKE_SPACING_MS
    } = attestationTimingForTests
    // Both handshakes hang in the native call, so the first is still unsettled
    // when the second takes the lock.
    const rejecters: Array<(error: Error) => void> = []
    mockGetAttestation.mockImplementation(
      async () =>
        await new Promise((_resolve, reject) => {
          rejecters.push(reject)
        })
    )
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({ challenge: 'chal-1' })
      }
      throw new Error(`unexpected path ${path}`)
    })

    initAttestation()
    await flush()
    await jest.advanceTimersByTimeAsync(HANDSHAKE_WATCHDOG_MS)
    await flush()
    await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS)
    await flush()
    expect(rejecters.length).toBe(2)

    // The first answers at last, while the second still holds the lock.
    rejecters[0](
      Object.assign(new Error('App Attest attestation timed out'), {
        code: 'timeout'
      })
    )
    await flush()

    // Its cleanup must not hand the lock back. Releasing it would let a third
    // handshake start alongside the second, and both would spend an attestation.
    await jest.advanceTimersByTimeAsync(
      FAILURE_BACKOFF_MS + MIN_HANDSHAKE_SPACING_MS
    )
    await flush()
    const gated = getAttestationToken()
    await jest.advanceTimersByTimeAsync(GET_TOKEN_TIMEOUT_MS)
    await expect(gated).resolves.toBeUndefined()
    expect(rejecters.length).toBe(2)
  })

  // Bodies the server should never send, each of which the engine has to treat
  // as a failed handshake. Asserting only that no token comes back is not
  // enough: a non-finite `expiresIn` also produces no token, because every
  // comparison against NaN is false - while `scheduleRefresh` computes NaN,
  // `setTimeout` reads that as zero, and the engine spins as fast as the network
  // answers. What distinguishes the two is whether the failure is *counted*.
  it.each([
    ['a non-string token', () => ({ token: 42, expiresIn: 600 })],
    ['a non-finite expiresIn', () => ({ token: 'jwt', expiresIn: 'soon' })],
    [
      'a missing expiresIn',
      () => ({ token: 'jwt', expires: Date.now() + 600000 })
    ],
    [
      'an expiresIn at or under the clock skew',
      () => ({ token: 'jwt', expiresIn: 1 })
    ]
  ])('treats %s as a failed handshake, not a success', async (_label, body) => {
    const { FAILURE_BACKOFF_MS } = attestationTimingForTests
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({ challenge: 'chal-1' })
      }
      return jsonResponse(body())
    })

    initAttestation()
    await flush()
    expect(mockGetAttestation.mock.calls.length).toBe(1)

    // Each attempt spent an attestation, so the second lands one backoff later
    // and the third two - meaning this window has to pass in silence.
    await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS)
    await flush()
    expect(mockGetAttestation.mock.calls.length).toBe(2)
    await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS)
    await flush()
    expect(mockGetAttestation.mock.calls.length).toBe(2)
  })

  it('stops serving a token inside the clock-skew window', async () => {
    const LIFETIME_MS = 10 * 60 * 1000
    mockSuccessfulHandshake(LIFETIME_MS / 1000)
    initAttestation()
    await flush()
    await expect(getAttestationToken()).resolves.toBe('jwt-token')

    // Refreshes fail from here, so nothing replaces what is cached.
    mockCheapFailingHandshake()
    await jest.advanceTimersByTimeAsync(LIFETIME_MS - 2000)
    await flush()

    // Two seconds of stated life left. The request still has to travel and be
    // verified, so a token this close to the edge arrives expired - and a 403 is
    // worse for the caller than no token, which the info server may still
    // answer with a fallback.
    await expect(getAttestationToken()).resolves.toBeUndefined()
  })

  it('fails a malformed challenge before spending an attestation', async () => {
    // A challenge-less 200 would be POSTed as `undefined`, and on the full
    // attest path native would be asked to attest that - spending rate-limited
    // quota on a request the server is bound to refuse.
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') return jsonResponse({})
      throw new Error(`unexpected path ${path}`)
    })

    initAttestation()
    await flush()
    expect(mockGetAttestation.mock.calls.length).toBe(0)
  })

  it('does not start a second handshake at boot when a token is live', async () => {
    const LIFETIME_MS = 60 * 60 * 1000
    mockSuccessfulHandshake(LIFETIME_MS / 1000)
    initAttestation()
    await flush()
    await expect(getAttestationToken()).resolves.toBe('jwt-token')
    const afterBoot = mockGetAttestation.mock.calls.length

    // Well past the spacing floor, so the live token is the only thing left to
    // stop another handshake. initAttestation runs again on re-login.
    await jest.advanceTimersByTimeAsync(5 * 60 * 1000)
    await flush()
    initAttestation()
    await flush()
    expect(mockGetAttestation.mock.calls.length).toBe(afterBoot)
  })

  it('clears a grown backoff after a success', async () => {
    const { FAILURE_BACKOFF_MS, REFRESH_LEAD_MS } = attestationTimingForTests
    const LIFETIME_MS = 10 * 60 * 1000
    mockAttestFailingHandshake()
    initAttestation()
    await flush()
    await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS)
    await flush()

    // Two rejected attestations, then the server accepts.
    mockSuccessfulHandshake(LIFETIME_MS / 1000)
    await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS * 2)
    await flush()
    await expect(getAttestationToken()).resolves.toBe('jwt-token')

    // The next proactive refresh fails. Counted from a forgotten run this is
    // the first failure and sits one flat backoff out; counted from a
    // remembered one the doubling carries on and this window passes in silence.
    mockAttestFailingHandshake()
    await jest.advanceTimersByTimeAsync(LIFETIME_MS - REFRESH_LEAD_MS)
    await flush()
    const afterFailedRefresh = mockGetAttestation.mock.calls.length
    await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS)
    await flush()
    expect(mockGetAttestation.mock.calls.length).toBeGreaterThan(
      afterFailedRefresh
    )
  })

  it('grows the backoff when the native attestation itself fails', async () => {
    const { FAILURE_BACKOFF_MS } = attestationTimingForTests
    // The counterpart to the test above, and the reason it cannot simply trust
    // any native rejection: iOS reports `timeout` after App Attest was invoked,
    // so Apple may have counted it and the backoff must still grow.
    mockSuccessfulHandshake(600)
    mockGetAttestation.mockRejectedValue(
      Object.assign(new Error('App Attest attestation timed out'), {
        code: 'timeout'
      })
    )

    initAttestation()
    await flush()
    const afterFirst = mockGetAttestation.mock.calls.length

    await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS)
    await flush()
    const afterSecond = mockGetAttestation.mock.calls.length
    expect(afterSecond).toBeGreaterThan(afterFirst)

    // The third attempt waits two backoffs, so one is not enough.
    await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS)
    await flush()
    expect(mockGetAttestation.mock.calls.length).toBe(afterSecond)
  })

  it('treats an unfamiliar native code as expensive and non-transient', async () => {
    const { FAILURE_BACKOFF_MS } = attestationTimingForTests
    // An unknown code is assumed to have spent quota (backoff doubles) and is
    // not treated as a transient signing failure (assert path is not retried
    // without re-attesting).
    mockSuccessfulHandshake(600)
    mockGetAttestation.mockRejectedValue(
      Object.assign(new Error('something new'), { code: 'somethingNew' })
    )

    initAttestation()
    await flush()
    const afterFirst = mockGetAttestation.mock.calls.length
    expect(afterFirst).toBe(1)

    await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS)
    await flush()
    const afterSecond = mockGetAttestation.mock.calls.length
    expect(afterSecond).toBeGreaterThan(afterFirst)

    // Doubled backoff: one more FAILURE_BACKOFF_MS is not enough for a third.
    await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS)
    await flush()
    expect(mockGetAttestation.mock.calls.length).toBe(afterSecond)
  })

  it('treats a native timeout as a plain failure, not an abandoned attempt', async () => {
    const { FAILURE_BACKOFF_MS, HANDSHAKE_WATCHDOG_MS } =
      attestationTimingForTests
    // Native answers at its own 120s bound, below the 150s watchdog, so JS sees
    // a real rejection rather than retiring the attempt and waiting for a late
    // token.
    mockSuccessfulHandshake(600)
    mockGetAttestation.mockImplementation(
      async () =>
        await new Promise((_resolve, reject) => {
          setTimeout(() => {
            reject(
              Object.assign(new Error('App Attest attestation timed out'), {
                code: 'timeout'
              })
            )
          }, 120_000)
        })
    )

    initAttestation()
    await flush()
    const attestPostsBefore = mockFetchInfo.mock.calls.filter(call =>
      ['v1/attest/apple', 'v1/attest/android'].includes(call[0])
    ).length

    await jest.advanceTimersByTimeAsync(120_000)
    await flush()

    // Settled as a counted failure before the watchdog window.
    expect(HANDSHAKE_WATCHDOG_MS).toBeGreaterThan(120_000)
    const callsAfterTimeout = mockGetAttestation.mock.calls.length
    expect(callsAfterTimeout).toBe(1)

    // No late-token path: the failed attempt never POSTed an attestation.
    const attestPostsAfter = mockFetchInfo.mock.calls.filter(call =>
      ['v1/attest/apple', 'v1/attest/android'].includes(call[0])
    ).length
    expect(attestPostsAfter).toBe(attestPostsBefore)

    // Backoff grew once (attestation may have been spent), so the next attempt
    // waits a full FAILURE_BACKOFF_MS from the native rejection.
    await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS - 1)
    await flush()
    expect(mockGetAttestation.mock.calls.length).toBe(callsAfterTimeout)
    await jest.advanceTimersByTimeAsync(1)
    await flush()
    expect(mockGetAttestation.mock.calls.length).toBeGreaterThan(
      callsAfterTimeout
    )
  })

  it('suppresses gated calls for the whole grown backoff', async () => {
    const { FAILURE_BACKOFF_MS } = attestationTimingForTests
    mockAttestFailingHandshake()

    // Two rejected attestations put the next attempt two backoffs out.
    initAttestation()
    await flush()
    await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS)
    await flush()
    const callsAfterSecond = mockFetchInfo.mock.calls.length

    // A gated caller one backoff later - the Banxa order poll runs every 3s -
    // must not start a handshake, and must not wait around for one.
    await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS)
    const gatedPromise = getAttestationToken()
    await flush()
    await expect(gatedPromise).resolves.toBeUndefined()
    expect(mockFetchInfo.mock.calls.length).toBe(callsAfterSecond)
  })

  it('caps the retry backoff so a failing device keeps retrying', async () => {
    const { MAX_BACKOFF_MS } = attestationTimingForTests
    mockAttestFailingHandshake()

    initAttestation()
    await flush()

    // However long the device has been failing, every window of
    // MAX_BACKOFF_MS must still hold an attempt. Uncapped doubling goes
    // quiet for hours instead.
    for (let i = 0; i < 10; i++) {
      const callsBefore = mockFetchInfo.mock.calls.length
      await jest.advanceTimersByTimeAsync(MAX_BACKOFF_MS)
      await flush()
      expect(mockFetchInfo.mock.calls.length).toBeGreaterThan(callsBefore)
    }
  })

  it('retries on its own after a hung handshake trips the watchdog', async () => {
    mockGetAttestation.mockImplementation(
      async () => await new Promise(() => {}) // never settles
    )
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({ challenge: 'chal-hung' })
      }
      throw new Error(`unexpected path ${path}`)
    })

    initAttestation()
    await flush()
    await jest.advanceTimersByTimeAsync(
      attestationTimingForTests.HANDSHAKE_WATCHDOG_MS
    )
    const callsAfterWatchdog = mockFetchInfo.mock.calls.length

    // The hung attempt never settles, so only the watchdog can restart the
    // loop. No gated call here.
    mockGetAttestation.mockResolvedValue({
      keyId: 'key2',
      attestation: 'att2',
      bundleId: 'co.edgesecure.app'
    })
    mockSuccessfulHandshake(600)
    await jest.advanceTimersByTimeAsync(
      attestationTimingForTests.FAILURE_BACKOFF_MS
    )
    await flush()
    expect(mockFetchInfo.mock.calls.length).toBeGreaterThan(callsAfterWatchdog)
    await expect(getAttestationToken()).resolves.toBe('jwt-token')
  })

  it('never schedules a refresh sooner than the floor', async () => {
    const { MIN_REFRESH_MS } = attestationTimingForTests
    // A token lifetime below REFRESH_LEAD_MS is one operator edit away: the
    // info server reads it from a synced config doc. It must not put the
    // engine into a handshake loop.
    mockSuccessfulHandshake(30)

    initAttestation()
    await flush()
    const callsAfterMint = mockFetchInfo.mock.calls.length
    expect(callsAfterMint).toBeGreaterThan(0)

    // Make any further handshake cheap to observe and impossible to loop on.
    mockCheapFailingHandshake()
    await jest.advanceTimersByTimeAsync(MIN_REFRESH_MS - 1)
    await flush()
    expect(mockFetchInfo.mock.calls.length).toBe(callsAfterMint)

    await jest.advanceTimersByTimeAsync(1)
    await flush()
    expect(mockFetchInfo.mock.calls.length).toBeGreaterThan(callsAfterMint)
  })

  it('counts a hang inside the attestation against the backoff', async () => {
    const { FAILURE_BACKOFF_MS, HANDSHAKE_WATCHDOG_MS } =
      attestationTimingForTests
    mockGetAttestation.mockImplementation(
      async () => await new Promise(() => {}) // never settles
    )
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({ challenge: 'chal-hung' })
      }
      throw new Error(`unexpected path ${path}`)
    })

    // First hang: watchdog releases the lock and retries one backoff later.
    initAttestation()
    await flush()
    await jest.advanceTimersByTimeAsync(HANDSHAKE_WATCHDOG_MS)
    await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS)
    await flush()

    // Second hang. The quota is spent whether the native call answers or not,
    // so this backoff must have doubled.
    await jest.advanceTimersByTimeAsync(HANDSHAKE_WATCHDOG_MS)
    await flush()
    const callsAfterSecondHang = mockFetchInfo.mock.calls.length

    await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS)
    await flush()
    expect(mockFetchInfo.mock.calls.length).toBe(callsAfterSecondHang)

    await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS)
    await flush()
    expect(mockFetchInfo.mock.calls.length).toBeGreaterThan(
      callsAfterSecondHang
    )
  })

  it('counts a hang and its late rejection as one failure', async () => {
    const { FAILURE_BACKOFF_MS, HANDSHAKE_WATCHDOG_MS } =
      attestationTimingForTests
    let rejectHungAttestation: ((error: Error) => void) | undefined
    mockGetAttestation.mockImplementation(
      async () =>
        await new Promise((resolve, reject) => {
          rejectHungAttestation = reject
        })
    )
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({ challenge: 'chal-hung' })
      }
      throw new Error(`unexpected path ${path}`)
    })

    initAttestation()
    await flush()
    await jest.advanceTimersByTimeAsync(HANDSHAKE_WATCHDOG_MS)
    expect(rejectHungAttestation).toBeDefined()

    // The watchdog already gave up on this attempt and scheduled a retry one
    // backoff out. Its late rejection is the same failure, so it must not
    // double the wait.
    rejectHungAttestation?.(new Error('attestKey timed out'))
    await flush()
    const callsAfterRejection = mockFetchInfo.mock.calls.length

    await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS)
    await flush()
    expect(mockFetchInfo.mock.calls.length).toBeGreaterThan(callsAfterRejection)
  })

  it('does not pull a live token refresh sooner after a failed attempt', async () => {
    // Handshake A hangs in native attestation after fetching a challenge.
    let resolveHungAttestation:
      | ((value: {
          keyId?: string
          attestation?: string
          bundleId?: string
        }) => void)
      | undefined
    mockGetAttestation.mockImplementation(
      async () =>
        await new Promise(resolve => {
          resolveHungAttestation = resolve
        })
    )
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({ challenge: 'chal-hung' })
      }
      throw new Error(`unexpected path ${path}`)
    })

    initAttestation()
    await flush()

    // Watchdog releases A's lock and arms a retry.
    await jest.advanceTimersByTimeAsync(
      attestationTimingForTests.HANDSHAKE_WATCHDOG_MS
    )

    // Handshake B stalls on its challenge so we control when it fails, while A
    // can still complete with a long-lived token.
    let rejectChallenge: ((error: Error) => void) | undefined
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return await new Promise<MockResponse>((resolve, reject) => {
          rejectChallenge = reject
        })
      }
      if (path === 'v1/attest/apple' || path === 'v1/attest/android') {
        return jsonResponse({ token: 'jwt-long', expiresIn: 3600 })
      }
      throw new Error(`unexpected path ${path}`)
    })
    await jest.advanceTimersByTimeAsync(
      attestationTimingForTests.FAILURE_BACKOFF_MS
    )
    await flush()
    expect(rejectChallenge).toBeDefined()

    // A lands its token first, scheduling a refresh an hour out.
    resolveHungAttestation?.({
      keyId: 'key-late',
      attestation: 'att-late',
      bundleId: 'co.edgesecure.app'
    })
    await flush()
    await expect(getAttestationToken()).resolves.toBe('jwt-long')

    // B then fails. Its backoff retry must not replace A's refresh.
    rejectChallenge?.(new Error('challenge failed'))
    await flush()
    const callsAfterFailure = mockFetchInfo.mock.calls.length

    await jest.advanceTimersByTimeAsync(10 * 60 * 1000)
    await flush()
    expect(mockFetchInfo.mock.calls.length).toBe(callsAfterFailure)
    await expect(getAttestationToken()).resolves.toBe('jwt-long')
  })

  /** Hangs forever inside the native attestation, after fetching a challenge. */
  const mockHangingAttestation = (): void => {
    mockGetAttestation.mockImplementation(
      async () => await new Promise(() => {})
    )
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({ challenge: 'chal-hung' })
      }
      throw new Error(`unexpected path ${path}`)
    })
  }

  it('makes a hang back off gated callers, not just the retry timer', async () => {
    const { HANDSHAKE_WATCHDOG_MS } = attestationTimingForTests
    mockHangingAttestation()

    initAttestation()
    await flush()
    await jest.advanceTimersByTimeAsync(HANDSHAKE_WATCHDOG_MS)
    await flush()
    expect(mockGetAttestation.mock.calls.length).toBe(1)

    // The watchdog counted a burnt attestation, so the backoff has to apply to
    // gated callers too. Recording only the failure count would leave the gate
    // reading a `lastFailureAt` no hang ever set, and every gated call would
    // start a fresh handshake the moment the lock was released.
    await jest.advanceTimersByTimeAsync(1000)
    let settled = false
    const gated = getAttestationToken().then((token: string | undefined) => {
      settled = true
      return token
    })
    await flush()
    expect(mockGetAttestation.mock.calls.length).toBe(1)
    // And it must not wait GET_TOKEN_TIMEOUT_MS to say so.
    expect(settled).toBe(true)
    await expect(gated).resolves.toBeUndefined()
  })

  it('bounds attestations burned while the native call keeps hanging', async () => {
    const { HANDSHAKE_WATCHDOG_MS } = attestationTimingForTests
    mockHangingAttestation()

    initAttestation()
    await flush()

    // Poll like the Banxa order screen for an hour of solid hangs.
    const WINDOW_MS = 60 * 60 * 1000
    const gated: Array<Promise<string | undefined>> = []
    for (let elapsed = 0; elapsed < WINDOW_MS; elapsed += 3000) {
      gated.push(getAttestationToken())
      await jest.advanceTimersByTimeAsync(3000)
    }
    await flush()
    await Promise.all(gated)

    // Without the backoff applying to gated callers this is one attestation per
    // watchdog window; with the doubling backoff it is a handful.
    expect(mockGetAttestation.mock.calls.length).toBeLessThan(
      WINDOW_MS / HANDSHAKE_WATCHDOG_MS / 2
    )
  })

  it('retries after the bridge fails to answer isSupported', async () => {
    mockIsSupported.mockRejectedValue(new Error('native bridge not ready'))

    initAttestation()
    await flush()
    expect(mockIsSupported.mock.calls.length).toBe(1)

    // A rejection is the bridge failing, not the device saying no, so it must
    // not retire the engine.
    mockIsSupported.mockResolvedValue(true)
    mockSuccessfulHandshake(600)
    await jest.advanceTimersByTimeAsync(
      attestationTimingForTests.FAILURE_BACKOFF_MS
    )
    await flush()
    await expect(getAttestationToken()).resolves.toBe('jwt-token')
  })

  it('stops handshaking once the device reports it cannot attest', async () => {
    mockIsSupported.mockResolvedValue(false)

    initAttestation()
    await flush()
    await expect(getAttestationToken()).resolves.toBeUndefined()
    const callsAfterUnsupported = mockIsSupported.mock.calls.length

    // Terminal: no timer should keep waking up to ask a device that will never
    // have an answer.
    await jest.advanceTimersByTimeAsync(60 * 60 * 1000)
    await flush()
    await expect(getAttestationToken()).resolves.toBeUndefined()
    expect(mockIsSupported.mock.calls.length).toBe(callsAfterUnsupported)
  })

  describe('attestedJsonHeaders', () => {
    it('attaches the token every gated call site needs', async () => {
      mockSuccessfulHandshake(600)
      initAttestation()
      await flush()

      await expect(attestedJsonHeaders()).resolves.toEqual({
        'Content-Type': 'application/json',
        'x-attestation-token': 'jwt-token'
      })
    })

    it('omits the header rather than faking one when no token is live', async () => {
      // Terminal `unsupported`: the engine has nothing to offer and never will.
      mockIsSupported.mockResolvedValue(false)
      initAttestation()
      await flush()

      const headers = await attestedJsonHeaders()
      expect(headers).toEqual({ 'Content-Type': 'application/json' })
      expect('x-attestation-token' in headers).toBe(false)
    })
  })

  it('does not retire the engine when a watchdog-retired isSupported finally says no', async () => {
    // Attempt A hangs inside `isSupported()`, the one `undefined` return that
    // can outlive the watchdog (the `EdgeAttestation == null` return is
    // synchronous and settles long before it can fire).
    let answerHungIsSupported: ((value: boolean) => void) | undefined
    mockIsSupported.mockImplementationOnce(
      async () =>
        await new Promise<boolean>(resolve => {
          answerHungIsSupported = resolve
        })
    )

    initAttestation()
    await flush()

    // The watchdog retires A and frees the lock.
    await jest.advanceTimersByTimeAsync(
      attestationTimingForTests.HANDSHAKE_WATCHDOG_MS
    )

    // Attempt B then runs and caches a live token.
    mockIsSupported.mockResolvedValue(true)
    mockSuccessfulHandshake(600)
    await jest.advanceTimersByTimeAsync(
      attestationTimingForTests.FAILURE_BACKOFF_MS
    )
    await flush()
    await expect(getAttestationToken()).resolves.toBe('jwt-token')

    // A finally answers "this device cannot attest". It is a retired attempt,
    // so it has no standing to retire an engine B is now driving - and nothing
    // but `resetAttestationForTests` would ever undo that.
    answerHungIsSupported?.(false)
    await flush()

    const callsBeforeRefresh = mockIsSupported.mock.calls.length

    // The engine must still refresh B's token. Without the generation guard it
    // sits inert here, and every gated call goes out unattested once the cached
    // token expires.
    await jest.advanceTimersByTimeAsync(600 * 1000)
    await flush()
    expect(mockIsSupported.mock.calls.length).toBeGreaterThan(
      callsBeforeRefresh
    )
    await expect(getAttestationToken()).resolves.toBe('jwt-token')
  })

  it('gives a non-servable cache no retry floor (Phase 5 retryFloorMs)', async () => {
    // A token past the skew margin is still sitting in `cachedToken`, but
    // callers must not see it. The retry floor exists to protect a *servable*
    // late token's refresh schedule; without the `!canServeToken()` guard the
    // helper returns a large negative delay instead of zero. Math.max with the
    // backoff hides that in the timer path, so this asserts the helper itself.
    const { CLOCK_SKEW_MS } = attestationTimingForTests
    const lifetimeSec = 30
    mockSuccessfulHandshake(lifetimeSec)

    initAttestation()
    await flush()
    await expect(getAttestationToken()).resolves.toBe('jwt-token')

    await jest.advanceTimersByTimeAsync(lifetimeSec * 1000 - CLOCK_SKEW_MS + 1)
    await flush()
    await expect(getAttestationToken()).resolves.toBeUndefined()
    expect(attestationTimingForTests.retryFloorMs()).toBe(0)
  })

  it('stays armed when a retry tick lands short of the backoff', async () => {
    const { FAILURE_BACKOFF_MS } = attestationTimingForTests
    mockCheapFailingHandshake()

    initAttestation()
    await flush()
    const callsAfterFailure = mockFetchInfo.mock.calls.length

    // The retry is armed for exactly the backoff and the gate measures it
    // against the wall clock, so a backwards clock step (NTP) can make the tick
    // arrive a hair early. Declining it must re-arm, not strand the engine.
    const realNow = Date.now
    const nowSpy = jest.spyOn(Date, 'now')
    nowSpy.mockImplementation(() => realNow() - 1)
    await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS)
    await flush()
    nowSpy.mockRestore()

    await jest.advanceTimersByTimeAsync(FAILURE_BACKOFF_MS)
    await flush()
    expect(mockFetchInfo.mock.calls.length).toBeGreaterThan(callsAfterFailure)
  })

  it('spaces out handshakes when the server mints very short-lived tokens', async () => {
    // Pinned as a literal on purpose. Deriving the bound from the constant under
    // test makes the assertion vacuous exactly when the constant is wrong:
    // at zero, `WINDOW_MS / MIN_HANDSHAKE_SPACING_MS` is Infinity, which every
    // possible count satisfies. Retuning the floor has to change this line.
    const EXPECTED_SPACING_MS = 30 * 1000
    expect(attestationTimingForTests.MIN_HANDSHAKE_SPACING_MS).toBe(
      EXPECTED_SPACING_MS
    )

    const POLL_MS = 3000
    const WINDOW_MS = 5 * 60 * 1000
    // A lifetime this short is one operator edit away - the info server reads it
    // from a synced config doc - and it leaves most of every cycle with nothing
    // cached. A success clears the failure backoff, so nothing else holds the
    // gated path back.
    mockSuccessfulHandshake(10)

    // Timed at the platform attestation rather than the challenge fetch: with no
    // enrolled key each handshake fetches a challenge twice, so challenges do not
    // map one-to-one onto handshakes. This is also the call that spends the
    // rate-limited resource, which is what the floor exists to protect.
    const attestationsAt: number[] = []
    mockGetAttestation.mockImplementation(async () => {
      attestationsAt.push(Date.now())
      return { keyId: 'key', attestation: 'att', bundleId: 'co.edgesecure.app' }
    })

    initAttestation()
    await flush()

    const gated: Array<Promise<string | undefined>> = []
    for (let elapsed = 0; elapsed < WINDOW_MS; elapsed += POLL_MS) {
      gated.push(getAttestationToken())
      await jest.advanceTimersByTimeAsync(POLL_MS)
    }
    await flush()
    await Promise.all(gated)

    // Assert the observed spacing, not just a count. A count bound is also
    // satisfied by the refresh floor on its own, so it would not notice the
    // spacing logic disappearing - which is the whole point of this test.
    expect(attestationsAt.length).toBeGreaterThan(1)
    const gaps = attestationsAt
      .slice(1)
      .map((at, i) => at - attestationsAt[i])
      .sort((a, b) => a - b)
    expect(gaps[0]).toBeGreaterThanOrEqual(EXPECTED_SPACING_MS)
    // And still far below the poll rate, so callers cannot drive the handshake.
    expect(attestationsAt.length).toBeLessThan(WINDOW_MS / POLL_MS / 4)
  })

  describe('a handshake the watchdog has retired', () => {
    /**
     * Handshake A holds an enrolled key and stalls on its assert POST until the
     * watchdog retires it. B then re-enrolls and caches a good token. Only then
     * does A's assert answer 401.
     */
    const runRetiredAssertRejection = async (): Promise<void> => {
      mockGenerateAssertion.mockResolvedValue({
        keyId: 'K1',
        assertion: 'assert-1',
        bundleId: 'co.edgesecure.app'
      })
      mockSignChallenge.mockResolvedValue({ keyId: 'K1', signature: 'sig-1' })

      let answerStalledAssert: ((value: MockResponse) => void) | undefined
      mockFetchInfo.mockImplementation(async (path: string) => {
        if (path === 'v1/attest/challenge') {
          return jsonResponse({ challenge: 'chal-A' })
        }
        if (path.endsWith('/assert')) {
          return await new Promise<MockResponse>(resolve => {
            answerStalledAssert = resolve
          })
        }
        throw new Error(`unexpected path ${path}`)
      })

      initAttestation()
      await flush()
      expect(answerStalledAssert).toBeDefined()

      await jest.advanceTimersByTimeAsync(
        attestationTimingForTests.HANDSHAKE_WATCHDOG_MS
      )
      await flush()

      // B: the server rejects its assertion, so it clears the key, re-attests,
      // and mints a good token.
      mockFetchInfo.mockImplementation(async (path: string) => {
        if (path === 'v1/attest/challenge') {
          return jsonResponse({ challenge: 'chal-B' })
        }
        if (path.endsWith('/assert')) return jsonResponse({}, false, 401)
        if (path === 'v1/attest/apple' || path === 'v1/attest/android') {
          return jsonResponse({
            token: 'jwt-B',
            expiresIn: 3600
          })
        }
        throw new Error(`unexpected path ${path}`)
      })
      await jest.advanceTimersByTimeAsync(
        attestationTimingForTests.FAILURE_BACKOFF_MS
      )
      await flush()
      await expect(getAttestationToken()).resolves.toBe('jwt-B')

      answerStalledAssert?.(jsonResponse({}, false, 401))
      await flush()
    }

    it('does not clear the key a newer handshake enrolled', async () => {
      await runRetiredAssertRejection()
      // B cleared the untrusted key once. A's late 401 says nothing about the
      // key B enrolled afterwards, and wiping it would force a needless
      // re-attestation on the next handshake.
      expect(mockClearKey.mock.calls.length).toBe(1)
    })

    it('does not burn a platform attestation', async () => {
      await runRetiredAssertRejection()
      // Nobody is waiting on A's result, so spending rate-limited quota on it
      // buys nothing.
      expect(mockGetAttestation.mock.calls.length).toBe(1)
    })

    it('leaves the live token alone', async () => {
      await runRetiredAssertRejection()
      await expect(getAttestationToken()).resolves.toBe('jwt-B')
    })
  })

  describe('an unusable token from the assert fast path', () => {
    beforeEach(() => {
      mockGenerateAssertion.mockResolvedValue({
        keyId: 'K1',
        assertion: 'assert-1',
        bundleId: 'co.edgesecure.app'
      })
      mockSignChallenge.mockResolvedValue({ keyId: 'K1', signature: 'sig-1' })
    })

    const mockAssertMint = (body: unknown): void => {
      mockFetchInfo.mockImplementation(async (path: string) => {
        if (path === 'v1/attest/challenge') {
          return jsonResponse({ challenge: 'chal-1' })
        }
        if (path.endsWith('/assert')) return jsonResponse(body)
        if (path === 'v1/attest/apple' || path === 'v1/attest/android') {
          return jsonResponse(body)
        }
        throw new Error(`unexpected path ${path}`)
      })
    }

    it('fails into backoff instead of re-attesting when expiresIn is too short', async () => {
      const { MAX_BACKOFF_MS } = attestationTimingForTests
      mockAssertMint({ token: 'jwt-stale', expiresIn: 1 })

      initAttestation()
      await flush()

      // The assertion itself succeeded and cost nothing rate-limited. A bad mint
      // is a server problem that re-attesting cannot fix, so falling through to
      // a full attestation would only spend quota to hide it - once per backoff
      // window, for as long as the app is open.
      expect(mockGetAttestation.mock.calls.length).toBe(0)
      for (let i = 0; i < 6; i++) {
        await jest.advanceTimersByTimeAsync(MAX_BACKOFF_MS)
        await flush()
      }
      expect(mockGetAttestation.mock.calls.length).toBe(0)
    })

    it('fails into backoff instead of re-attesting when expiresIn is malformed', async () => {
      mockAssertMint({ token: 'jwt-stale', expiresIn: 'soon' })

      initAttestation()
      await flush()
      expect(mockGetAttestation.mock.calls.length).toBe(0)
    })

    it.each([500, 502, 503, 429])(
      'keeps the enrolled key when the assert endpoint answers %i',
      async (status: number) => {
        mockFetchInfo.mockImplementation(async (path: string) => {
          if (path === 'v1/attest/challenge') {
            return jsonResponse({ challenge: 'chal-1' })
          }
          if (path.endsWith('/assert')) return jsonResponse({}, false, status)
          throw new Error(`unexpected path ${path}`)
        })

        initAttestation()
        await flush()

        // The server failed to answer, or throttled us - neither is a judgement
        // on the key. Discarding it here would have the whole fleet re-attest
        // during an info-server outage, which is a fleet-wide run at the
        // platform rate limits caused by something that fixes itself.
        expect(mockClearKey.mock.calls.length).toBe(0)
        expect(mockGetAttestation.mock.calls.length).toBe(0)
      }
    )

    it('re-attests when the server judges the key untrusted', async () => {
      // The contrast case: 4xx means the server looked at the key and said no.
      mockFetchInfo.mockImplementation(async (path: string) => {
        if (path === 'v1/attest/challenge') {
          return jsonResponse({ challenge: 'chal-1' })
        }
        if (path.endsWith('/assert')) return jsonResponse({}, false, 403)
        if (path === 'v1/attest/apple' || path === 'v1/attest/android') {
          return jsonResponse({
            token: 'jwt-reattested',
            expiresIn: 600
          })
        }
        throw new Error(`unexpected path ${path}`)
      })

      initAttestation()
      await flush()
      expect(mockClearKey.mock.calls.length).toBe(1)
      await expect(getAttestationToken()).resolves.toBe('jwt-reattested')
    })

    it('does not re-attest when the native signature times out', async () => {
      const timeout = Object.assign(new Error('assertion timed out'), {
        code: 'timeout'
      })
      mockGenerateAssertion.mockRejectedValue(timeout)
      mockSignChallenge.mockRejectedValue(timeout)
      mockFetchInfo.mockImplementation(async (path: string) => {
        if (path === 'v1/attest/challenge') {
          return jsonResponse({ challenge: 'chal-1' })
        }
        throw new Error(`unexpected path ${path}`)
      })

      initAttestation()
      await flush()

      // A timeout says nothing about whether the key can sign, so the cheap path
      // deserves another try rather than a rate-limited attestation.
      expect(mockGetAttestation.mock.calls.length).toBe(0)
    })

    it('does not re-attest when Android cannot get the Keystore lock', async () => {
      // Android's own code for the same idea, reported when `tryLock` gives up.
      // It has to be transient here too: escalating would spend an attestation
      // to replace a key that signs perfectly well and was merely contended.
      const lockTimeout = Object.assign(
        new Error('Timed out waiting for the Keystore lock'),
        { code: 'lockTimeout' }
      )
      mockGenerateAssertion.mockRejectedValue(lockTimeout)
      mockSignChallenge.mockRejectedValue(lockTimeout)
      mockFetchInfo.mockImplementation(async (path: string) => {
        if (path === 'v1/attest/challenge') {
          return jsonResponse({ challenge: 'chal-1' })
        }
        throw new Error(`unexpected path ${path}`)
      })

      initAttestation()
      await flush()

      expect(mockGetAttestation.mock.calls.length).toBe(0)
    })

    it('re-attests when the native signature reports no usable key', async () => {
      mockGenerateAssertion.mockRejectedValue(
        Object.assign(new Error('no key'), { code: 'noKey' })
      )
      mockSignChallenge.mockRejectedValue(
        Object.assign(new Error('no key'), { code: 'noKey' })
      )
      mockSuccessfulHandshake(600)

      initAttestation()
      await flush()
      expect(mockGetAttestation.mock.calls.length).toBe(1)
      await expect(getAttestationToken()).resolves.toBe('jwt-token')
    })

    it('still re-attests when the server rejects the assertion', async () => {
      // The contrast case: a rejection *is* about the key, so re-enrolling is
      // the right answer and the fast path must still fall through.
      mockFetchInfo.mockImplementation(async (path: string) => {
        if (path === 'v1/attest/challenge') {
          return jsonResponse({ challenge: 'chal-1' })
        }
        if (path.endsWith('/assert')) return jsonResponse({}, false, 401)
        if (path === 'v1/attest/apple' || path === 'v1/attest/android') {
          return jsonResponse({
            token: 'jwt-reattested',
            expiresIn: 600
          })
        }
        throw new Error(`unexpected path ${path}`)
      })

      initAttestation()
      await flush()
      expect(mockClearKey.mock.calls.length).toBe(1)
      expect(mockGetAttestation.mock.calls.length).toBe(1)
      await expect(getAttestationToken()).resolves.toBe('jwt-reattested')
    })

    it('names the rejected key when asking native to clear it', async () => {
      mockGenerateAssertion.mockResolvedValue({
        keyId: 'key-rejected',
        assertion: 'assertion'
      })
      mockSignChallenge.mockResolvedValue({
        keyId: 'key-rejected',
        signature: 'signature'
      })
      mockFetchInfo.mockImplementation(async (path: string) => {
        if (path === 'v1/attest/challenge') {
          return jsonResponse({ challenge: 'chal-1' })
        }
        if (path.endsWith('/assert')) return jsonResponse({}, false, 401)
        if (path === 'v1/attest/apple' || path === 'v1/attest/android') {
          return jsonResponse({
            token: 'jwt-reattested',
            expiresIn: 600
          })
        }
        throw new Error(`unexpected path ${path}`)
      })

      initAttestation()
      await flush()

      // Native can sit on this call for a long time behind a slow key
      // operation. Passing the id scopes the delete to the key the server
      // actually refused, so it cannot take out a replacement a newer handshake
      // enrolled while it waited.
      expect(mockClearKey.mock.calls[0]).toStrictEqual(['key-rejected'])
    })
  })

  describe('onAttestationToken', () => {
    it('fires with the JWT after a successful handshake', async () => {
      const listener = jest.fn<(token: string | undefined) => void>()
      onAttestationToken(listener)
      // Sync emit of the current (empty) cache on subscribe:
      expect(listener.mock.calls).toEqual([[undefined]])
      listener.mockClear()
      mockSuccessfulHandshake()
      initAttestation()
      await flush()

      expect(listener.mock.calls).toEqual([['jwt-token']])
    })

    it('fires with undefined when an assertion is rejected', async () => {
      const { REFRESH_LEAD_MS } = attestationTimingForTests
      const REFRESH_UNTIL_MS = 5 * 60 * 1000
      const listener = jest.fn<(token: string | undefined) => void>()
      onAttestationToken(listener)
      listener.mockClear()
      mockSuccessfulHandshake((REFRESH_LEAD_MS + REFRESH_UNTIL_MS) / 1000)
      initAttestation()
      await flush()
      expect(listener.mock.calls).toEqual([['jwt-token']])
      listener.mockClear()

      mockGenerateAssertion.mockResolvedValue({
        keyId: 'K1',
        assertion: 'assert-1',
        bundleId: 'co.edgesecure.app'
      })
      mockSignChallenge.mockResolvedValue({ keyId: 'K1', signature: 'sig-1' })
      mockGetAttestation.mockRejectedValue(new Error('attestation unavailable'))
      mockFetchInfo.mockImplementation(async (path: string) => {
        if (path === 'v1/attest/challenge') {
          return jsonResponse({ challenge: 'chal-2' })
        }
        if (path.endsWith('/assert')) return jsonResponse({}, false, 401)
        throw new Error(`unexpected path ${path}`)
      })
      await jest.advanceTimersByTimeAsync(REFRESH_UNTIL_MS)
      await flush()

      expect(listener.mock.calls).toContainEqual([undefined])
    })

    it('fires with undefined when a cached token becomes unservable', async () => {
      // Refresh is armed while the token is still servable, and a failed
      // refresh then waits out FAILURE_BACKOFF_MS. Listeners must still drop
      // the JWT at the skew window - not whenever that later tick happens.
      const { CLOCK_SKEW_MS, FAILURE_BACKOFF_MS, MIN_REFRESH_MS } =
        attestationTimingForTests
      const lifetimeMs = MIN_REFRESH_MS + CLOCK_SKEW_MS + 10 * 1000
      const listener = jest.fn<(token: string | undefined) => void>()
      onAttestationToken(listener)
      listener.mockClear()
      mockSuccessfulHandshake(lifetimeMs / 1000)
      initAttestation()
      await flush()
      expect(listener.mock.calls).toEqual([['jwt-token']])
      listener.mockClear()

      mockCheapFailingHandshake()
      await jest.advanceTimersByTimeAsync(MIN_REFRESH_MS)
      await flush()
      // Still inside the servable window, so the failure path must not clear.
      expect(listener.mock.calls).toEqual([])
      await expect(getAttestationToken()).resolves.toBe('jwt-token')

      // Cross the skew window, but stay well short of the failure backoff.
      await jest.advanceTimersByTimeAsync(CLOCK_SKEW_MS + 10 * 1000)
      await flush()
      expect(CLOCK_SKEW_MS + 10 * 1000).toBeLessThan(FAILURE_BACKOFF_MS)
      expect(listener.mock.calls).toEqual([[undefined]])
      await expect(getAttestationToken()).resolves.toBeUndefined()
    })

    it('stops notifying after unsubscribe', async () => {
      const { REFRESH_LEAD_MS } = attestationTimingForTests
      const REFRESH_UNTIL_MS = 5 * 60 * 1000
      const listener = jest.fn<(token: string | undefined) => void>()
      const stillListening = jest.fn<(token: string | undefined) => void>()
      const unsubscribe = onAttestationToken(listener)
      onAttestationToken(stillListening)
      listener.mockClear()
      stillListening.mockClear()

      mockSuccessfulHandshake((REFRESH_LEAD_MS + REFRESH_UNTIL_MS) / 1000)
      initAttestation()
      await flush()
      expect(listener.mock.calls).toEqual([['jwt-token']])
      expect(stillListening.mock.calls).toEqual([['jwt-token']])
      listener.mockClear()
      stillListening.mockClear()
      unsubscribe()

      mockGenerateAssertion.mockResolvedValue({
        keyId: 'K1',
        assertion: 'assert-1',
        bundleId: 'co.edgesecure.app'
      })
      mockSignChallenge.mockResolvedValue({ keyId: 'K1', signature: 'sig-1' })
      mockGetAttestation.mockRejectedValue(new Error('attestation unavailable'))
      mockFetchInfo.mockImplementation(async (path: string) => {
        if (path === 'v1/attest/challenge') {
          return jsonResponse({ challenge: 'chal-2' })
        }
        if (path.endsWith('/assert')) return jsonResponse({}, false, 401)
        throw new Error(`unexpected path ${path}`)
      })
      await jest.advanceTimersByTimeAsync(REFRESH_UNTIL_MS)
      await flush()

      expect(stillListening.mock.calls).toContainEqual([undefined])
      expect(listener.mock.calls).toEqual([])
    })
  })
})
