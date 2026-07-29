import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'
import { NativeModules } from 'react-native'

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
const mockClearKey = jest.fn<() => Promise<void>>()
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
  getAttestationToken,
  initAttestation,
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

  const mockSuccessfulHandshake = (expires: number): void => {
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({ challenge: 'chal-1' })
      }
      if (path === 'v1/attest/apple' || path === 'v1/attest/android') {
        return jsonResponse({ token: 'jwt-token', expires })
      }
      throw new Error(`unexpected path ${path}`)
    })
  }

  it('rejects attest responses with a non-finite expires (Task 2.1)', async () => {
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({ challenge: 'chal-1' })
      }
      return jsonResponse({ token: 'jwt-token', expires: 'soon' })
    })

    initAttestation()
    const tokenPromise = getAttestationToken()
    await jest.advanceTimersByTimeAsync(
      attestationTimingForTests.GET_TOKEN_TIMEOUT_MS
    )
    await expect(tokenPromise).resolves.toBeUndefined()
  })

  it('fails the handshake when expires is already past', async () => {
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({ challenge: 'chal-1' })
      }
      return jsonResponse({ token: 'jwt-token', expires: Date.now() - 1 })
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

  it('caches a token when expires is a finite number (Task 2.1)', async () => {
    const expires = Date.now() + 10 * 60 * 1000
    mockSuccessfulHandshake(expires)

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
    mockSuccessfulHandshake(Date.now() + 10 * 60 * 1000)
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
    const expires = Date.now() + 10 * 60 * 1000
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({ challenge: 'chal-late' })
      }
      if (path === 'v1/attest/apple' || path === 'v1/attest/android') {
        return jsonResponse({ token: 'late-jwt', expires })
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
    const expires = Date.now() + 10 * 60 * 1000
    mockSuccessfulHandshake(expires)
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
    const expires =
      Date.now() + attestationTimingForTests.REFRESH_LEAD_MS + REFRESH_UNTIL_MS
    mockSuccessfulHandshake(expires)

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
          expires: Date.now() + 10 * 60 * 1000
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
    mockSuccessfulHandshake(Date.now() + 10 * 60 * 1000)
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
    mockSuccessfulHandshake(Date.now() + 30 * 1000)

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
    const expires = Date.now() + 60 * 60 * 1000
    let rejectChallenge: ((error: Error) => void) | undefined
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return await new Promise<MockResponse>((resolve, reject) => {
          rejectChallenge = reject
        })
      }
      if (path === 'v1/attest/apple' || path === 'v1/attest/android') {
        return jsonResponse({ token: 'jwt-long', expires })
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
    mockSuccessfulHandshake(Date.now() + 10 * 60 * 1000)
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
    const { MIN_HANDSHAKE_SPACING_MS } = attestationTimingForTests
    const POLL_MS = 3000
    const WINDOW_MS = 5 * 60 * 1000
    // A lifetime this short is one operator edit away - the info server reads it
    // from a synced config doc - and it leaves most of every cycle with nothing
    // cached. A success clears the failure backoff, so nothing else holds the
    // gated path back.
    mockSuccessfulHandshake(Date.now() + 10 * 1000)

    initAttestation()
    await flush()

    const gated: Array<Promise<string | undefined>> = []
    for (let elapsed = 0; elapsed < WINDOW_MS; elapsed += POLL_MS) {
      gated.push(getAttestationToken())
      await jest.advanceTimersByTimeAsync(POLL_MS)
    }
    await flush()
    await Promise.all(gated)

    // Handshakes should track the spacing floor, not the poll rate.
    const pollCount = WINDOW_MS / POLL_MS
    const spacingCount = WINDOW_MS / MIN_HANDSHAKE_SPACING_MS
    expect(mockGetAttestation.mock.calls.length).toBeLessThanOrEqual(
      spacingCount + 1
    )
    expect(mockGetAttestation.mock.calls.length).toBeLessThan(pollCount / 4)
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
            expires: Date.now() + 60 * 60 * 1000
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

    it('fails into backoff instead of re-attesting when expires is past', async () => {
      const { MAX_BACKOFF_MS } = attestationTimingForTests
      mockAssertMint({ token: 'jwt-stale', expires: Date.now() - 1 })

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

    it('fails into backoff instead of re-attesting when expires is malformed', async () => {
      mockAssertMint({ token: 'jwt-stale', expires: 'soon' })

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
            expires: Date.now() + 10 * 60 * 1000
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

    it('re-attests when the native signature reports no usable key', async () => {
      mockGenerateAssertion.mockRejectedValue(
        Object.assign(new Error('no key'), { code: 'noKey' })
      )
      mockSignChallenge.mockRejectedValue(
        Object.assign(new Error('no key'), { code: 'noKey' })
      )
      mockSuccessfulHandshake(Date.now() + 10 * 60 * 1000)

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
            expires: Date.now() + 10 * 60 * 1000
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
  })
})
