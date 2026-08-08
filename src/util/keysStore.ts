import {
  getKeysCache,
  initDeviceSettings,
  writeKeysCache
} from '../actions/DeviceSettingsActions'
import { bakedConfig, bakedKeys, ENV } from '../env'
import { deepMerge, isPlainObject, makeEnvFromFiles } from '../envFiles'
import { config } from '../theme/appConfig'
import { getAttestationToken } from './attestation'
import { rebuildAllPlugins } from './corePlugins'
import { fetchRemoteKeys } from './keysServer'

export type KeysTier = 'remote' | 'cache' | 'baked-in'

/** Cold-start wait for an attestation token before fetching getKeys unattested. */
const ATTESTATION_BUDGET_MS = 5000
/**
 * The fetch's share of the cold-start budget. Not enforced on its own: it only
 * sizes the combined deadline below. The network call is bounded per info
 * server by `FETCH_TIMEOUT_MS` in `keysServer.ts`, and the whole gate by
 * `COLD_TOTAL_TIMEOUT_MS`.
 */
const COLD_FETCH_TIMEOUT_MS = 8000
/**
 * Deadline for the whole cold-start gate, which is what the app actually waits
 * on. It is the sum, not the fetch timeout alone, because the attestation wait
 * happens inside the raced promise: one shared budget would let a slow first
 * attestation spend the fetch's share and abandon a request that was about to
 * answer.
 */
const COLD_TOTAL_TIMEOUT_MS = ATTESTATION_BUDGET_MS + COLD_FETCH_TIMEOUT_MS

/**
 * Secrets the info server must never serve, so a remote payload can never
 * replace them. The server strips these too; stripping again here means a
 * misconfigured or hostile server cannot rotate the credentials used to
 * authenticate the fetch, nor the telemetry keys that are read at module scope
 * before any of this runs (see `docs/CONFIG_KEYS_ARCHITECTURE.md`).
 */
const LOCAL_ONLY_TOP_LEVEL = new Set([
  'EDGE_API_KEY',
  'EDGE_API_SECRET',
  'BUGSNAG_API_KEY'
])
const LOCAL_ONLY_PREFIXES = ['YOLO_', 'SENTRY_']
const LOCAL_ONLY_PLUGIN_API_KEYS = new Set(['posthog'])

let keysTier: KeysTier = 'baked-in'
let initPromise: Promise<void> | undefined

function isLocalOnlyTopLevel(key: string): boolean {
  return (
    LOCAL_ONLY_TOP_LEVEL.has(key) ||
    LOCAL_ONLY_PREFIXES.some(prefix => key.startsWith(prefix))
  )
}

function stripLocalOnlyFields(
  keys: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(keys)) {
    if (isLocalOnlyTopLevel(key)) continue
    if (key === 'pluginApiKeys' && isPlainObject(value)) {
      const pluginApiKeys: Record<string, unknown> = {}
      for (const [pluginId, pluginValue] of Object.entries(value)) {
        if (LOCAL_ONLY_PLUGIN_API_KEYS.has(pluginId)) continue
        pluginApiKeys[pluginId] = pluginValue
      }
      out[key] = pluginApiKeys
      continue
    }
    out[key] = value
  }
  return out
}

export function getKeysTier(): KeysTier {
  return keysTier
}

/**
 * Fold a remote payload into the live `ENV`, keeping the baked-in `keys.json`
 * as the merge base so a partial payload degrades to the shipped value rather
 * than blanking the field.
 *
 * `ENV` is mutated in place because consumers hold the object itself. Readers
 * that copy a secret out of `ENV` at module-evaluation time therefore never see
 * this update; see the "Consumers must read lazily" note in the architecture
 * doc.
 *
 * Returns false when the payload is not mergeable, so the caller can report the
 * tier it actually ended up on rather than the one it hoped for.
 */
function applyKeysToEnv(keys: unknown): boolean {
  if (!isPlainObject(keys)) return false

  const mergedKeys = deepMerge(bakedKeys, stripLocalOnlyFields(keys))
  Object.assign(ENV, makeEnvFromFiles(bakedConfig, mergedKeys))
  rebuildAllPlugins()
  return true
}

interface FetchedKeys {
  keys: unknown
  ttlSeconds: number
  assuranceLevel: string
}

/**
 * Wait out the attestation budget, then fetch. Resolves `null` instead of
 * rejecting on any failure: the caller races this promise, so a rejection that
 * lands after the race would surface as an unhandled rejection, and every
 * failure mode here simply means falling through to the next tier.
 */
