import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'

import type * as ConfigModule from '../../config'
import type * as KeysModule from '../../keys'
import type * as PluginMapsModule from '../../pluginMaps'
import type * as KeysStore from '../../util/keysStore'

// Controlled baked-in halves so isolateModules gets deterministic KEYS/CONFIG.
jest.mock(
  '../../../config.json',
  () => ({
    APP_CONFIG: 'edge',
    USE_FAKE_CORE: false,
    POSTHOG_API_HOST: 'https://app.posthog.com',
    YOLO_USERNAME: 'baked-yolo',
    corePlugins: {},
    swapPlugins: {},
    guiApiKeys: {},
    rampPlugins: {}
  }),
  { virtual: true }
)

jest.mock(
  '../../../keys.json',
  () => ({
    EDGE_API_KEY: 'test-api-key',
    EDGE_API_SECRET: '0123456789abcdef0123456789abcdef',
    SENTRY_DSN_URL: 'https://baked.sentry',
    // Flat global keys (keys.json is the local global-keys set):
    AZTECO_API_KEY: 'baked-azteco',
    STAKEKIT_API_KEY: 'baked-stakekit',
    POSTHOG_API_KEY: 'baked-posthog',
    guiApiKeys: {
      moonpay: 'baked-moonpay'
    },
    rampPlugins: {}
  }),
  { virtual: true }
)

const mockInitDeviceSettings = jest.fn(async (..._args: unknown[]) => {})
const mockAwaitDeviceSettingsDisk = jest.fn(async (..._args: unknown[]) => {})
interface MockCacheEntry {
  keys: unknown
  fetchedAt: number
  assuranceLevel: string
  attested?: boolean
}
const mockGetKeysCache = jest.fn(() => undefined as MockCacheEntry | undefined)
const mockWriteKeysCache = jest.fn(async (_entry: MockCacheEntry) => {})

// Stands in for the in-memory settings copy, where a write can be read back
// before it reaches disk:
const useLiveCache = (
  initial?: MockCacheEntry
): { current: MockCacheEntry | undefined } => {
  const cache = { current: initial }
  mockGetKeysCache.mockImplementation(() => cache.current)
  mockWriteKeysCache.mockImplementation(async entry => {
    cache.current = entry
  })
  return cache
}

jest.mock('../../actions/DeviceSettingsActions', () => ({
  initDeviceSettings: async (...args: unknown[]) => {
    await mockInitDeviceSettings(...args)
  },
  awaitDeviceSettingsDisk: async (...args: unknown[]) => {
    await mockAwaitDeviceSettingsDisk(...args)
  },
  getKeysCache: () => mockGetKeysCache(),
  writeKeysCache: async (...args: unknown[]) => {
    await mockWriteKeysCache(...(args as [MockCacheEntry]))
  }
}))

const mockFetchRemoteKeys = jest.fn<
  (opts: unknown) => Promise<{
    keys: Record<string, unknown>
    assuranceLevel?: string
  }>
>()

// Stands in for the real error class. Defined once out here so the copy that
// `keysStore` checks with `instanceof` inside each isolated module registry is
// the same one the tests construct.
class MockRemoteKeysError extends Error {
  readonly status: number
  readonly serverDate: string | undefined

  constructor(status: number, serverDate?: string) {
    super(`fetchRemoteKeys ${status}`)
    this.status = status
    this.serverDate = serverDate
  }
}

jest.mock('../../util/keysServer', () => ({
  RemoteKeysError: MockRemoteKeysError,
  fetchRemoteKeys: async (...args: unknown[]) =>
    await mockFetchRemoteKeys(...(args as [unknown]))
}))
const mockGetAttestationToken = jest.fn(
  async (_ms?: number) => undefined as string | undefined
)
const mockMaybeWarnClockSkew = jest.fn((_serverTime: unknown) => {})

// Stands in for the engine's token subscription, which replays the current
// token to a new listener before it returns:
type MockTokenListener = (token: string | undefined) => void
const mockTokenListeners = new Set<MockTokenListener>()
const mockTokenState: { current: string | undefined } = { current: undefined }
const deliverToken = (token: string | undefined): void => {
  mockTokenState.current = token
  for (const listener of [...mockTokenListeners]) listener(token)
}

