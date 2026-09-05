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
const mockGetKeysCache = jest.fn(
  () =>
    undefined as
      | undefined
      | {
          keys: unknown
          fetchedAt: number
          assuranceLevel: string
        }
)
const mockWriteKeysCache = jest.fn(
  async (_entry: {
    keys: unknown
    fetchedAt: number
    assuranceLevel: string
  }) => {}
)

jest.mock('../../actions/DeviceSettingsActions', () => ({
  initDeviceSettings: async (...args: unknown[]) => {
    await mockInitDeviceSettings(...args)
  },
  awaitDeviceSettingsDisk: async (...args: unknown[]) => {
    await mockAwaitDeviceSettingsDisk(...args)
  },
  getKeysCache: () => mockGetKeysCache(),
  writeKeysCache: async (...args: unknown[]) => {
    await mockWriteKeysCache(
      ...(args as [
        {
          keys: unknown
          fetchedAt: number
          assuranceLevel: string
        }
      ])
    )
  }
}))

const mockFetchRemoteKeys = jest.fn<
  (opts: unknown) => Promise<{
    keys: Record<string, unknown>
    assuranceLevel?: string
  }>
>()

jest.mock('../../util/keysServer', () => ({
  fetchRemoteKeys: async (...args: unknown[]) =>
    await mockFetchRemoteKeys(...(args as [unknown]))
}))
const mockGetAttestationToken = jest.fn(
  async (_ms?: number) => undefined as string | undefined
)

jest.mock('../../util/attestation', () => ({
  getAttestationToken: async (...args: unknown[]) =>
    await mockGetAttestationToken(...(args as [number?]))
}))

const mockRebuildAllPlugins = jest.fn()

jest.mock('../../util/corePlugins', () => ({
  rebuildAllPlugins: () => mockRebuildAllPlugins()
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
    mockGetAttestationToken.mockResolvedValue(undefined)
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

  it('never rejects even when awaitDeviceSettingsDisk throws', async () => {
    mockAwaitDeviceSettingsDisk.mockRejectedValue(new Error('disk broken'))

    const { keysStore } = freshModules()
    await expect(keysStore.initializeKeys()).resolves.toBeUndefined()
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