async function fetchKeys(): Promise<FetchedKeys | null> {
  const { EDGE_API_KEY: apiKey, EDGE_API_SECRET: secret } = ENV
  if (apiKey === '' || secret == null) {
    console.warn('initializeKeys: missing EDGE_API_KEY or EDGE_API_SECRET')
    return null
  }

  try {
    // D9: wait up to 5s for attestation, then fetch with whatever we have.
    const attestationToken = await getAttestationToken(ATTESTATION_BUDGET_MS)
    const attested = attestationToken != null && attestationToken !== ''
    const result = await fetchRemoteKeys({
      apiKey,
      secret,
      appId: config.appId ?? 'edge',
      attestationToken
    })
    return {
      ...result,
      // The server reports the layer it actually served; fall back to what we
      // asked for when talking to an older server that omits the field.
      assuranceLevel:
        result.assuranceLevel ?? (attested ? 'attested' : 'unattested')
    }
  } catch (error: unknown) {
    console.warn('initializeKeys: remote keys fetch failed', String(error))
    return null
  }
}

async function cacheKeys(result: FetchedKeys): Promise<void> {
  await writeKeysCache({
    keys: result.keys,
    ttlSeconds: result.ttlSeconds,
    fetchedAt: Date.now(),
    assuranceLevel: result.assuranceLevel
  })
}

/**
 * Resolve `ENV`'s secrets from the highest tier available, and record which one
 * won so a runtime check can prove the remote path was exercised.
 *
 * Warm start (a cache exists) unblocks on the cache and refreshes in the
 * background for the *next* launch, so keys are never hot-swapped underneath a
 * running core. Cold start blocks for at most `COLD_TOTAL_TIMEOUT_MS`, then
 * falls through to the baked-in file.
 */
async function doInitializeKeys(): Promise<void> {
  await initDeviceSettings()

  // An unmergeable cache is treated as no cache at all, so the fetch below still
  // runs. Reporting `cache` for a payload that never reached ENV would claim a
  // tier the app is not actually on.
  const cache = getKeysCache()
  if (cache?.keys != null && applyKeysToEnv(cache.keys)) {
    keysTier = 'cache'
    logTier(cache.assuranceLevel)
    refreshInBackground()
    return
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<null>(resolve => {
    timer = setTimeout(() => {
      resolve(null)
    }, COLD_TOTAL_TIMEOUT_MS)
  })
  let result: FetchedKeys | null
  try {
    // Only the fetch is raced. Folding the cache write in would let a slow disk
    // discard keys we already hold, and the write is not worth blocking boot
    // for: losing it costs one refetch on the next launch.
    result = await Promise.race([fetchKeys(), timeout])
  } finally {
    // The race can settle long before the timer does, and a pending timer keeps
    // the runtime awake for the rest of the window.
    if (timer != null) clearTimeout(timer)
  }

  if (result == null || !applyKeysToEnv(result.keys)) {
    keysTier = 'baked-in'
    logTier()
    return
  }
  keysTier = 'remote'
  logTier(result.assuranceLevel)
  cacheKeys(result).catch((error: unknown) => {
    console.warn('initializeKeys: caching keys failed', String(error))
  })
}

/**
 * Announce which tier won. Never logs a key or any part of one - the tier and
 * assurance level are the only facts a runtime check needs to confirm it
 * exercised the remote path rather than silently passing on the baked-in file.
 */
function logTier(assuranceLevel?: string): void {
  console.log(
    `[keys] tier=${keysTier} assurance=${assuranceLevel ?? 'none'} appId=${
      config.appId ?? 'edge'
    }`
  )
}

/** Refresh for the *next* launch. Never hot-swaps ENV under a running core. */
function refreshInBackground(): void {
  fetchKeys()
    .then(async result => {
      if (result != null) await cacheKeys(result)
    })
    .catch((error: unknown) => {
      console.warn('initializeKeys: background refresh failed', String(error))
    })
}

/**
 * Populate `ENV`'s secrets. Idempotent, and never rejects: every tier below the
 * one that failed is still usable, and the caller is the boot gate, which would
 * otherwise leave the app on the splash screen with no way to recover.
 */
export async function initializeKeys(): Promise<void> {
  initPromise ??= doInitializeKeys().catch((error: unknown) => {
    console.warn('initializeKeys: falling back to baked-in keys', String(error))
  })
  await initPromise
}