jest.mock('../../util/attestation', () => ({
  getAttestationToken: async (...args: unknown[]) =>
    await mockGetAttestationToken(...(args as [number?])),
  maybeWarnClockSkew: (serverTime: unknown) => {
    mockMaybeWarnClockSkew(serverTime)
  },
  onAttestationToken: (listener: MockTokenListener) => {
    mockTokenListeners.add(listener)
    listener(mockTokenState.current)
    return () => {
      mockTokenListeners.delete(listener)
    }
  }
}))

const mockRebuildAllPlugins = jest.fn()

jest.mock('../../util/corePlugins', () => ({
  rebuildAllPlugins: () => mockRebuildAllPlugins()
}))

// A signed infoRollup starts the app-version check without awaiting it. Left
// real, it keeps running after the test file finishes and imports react-native
// once Jest has torn the environment down, which fails the run:
jest.mock('../../util/versionCheck', () => ({
  checkAppVersion: async () => {}
}))

interface FreshModules {
  keysStore: typeof KeysStore
  config: typeof ConfigModule
  keys: typeof KeysModule
  pluginMaps: typeof PluginMapsModule
}

const freshModules = (): FreshModules => {
  let keysStore: typeof KeysStore
  let config: typeof ConfigModule
  let keys: typeof KeysModule
  let pluginMaps: typeof PluginMapsModule
  jest.isolateModules(() => {
    keysStore = require('../../util/keysStore')
    config = require('../../config')
    keys = require('../../keys')
    pluginMaps = require('../../pluginMaps')
  })
  // @ts-expect-error assigned by the synchronous isolateModules callback
  return { keysStore, config, keys, pluginMaps }
}

const DAY_MS = 24 * 60 * 60 * 1000

const flushMicrotasks = async (): Promise<void> => {
  for (let i = 0; i < 20; i++) await Promise.resolve()
}

describe('keysStoreInternalsForTests', () => {
  it('nests flat partner keys under globalKeys', () => {
    const { keysStore } = freshModules()
    const { nestGlobalKeys } = keysStore.keysStoreInternalsForTests

    expect(
      nestGlobalKeys({
        AZTECO_API_KEY: 'from-remote',
        KILN_MAINNET_API_KEY: 'kiln',
        guiApiKeys: { moonpay: 'm' }
      })
    ).toEqual({
      globalKeys: {
        AZTECO_API_KEY: 'from-remote',
        KILN_MAINNET_API_KEY: 'kiln'
      },
      guiApiKeys: { moonpay: 'm' }
    })
  })

  it('keeps an existing globalKeys entry over a flat duplicate', () => {
    const { keysStore } = freshModules()
    const { nestGlobalKeys } = keysStore.keysStoreInternalsForTests

    expect(
      nestGlobalKeys({
        AZTECO_API_KEY: 'flat-loses',
        globalKeys: { AZTECO_API_KEY: 'nested-wins' }
      })
    ).toEqual({ globalKeys: { AZTECO_API_KEY: 'nested-wins' } })
  })

  it('strips local-only fields including the flat POSTHOG_API_KEY', () => {
    const { keysStore } = freshModules()
    const { stripLocalOnlyFields } = keysStore.keysStoreInternalsForTests

    expect(
      stripLocalOnlyFields({
        EDGE_API_KEY: 'remote-key',
        EDGE_API_SECRET: 'deadbeef',
        SENTRY_DSN_URL: 'https://remote.sentry',
        BUGSNAG_API_KEY: 'bugsnag',
        POSTHOG_API_KEY: 'ph',
        AZTECO_API_KEY: 'keep-me',
        guiApiKeys: {
          moonpay: 'keep-moonpay'
        }
      })
    ).toEqual({
      AZTECO_API_KEY: 'keep-me',
      guiApiKeys: {
        moonpay: 'keep-moonpay'
      }
    })
  })

  it('drops config-only fields via keepKeysFields', () => {
    const { keysStore } = freshModules()
    const { keepKeysFields } = keysStore.keysStoreInternalsForTests

    expect(
      keepKeysFields({
        USE_FAKE_CORE: true,
        DEBUG_CORE: true,
        AZTECO_API_KEY: 'az',
        guiApiKeys: { moonpay: 'm' }
      })
    ).toEqual({
      AZTECO_API_KEY: 'az',
      guiApiKeys: { moonpay: 'm' }
    })
  })
})

