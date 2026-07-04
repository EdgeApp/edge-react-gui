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
    await Promise.resolve()
    await Promise.resolve()

    // Watchdog fires and clears the lock.
    await jest.advanceTimersByTimeAsync(
      attestationTimingForTests.HANDSHAKE_WATCHDOG_MS
    )

    // A subsequent attempt can start after the lock is released.
    const expires = Date.now() + 10 * 60 * 1000
    mockGetAttestation.mockResolvedValue({
      keyId: 'key2',
      attestation: 'att2',
      bundleId: 'co.edgesecure.app'
    })
    mockSuccessfulHandshake(expires)

    const tokenPromise = getAttestationToken()
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    await expect(tokenPromise).resolves.toBe('jwt-token')
  })

  it('keeps a late valid JWT when a post-watchdog retry fails into backoff', async () => {
    const flush = async (): Promise<void> => {
      for (let i = 0; i < 10; i++) await Promise.resolve()
    }

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

    // Handshake B fails quickly at the challenge step and enters backoff.
    mockFetchInfo.mockImplementation(async (path: string) => {
      if (path === 'v1/attest/challenge') {
        return jsonResponse({}, false, 500)
      }
      throw new Error(`unexpected path ${path}`)
    })
    const failedPromise = getAttestationToken()
    await jest.advanceTimersByTimeAsync(
      attestationTimingForTests.GET_TOKEN_TIMEOUT_MS
    )
    await expect(failedPromise).resolves.toBeUndefined()

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
})