describe('initializeKeys', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockInitDeviceSettings.mockImplementation(async () => {})
    mockAwaitDeviceSettingsDisk.mockImplementation(async () => {})
    mockGetKeysCache.mockReturnValue(undefined)
    mockWriteKeysCache.mockImplementation(async () => {})
    mockGetAttestationToken.mockReset()
    mockGetAttestationToken.mockResolvedValue(undefined)
    mockTokenListeners.clear()
    mockTokenState.current = undefined
    mockFetchRemoteKeys.mockReset()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('uses the cache tier on a mergeable cache hit', async () => {
    mockGetKeysCache.mockReturnValue({
      keys: { globalKeys: { AZTECO_API_KEY: 'from-cache' } },
      fetchedAt: Date.now(),
      assuranceLevel: 'attested'
    })
    // Background refresh for next launch.
    mockFetchRemoteKeys.mockResolvedValue({
      keys: { globalKeys: { AZTECO_API_KEY: 'bg-refresh' } },
      assuranceLevel: 'attested'
    })

    const { keysStore, keys } = freshModules()
    await keysStore.initializeKeys()

    expect(keysStore.getKeysTier()).toBe('cache')
    expect(keys.globalKeys.AZTECO_API_KEY).toBe('from-cache')
    expect(mockRebuildAllPlugins).toHaveBeenCalled()
  })

  it('uses an aged cache as a warm start (cache never expires)', async () => {
    mockGetKeysCache.mockReturnValue({
      keys: { globalKeys: { AZTECO_API_KEY: 'from-old-cache' } },
      // Far older than any former TTL window.
      fetchedAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
      assuranceLevel: 'attested'
    })
    mockFetchRemoteKeys.mockResolvedValue({
      keys: { globalKeys: { AZTECO_API_KEY: 'bg-refresh' } },
      assuranceLevel: 'attested'
    })

    const { keysStore, keys } = freshModules()
    await keysStore.initializeKeys()

    expect(keysStore.getKeysTier()).toBe('cache')
    expect(keys.globalKeys.AZTECO_API_KEY).toBe('from-old-cache')
    // Warm path still schedules a background refresh for the next launch.
    expect(mockFetchRemoteKeys).toHaveBeenCalled()
  })

  it('falls through an unmergeable cache to a remote fetch', async () => {
    mockGetKeysCache.mockReturnValue({
      keys: { guiApiKeys: 'not-an-object' },
      fetchedAt: 1,
      assuranceLevel: 'default'
    })
    mockFetchRemoteKeys.mockResolvedValue({
      keys: { globalKeys: { AZTECO_API_KEY: 'from-remote' } },
      assuranceLevel: 'unattested'
    })

    const { keysStore, keys } = freshModules()
    await keysStore.initializeKeys()

    expect(keysStore.getKeysTier()).toBe('remote')
    expect(keys.globalKeys.AZTECO_API_KEY).toBe('from-remote')
    expect(mockWriteKeysCache).toHaveBeenCalled()
  })

  it('uses the remote tier on a successful cold fetch', async () => {
    mockFetchRemoteKeys.mockResolvedValue({
      keys: { globalKeys: { AZTECO_API_KEY: 'from-remote' } },
      assuranceLevel: 'attested'
    })

    const { keysStore, keys } = freshModules()
    await keysStore.initializeKeys()

    expect(keysStore.getKeysTier()).toBe('remote')
    expect(keys.globalKeys.AZTECO_API_KEY).toBe('from-remote')
    expect(mockFetchRemoteKeys).toHaveBeenCalledWith(
      expect.objectContaining({ appId: 'edge' })
    )
    expect(mockWriteKeysCache).toHaveBeenCalledWith(
      expect.objectContaining({
        keys: { globalKeys: { AZTECO_API_KEY: 'from-remote' } },
        assuranceLevel: 'attested'
      })
    )
  })

  it('keeps unrelated baked-in secrets when the remote payload is partial', async () => {
    mockFetchRemoteKeys.mockResolvedValue({
      keys: { globalKeys: { AZTECO_API_KEY: 'from-remote' } },
      assuranceLevel: 'unattested'
    })

    const { keysStore, keys, pluginMaps } = freshModules()
    await keysStore.initializeKeys()

    expect(keys.globalKeys.AZTECO_API_KEY).toBe('from-remote')
    expect(keys.globalKeys.STAKEKIT_API_KEY).toBe('baked-stakekit')
    expect((pluginMaps.pluginMaps.guiApiKeys as any).moonpay).toBe(
      'baked-moonpay'
    )
  })

  it('does not let USE_FAKE_CORE from a payload reach CONFIG', async () => {
    mockFetchRemoteKeys.mockResolvedValue({
      keys: {
        USE_FAKE_CORE: true,
        globalKeys: { AZTECO_API_KEY: 'from-remote' }
      },
      assuranceLevel: 'unattested'
    })

    const { keysStore, config, keys } = freshModules()
    expect(config.CONFIG.USE_FAKE_CORE).toBe(false)
    await keysStore.initializeKeys()

    expect(keysStore.getKeysTier()).toBe('remote')
    expect(config.CONFIG.USE_FAKE_CORE).toBe(false)
    expect(keys.globalKeys.AZTECO_API_KEY).toBe('from-remote')
  })

  it('nests remote globalKeys but keeps the top-level baked POSTHOG_API_KEY', async () => {
    mockFetchRemoteKeys.mockResolvedValue({
      keys: {
        globalKeys: {
          COINGECKO_API_KEY: 'remote-coingecko',
          KILN_MAINNET_API_KEY: 'remote-kiln',
          // A hostile server must not be able to rotate the telemetry key.
          POSTHOG_API_KEY: 'evil-posthog'
        }
      },
      assuranceLevel: 'hardware'
    })

    const { keysStore, keys } = freshModules()
    await keysStore.initializeKeys()

    expect(keysStore.getKeysTier()).toBe('remote')
    expect(keys.globalKeys.COINGECKO_API_KEY).toBe('remote-coingecko')
    expect(keys.globalKeys.KILN_MAINNET_API_KEY).toBe('remote-kiln')
    // The top-level, local-only POSTHOG_API_KEY survives untouched.
    expect(keys.KEYS.POSTHOG_API_KEY).toBe('baked-posthog')
  })

  it('strips EDGE_API_SECRET from a remote payload before applying', async () => {
    const remoteSecret = new Uint8Array(32).fill(0xaa)
    mockFetchRemoteKeys.mockResolvedValue({
      keys: {
        EDGE_API_SECRET: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        globalKeys: { AZTECO_API_KEY: 'from-remote' }
      },
      assuranceLevel: 'unattested'
    })

    const { keysStore, keys } = freshModules()
    const before = keys.KEYS.EDGE_API_SECRET
    await keysStore.initializeKeys()

    expect(keys.KEYS.EDGE_API_SECRET).toEqual(before)
    expect(keys.KEYS.EDGE_API_SECRET).not.toEqual(remoteSecret)
    expect(keys.globalKeys.AZTECO_API_KEY).toBe('from-remote')
    expect(mockWriteKeysCache).toHaveBeenCalledWith(
      expect.objectContaining({
        keys: { globalKeys: { AZTECO_API_KEY: 'from-remote' } }
      })
    )
    expect(mockWriteKeysCache.mock.calls[0][0].keys).not.toHaveProperty(
      'EDGE_API_SECRET'
    )
  })

  it('never rejects even when the fetch fails', async () => {
    mockFetchRemoteKeys.mockRejectedValue(new Error('network down'))

    const { keysStore } = freshModules()
    await expect(keysStore.initializeKeys()).resolves.toBeUndefined()
    expect(keysStore.getKeysTier()).toBe('baked-in')
  })

  it('checks the device clock against the server when the fetch is refused', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const serverDate = 'Wed, 07 Oct 2026 19:55:14 GMT'
    mockFetchRemoteKeys.mockRejectedValue(
      new MockRemoteKeysError(401, serverDate)
    )

    try {
      const { keysStore } = freshModules()
      await keysStore.initializeKeys()

      expect(keysStore.getKeysTier()).toBe('baked-in')
      expect(mockMaybeWarnClockSkew).toHaveBeenCalledTimes(1)
      expect(mockMaybeWarnClockSkew).toHaveBeenCalledWith(serverDate)
    } finally {
      warn.mockRestore()
    }
  })

  it('leaves the clock alone when the fetch fails for another reason', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    mockFetchRemoteKeys
      .mockRejectedValueOnce(
        new MockRemoteKeysError(503, 'Wed, 07 Oct 2026 19:55:14 GMT')
      )
      .mockRejectedValue(new Error('network down'))

    try {
      const first = freshModules()
      await first.keysStore.initializeKeys()
      const second = freshModules()
      await second.keysStore.initializeKeys()

      expect(mockFetchRemoteKeys).toHaveBeenCalledTimes(2)
      expect(mockMaybeWarnClockSkew).not.toHaveBeenCalled()
    } finally {
      warn.mockRestore()
    }
  })

  it('fetches again and caches once a token arrives after an unattested fetch', async () => {
    mockGetAttestationToken
      .mockResolvedValueOnce(undefined)
      .mockResolvedValue('late-token')
    mockFetchRemoteKeys
      .mockResolvedValueOnce({
        keys: { globalKeys: { AZTECO_API_KEY: 'default-layer' } },
        assuranceLevel: 'default'
      })
      .mockResolvedValue({
        keys: { globalKeys: { AZTECO_API_KEY: 'hardware-layer' } },
        assuranceLevel: 'hardware'
      })

    const { keysStore, keys } = freshModules()
    await keysStore.initializeKeys()
    await flushMicrotasks()

    expect(mockFetchRemoteKeys).toHaveBeenCalledTimes(1)
    expect(mockWriteKeysCache).toHaveBeenCalledTimes(1)
    expect(mockWriteKeysCache).toHaveBeenLastCalledWith(
      expect.objectContaining({ assuranceLevel: 'default', attested: false })
    )
    expect(mockTokenListeners.size).toBe(1)

    // The handshake fails first and succeeds on a later retry:
    deliverToken(undefined)
    await flushMicrotasks()
    expect(mockFetchRemoteKeys).toHaveBeenCalledTimes(1)

    deliverToken('late-token')
    await flushMicrotasks()

    expect(mockFetchRemoteKeys).toHaveBeenCalledTimes(2)
    expect(mockFetchRemoteKeys).toHaveBeenLastCalledWith(
      expect.objectContaining({ attestationToken: 'late-token' })
    )
    expect(mockWriteKeysCache).toHaveBeenLastCalledWith(
      expect.objectContaining({
        keys: { globalKeys: { AZTECO_API_KEY: 'hardware-layer' } },
        assuranceLevel: 'hardware',
        attested: true
      })
    )
    // The cache is for the next launch. This one keeps the keys it booted on:
    expect(keysStore.getKeysTier()).toBe('remote')
    expect(keys.globalKeys.AZTECO_API_KEY).toBe('default-layer')

    // The answer that carried a token is cached, so the wait is over however
    // often the token rotates afterwards:
    expect(mockTokenListeners.size).toBe(0)
    deliverToken('rotated-token')
    await flushMicrotasks()
    expect(mockFetchRemoteKeys).toHaveBeenCalledTimes(2)
  })

  it('fetches again when the token landed just after the wait gave up', async () => {
    mockTokenState.current = 'just-landed'
    mockGetAttestationToken
      .mockResolvedValueOnce(undefined)
      .mockResolvedValue('just-landed')
    mockFetchRemoteKeys.mockImplementation(async opts => {
      const { attestationToken } = opts as { attestationToken?: string }
      return attestationToken == null
        ? {
            keys: { globalKeys: { AZTECO_API_KEY: 'default-layer' } },
            assuranceLevel: 'default'
          }
        : {
            keys: { globalKeys: { AZTECO_API_KEY: 'hardware-layer' } },
            assuranceLevel: 'hardware'
          }
    })

    const cache = useLiveCache()

    const { keysStore } = freshModules()
    await keysStore.initializeKeys()
    await flushMicrotasks()

    expect(mockFetchRemoteKeys).toHaveBeenCalledTimes(2)
    expect(mockTokenListeners.size).toBe(0)
    // Whichever of the two answers landed first:
    expect(cache.current).toEqual(
      expect.objectContaining({ assuranceLevel: 'hardware', attested: true })
    )
  })

  it('does not wait for a token when the fetch went out with one', async () => {
    mockGetAttestationToken.mockResolvedValue('token')
    mockFetchRemoteKeys.mockResolvedValue({
      keys: { globalKeys: { AZTECO_API_KEY: 'hardware-layer' } },
      assuranceLevel: 'hardware'
    })

    const { keysStore } = freshModules()
    await keysStore.initializeKeys()
    await flushMicrotasks()

    expect(mockTokenListeners.size).toBe(0)
    deliverToken('rotated-token')
    await flushMicrotasks()
    expect(mockFetchRemoteKeys).toHaveBeenCalledTimes(1)
    expect(mockWriteKeysCache).toHaveBeenCalledTimes(1)
  })

  it('keeps an attested cache entry when the unattested answer lands after it', async () => {
    // Written before the cache recorded whether the request carried a token,
    // so nothing but the overlap rule protects what the refetch caches:
    const cache = useLiveCache({
      keys: { globalKeys: { AZTECO_API_KEY: 'from-cache' } },
      fetchedAt: 1,
      assuranceLevel: 'hardware'
    })
    mockGetAttestationToken
      .mockResolvedValueOnce(undefined)
      .mockResolvedValue('late-token')
    let resolveUnattested!: (value: {
      keys: Record<string, unknown>
      assuranceLevel?: string
    }) => void
    mockFetchRemoteKeys
      .mockImplementationOnce(
        async () =>
          await new Promise(resolve => {
            resolveUnattested = resolve
          })
      )
      .mockResolvedValue({
        keys: { globalKeys: { AZTECO_API_KEY: 'hardware-layer' } },
        assuranceLevel: 'hardware'
      })

    const { keysStore } = freshModules()
    await keysStore.initializeKeys()
    await flushMicrotasks()
    expect(keysStore.getKeysTier()).toBe('cache')

    deliverToken('late-token')
    await flushMicrotasks()
    expect(mockWriteKeysCache).toHaveBeenCalledTimes(1)
    expect(mockWriteKeysCache).toHaveBeenLastCalledWith(
      expect.objectContaining({ assuranceLevel: 'hardware' })
    )

    resolveUnattested({
      keys: { globalKeys: { AZTECO_API_KEY: 'default-layer' } },
      assuranceLevel: 'default'
    })
    await flushMicrotasks()
    await flushMicrotasks()
    expect(mockWriteKeysCache).toHaveBeenCalledTimes(1)
    expect(cache.current).toEqual(
      expect.objectContaining({ assuranceLevel: 'hardware', attested: true })
    )
  })

  it('keeps a recent attested cache entry when the launch gets no token', async () => {
    const entry = {
      keys: { globalKeys: { AZTECO_API_KEY: 'from-cache' } },
      fetchedAt: Date.now() - DAY_MS,
      assuranceLevel: 'hardware',
      attested: true
    }
    const cache = useLiveCache(entry)
    mockFetchRemoteKeys.mockResolvedValue({
      keys: { globalKeys: { AZTECO_API_KEY: 'default-layer' } },
      assuranceLevel: 'default'
    })

    const { keysStore } = freshModules()
    await keysStore.initializeKeys()
    await flushMicrotasks()
    await flushMicrotasks()

    expect(keysStore.getKeysTier()).toBe('cache')
    expect(mockFetchRemoteKeys).toHaveBeenCalledTimes(1)
    expect(mockWriteKeysCache).not.toHaveBeenCalled()
    expect(cache.current).toBe(entry)
    // Still waiting for a token to refresh the entry with:
    expect(mockTokenListeners.size).toBe(1)
  })

  it.each([
    ['older than the hold', -4 * DAY_MS],
    ['stamped by a clock that has since been set back', 4 * DAY_MS]
  ])(
    'replaces an attested cache entry %s when the launch gets no token',
    async (_name, offset) => {
      const cache = useLiveCache({
        keys: { globalKeys: { AZTECO_API_KEY: 'from-cache' } },
        fetchedAt: Date.now() + offset,
        assuranceLevel: 'hardware',
        attested: true
      })
      mockFetchRemoteKeys.mockResolvedValue({
        keys: { globalKeys: { AZTECO_API_KEY: 'default-layer' } },
        assuranceLevel: 'default'
      })

      const { keysStore } = freshModules()
      await keysStore.initializeKeys()
      await flushMicrotasks()
      await flushMicrotasks()

      expect(keysStore.getKeysTier()).toBe('cache')
      expect(cache.current).toEqual(
        expect.objectContaining({
          keys: { globalKeys: { AZTECO_API_KEY: 'default-layer' } },
          assuranceLevel: 'default',
          attested: false
        })
      )
    }
  )

  it('replaces an attested cache entry that will not merge', async () => {
    const cache = useLiveCache({
      keys: { guiApiKeys: 'not-an-object' },
      fetchedAt: Date.now(),
      assuranceLevel: 'hardware',
      attested: true
    })
    mockFetchRemoteKeys.mockResolvedValue({
      keys: { globalKeys: { AZTECO_API_KEY: 'default-layer' } },
      assuranceLevel: 'default'
    })
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      const { keysStore } = freshModules()
      await keysStore.initializeKeys()
      await flushMicrotasks()

      expect(keysStore.getKeysTier()).toBe('remote')
      expect(cache.current).toEqual(
        expect.objectContaining({ assuranceLevel: 'default', attested: false })
      )
    } finally {
      warn.mockRestore()
    }
  })

  it('fetches again on the next token when the refetch fails', async () => {
    mockGetAttestationToken
      .mockResolvedValueOnce(undefined)
      .mockResolvedValue('token')
    mockFetchRemoteKeys
      .mockResolvedValueOnce({
        keys: { globalKeys: { AZTECO_API_KEY: 'default-layer' } },
        assuranceLevel: 'default'
      })
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValue({
        keys: { globalKeys: { AZTECO_API_KEY: 'hardware-layer' } },
        assuranceLevel: 'hardware'
      })
    const cache = useLiveCache()
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      const { keysStore } = freshModules()
      await keysStore.initializeKeys()
      await flushMicrotasks()

      deliverToken('first-token')
      await flushMicrotasks()
      expect(mockFetchRemoteKeys).toHaveBeenCalledTimes(2)
      expect(cache.current?.assuranceLevel).toBe('default')
      expect(mockTokenListeners.size).toBe(1)

      deliverToken('refreshed-token')
      await flushMicrotasks()
      expect(mockFetchRemoteKeys).toHaveBeenCalledTimes(3)
      expect(cache.current).toEqual(
        expect.objectContaining({ assuranceLevel: 'hardware', attested: true })
      )
      expect(mockTokenListeners.size).toBe(0)
    } finally {
      warn.mockRestore()
    }
  })

  it('stays subscribed when the token is gone before the refetch is sent', async () => {
    mockGetAttestationToken
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValue('token')
    mockFetchRemoteKeys.mockImplementation(async opts => {
      const { attestationToken } = opts as { attestationToken?: string }
      return attestationToken == null
        ? {
            keys: { globalKeys: { AZTECO_API_KEY: 'default-layer' } },
            assuranceLevel: 'default'
          }
        : {
            keys: { globalKeys: { AZTECO_API_KEY: 'hardware-layer' } },
            assuranceLevel: 'hardware'
          }
    })
    const cache = useLiveCache()

    const { keysStore } = freshModules()
    await keysStore.initializeKeys()
    await flushMicrotasks()

    deliverToken('dropped-token')
    await flushMicrotasks()
    expect(mockFetchRemoteKeys).toHaveBeenCalledTimes(2)
    expect(cache.current?.attested).toBe(false)
    expect(mockTokenListeners.size).toBe(1)

    deliverToken('token')
    await flushMicrotasks()
    expect(mockFetchRemoteKeys).toHaveBeenCalledTimes(3)
    expect(cache.current).toEqual(
      expect.objectContaining({ assuranceLevel: 'hardware', attested: true })
    )
    expect(mockTokenListeners.size).toBe(0)
  })

  it('does not start a second refetch while one is in flight', async () => {
    mockGetAttestationToken
      .mockResolvedValueOnce(undefined)
      .mockResolvedValue('token')
    let resolveRefetch!: (value: {
      keys: Record<string, unknown>
      assuranceLevel?: string
    }) => void
    mockFetchRemoteKeys
      .mockResolvedValueOnce({
        keys: { globalKeys: { AZTECO_API_KEY: 'default-layer' } },
        assuranceLevel: 'default'
      })
      .mockImplementationOnce(
        async () =>
          await new Promise(resolve => {
            resolveRefetch = resolve
          })
      )
    const cache = useLiveCache()

    const { keysStore } = freshModules()
    await keysStore.initializeKeys()
    await flushMicrotasks()

    deliverToken('first-token')
    await flushMicrotasks()
    deliverToken('refreshed-token')
    await flushMicrotasks()
    expect(mockFetchRemoteKeys).toHaveBeenCalledTimes(2)

    resolveRefetch({
      keys: { globalKeys: { AZTECO_API_KEY: 'hardware-layer' } },
      assuranceLevel: 'hardware'
    })
    await flushMicrotasks()
    expect(mockFetchRemoteKeys).toHaveBeenCalledTimes(2)
    expect(cache.current).toEqual(
      expect.objectContaining({ assuranceLevel: 'hardware', attested: true })
    )
    expect(mockTokenListeners.size).toBe(0)
  })

  it('never rejects even when awaitDeviceSettingsDisk throws', async () => {
    mockAwaitDeviceSettingsDisk.mockRejectedValue(new Error('disk broken'))

    const { keysStore } = freshModules()
    await expect(keysStore.initializeKeys()).resolves.toBeUndefined()
  })

  it('salvages a cache the settings read delivers after its timeout', async () => {
    jest.useFakeTimers()
    // The settings read overruns SETTINGS_READ_TIMEOUT_MS (2000) but lands
    // inside the salvage window that follows a fast network failure:
    let diskLanded = false
    mockAwaitDeviceSettingsDisk.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 3000))
      diskLanded = true
    })
    mockGetKeysCache.mockImplementation(() =>
      diskLanded
        ? {
            keys: { globalKeys: { AZTECO_API_KEY: 'late-cache' } },
            fetchedAt: 1,
            assuranceLevel: 'unattested'
          }
        : undefined
    )
    mockFetchRemoteKeys.mockRejectedValue(new Error('offline'))

    const { keysStore, keys } = freshModules()
    const pending = keysStore.initializeKeys()
    await jest.advanceTimersByTimeAsync(3000)
    await pending

    expect(keysStore.getKeysTier()).toBe('cache')
    expect(keys.globalKeys.AZTECO_API_KEY).toBe('late-cache')
  })

  it('stops waiting on a settings read that never lands', async () => {
    jest.useFakeTimers()
    mockAwaitDeviceSettingsDisk.mockImplementation(async () => {
      await new Promise<void>(() => {})
    })
    mockFetchRemoteKeys.mockRejectedValue(new Error('offline'))

    const { keysStore } = freshModules()
    const pending = keysStore.initializeKeys()
    // SETTINGS_READ_TIMEOUT_MS, then SETTINGS_SALVAGE_TIMEOUT_MS:
    await jest.advanceTimersByTimeAsync(2000 + 2000)
    await pending

    expect(keysStore.getKeysTier()).toBe('baked-in')
  })

  it('times out a hung background refresh but still caches a late answer', async () => {
    jest.useFakeTimers()
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    mockGetKeysCache.mockReturnValue({
      keys: { globalKeys: { AZTECO_API_KEY: 'from-cache' } },
      fetchedAt: 1,
      assuranceLevel: 'unattested'
    })
    let resolveFetch!: (value: {
      keys: Record<string, unknown>
      assuranceLevel?: string
    }) => void
    mockFetchRemoteKeys.mockImplementation(
      async () =>
        await new Promise(resolve => {
          resolveFetch = resolve
        })
    )

    try {
      const { keysStore } = freshModules()
      await keysStore.initializeKeys()
      expect(keysStore.getKeysTier()).toBe('cache')

      // BACKGROUND_CACHE_TIMEOUT_MS = COLD_TOTAL_TIMEOUT_MS = 13000
      await jest.advanceTimersByTimeAsync(13_000)
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('background refresh timed out')
      )
      expect(mockWriteKeysCache).not.toHaveBeenCalled()

      resolveFetch({
        keys: { globalKeys: { AZTECO_API_KEY: 'late-refresh' } },
        assuranceLevel: 'unattested'
      })
      await flushMicrotasks()
      await flushMicrotasks()
      expect(mockWriteKeysCache).toHaveBeenCalledWith(
        expect.objectContaining({
          keys: { globalKeys: { AZTECO_API_KEY: 'late-refresh' } }
        })
      )
    } finally {
      warn.mockRestore()
    }
  })

  it('falls to baked-in on cold deadline expiry and still caches a late fetch', async () => {
    jest.useFakeTimers()

    let resolveFetch!: (value: {
      keys: Record<string, unknown>
      assuranceLevel?: string
    }) => void
    mockFetchRemoteKeys.mockImplementation(
      async () =>
        await new Promise(resolve => {
          resolveFetch = resolve
        })
    )

    const { keysStore } = freshModules()
    const pending = keysStore.initializeKeys()

    // COLD_TOTAL_TIMEOUT_MS = 5000 + 8000
    await jest.advanceTimersByTimeAsync(13_000)
    await pending

    expect(keysStore.getKeysTier()).toBe('baked-in')
    expect(mockWriteKeysCache).not.toHaveBeenCalled()

    resolveFetch({
      keys: { globalKeys: { AZTECO_API_KEY: 'late-remote' } },
      assuranceLevel: 'unattested'
    })
    await flushMicrotasks()
    // Allow the background cache write promise to settle.
    await Promise.resolve()
    await flushMicrotasks()

    expect(mockWriteKeysCache).toHaveBeenCalledWith(
      expect.objectContaining({
        keys: { globalKeys: { AZTECO_API_KEY: 'late-remote' } },
        assuranceLevel: 'unattested'
      })
    )
  })
})
