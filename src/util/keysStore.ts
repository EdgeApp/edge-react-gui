import { asMaybe } from 'cleaners'
import { asInfoRollup } from 'edge-info-server'
import { Platform } from 'react-native'
import { getVersion } from 'react-native-device-info'

import {
  awaitDeviceSettingsDisk,
  getKeysCache,
  writeKeysCache
} from '../actions/DeviceSettingsActions'
import {
  asMergeableKeys,
  deepMerge,
  isPlainObject,
  nestGlobalKeys
} from '../configKeysMerge'
import { asKeysJson, type RuntimeKeys } from '../configKeysSchema'
import { applyRuntimeKeys, bakedKeys, globalKeys, KEYS } from '../keys'
import { LOCAL_ONLY_PREFIXES, LOCAL_ONLY_TOP_LEVEL } from '../localOnlyKeys'
import { rebuildPluginMaps } from '../pluginMaps'
import { config } from '../theme/appConfig'
import { getAttestationToken } from './attestation'
import { rebuildAllPlugins } from './corePlugins'
import {
  hasNativeApiSigner,
  isUsableApiKey,
  makeNativeApiSigner,
  warmNativeApiKey
} from './edgeApiSigner'
import { type FetchCredentials, fetchRemoteKeys } from './keysServer'
import { infoServerData } from './network'
import { getOsVersion } from './utils'

export type KeysTier = 'remote' | 'cache' | 'baked-in'

/** Wait up to this long for an attestation token before fetching unattested. */
const ATTESTATION_BUDGET_MS = 5000
/**
 * The fetch's share of the cold-start budget. Not a timer of its own: it only
 * sizes the combined deadline below. The network call's per-server stagger is
 * `FETCH_TIMEOUT_MS` in `keysServer.ts` (asyncWaterfall delay, not a ceiling),
 * and the whole gate is bounded by `COLD_TOTAL_TIMEOUT_MS`.
 */
const COLD_FETCH_TIMEOUT_MS = 8000
/**
 * Deadline for the whole cold-start gate, which is what the app actually waits
 * on. It is the sum of attestation budget and fetch share. The DeviceSettings
 * read is timed separately (see `SETTINGS_READ_TIMEOUT_MS`).
 */
const COLD_TOTAL_TIMEOUT_MS = ATTESTATION_BUDGET_MS + COLD_FETCH_TIMEOUT_MS
/** Cap on waiting for `DeviceSettings.json` before continuing without cache. */
const SETTINGS_READ_TIMEOUT_MS = 2000
/**
 * Extra wait when salvaging cache after a failed or slow-overlapping fetch.
 * Must stay bounded so a hung disk cannot wedge the boot gate, but must be
 * long enough that a DeviceSettings read slightly past the initial timeout can
 * still win over baked-in / remote for this launch.
 */
const SETTINGS_SALVAGE_TIMEOUT_MS = SETTINGS_READ_TIMEOUT_MS
/** Cap on a hung background refresh so it does not linger forever. */
const BACKGROUND_CACHE_TIMEOUT_MS = COLD_TOTAL_TIMEOUT_MS

/**
 * Secrets the info server must never serve, so a remote payload can never
 * replace them. Shared with `scripts/slimKeysJson.ts` via `localOnlyKeys.ts`.
 * The server strips these too; stripping again here means a misconfigured or
 * hostile server cannot rotate the credentials used to authenticate the fetch,
 * nor the telemetry keys that are read at module scope before any of this runs
 * (see `docs/CONFIG_KEYS_ARCHITECTURE.md`).
 */
const LOCAL_ONLY_TOP_LEVEL_SET = new Set<string>(LOCAL_ONLY_TOP_LEVEL)

/** Fields that belong in keys.json; config-only names are dropped from overlays. */
const KEYS_JSON_FIELDS = new Set(Object.keys(asKeysJson.shape))

let keysTier: KeysTier = 'baked-in'
let initPromise: Promise<void> | undefined

function isLocalOnlyTopLevel(key: string): boolean {
  return (
    LOCAL_ONLY_TOP_LEVEL_SET.has(key) ||
    LOCAL_ONLY_PREFIXES.some(prefix => key.startsWith(prefix))
  )
}

/**
 * Drop config-only fields from a remote/cache overlay so a hostile payload
 * cannot flip non-secret settings (e.g. `USE_FAKE_CORE`) via appKeys.
 */
function keepKeysFields(
  keys: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(keys)) {
    if (!KEYS_JSON_FIELDS.has(key)) continue
    out[key] = value
  }
  return out
}

function stripLocalOnlyFields(
  keys: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(keys)) {
    if (isLocalOnlyTopLevel(key)) continue
    if (key === 'globalKeys' && isPlainObject(value)) {
      const nested: Record<string, unknown> = {}
      for (const [gk, gv] of Object.entries(value)) {
        if (isLocalOnlyTopLevel(gk)) continue
        nested[gk] = gv
      }
      out.globalKeys = nested
      continue
    }
    out[key] = value
  }
  return out
}

/** Test-only access to overlay filters used before merging into KEYS. */
export const keysStoreInternalsForTests = {
  keepKeysFields,
  stripLocalOnlyFields,
  nestGlobalKeys
}

export function getKeysTier(): KeysTier {
  return keysTier
}

/**
 * Fold a remote payload into the live KEYS object, keeping the baked-in
 * `keys.json` as the merge base so a partial payload degrades to the shipped
 * value rather than blanking the field.
 *
 * KEYS / globalKeys are mutated in place because consumers hold those objects.
 * Readers that copy a secret out at module-evaluation time therefore never see
 * this update; see the "Consumers must read lazily" note in the architecture
 * doc.
 *
 * Returns false when the payload is not mergeable.
 */
function applyKeys(keys: unknown): boolean {
  let mergeable: Record<string, unknown>
  try {
    mergeable = asMergeableKeys(keys)
  } catch (error: unknown) {
    console.warn('initializeKeys: unusable keys payload', String(error))
    return false
  }

  const nestedOverlay = nestGlobalKeys(
    stripLocalOnlyFields(keepKeysFields(mergeable))
  )
  const mergedKeys = deepMerge(bakedKeys, nestedOverlay) as RuntimeKeys
  applyRuntimeKeys(
    nestGlobalKeys(mergedKeys as unknown as Record<string, unknown>)
  )
  rebuildPluginMaps()
  rebuildAllPlugins()
  return true
}

interface FetchedKeys {
  keys: unknown
  assuranceLevel: string
}

function applyPublicRollup(raw: unknown): void {
  if (infoServerData.rollup != null) return
  const cleaned = asMaybe(asInfoRollup)(raw)
  if (cleaned == null) {
    console.warn('initializeKeys: signed infoRollup failed to clean')
    return
  }
  infoServerData.rollup = cleaned
}

/**
 * Wait up to the attestation budget, then fetch. Resolves `null` instead of
 * rejecting on any failure: the caller races this promise, so a rejection that
 * lands after the race would surface as an unhandled rejection, and every
 * failure mode here simply means falling through to the next tier.
 */
async function fetchKeys(): Promise<FetchedKeys | null> {
  let credentials: FetchCredentials | null = null
  if (hasNativeApiSigner()) {
    const nativeKey = await warmNativeApiKey()
    if (nativeKey !== '') {
      credentials = { apiSigner: makeNativeApiSigner() }
    }
  }
  if (credentials == null) {
    const { EDGE_API_KEY: apiKey, EDGE_API_SECRET: secret } = KEYS
    if (isUsableApiKey(apiKey) && secret != null && secret.byteLength > 0) {
      credentials = { apiKey, secret }
    }
  }
  if (credentials == null) {
    console.warn(
      'initializeKeys: no usable native EdgeApiSigner and no JS apiKey/apiSecret in KEYS'
    )
    return null
  }

  try {
    const attestationToken = await getAttestationToken(ATTESTATION_BUDGET_MS)
    const attested = attestationToken != null && attestationToken !== ''
    const result = await fetchRemoteKeys({
      ...credentials,
      appId: config.appId ?? 'edge',
      os: Platform.OS === 'android' ? 'android' : 'ios',
      osVersion: getOsVersion(),
      appVersion: getVersion(),
      attestationToken
    })
    if (result.rollup != null) applyPublicRollup(result.rollup)
    return {
      keys: result.keys,
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
  let overlay: Record<string, unknown>
  try {
    overlay = nestGlobalKeys(
      stripLocalOnlyFields(keepKeysFields(asMergeableKeys(result.keys)))
    )
  } catch (error: unknown) {
    console.warn(
      'initializeKeys: refusing to cache unusable keys payload',
      String(error)
    )
    return
  }
  await writeKeysCache({
    keys: overlay,
    fetchedAt: Date.now(),
    assuranceLevel: result.assuranceLevel
  })
}

/**
 * Resolve KEYS secrets from the highest tier available, and record which one
 * won so a runtime check can prove the remote path was exercised.
 *
 * Warm start (any mergeable cache) unblocks on the cache and refreshes in the
 * background for the *next* launch, so keys are never hot-swapped underneath a
 * running core and later launches do not stall on the network. The cache does
 * not expire. Cold start (first launch / no usable cache) blocks for at most
 * `COLD_TOTAL_TIMEOUT_MS`, then falls through to the baked-in file.
 */
async function doInitializeKeys(): Promise<void> {
  let settingsTimer: ReturnType<typeof setTimeout> | undefined
  const settingsTimeout = new Promise<'timeout'>(resolve => {
    settingsTimer = setTimeout(() => {
      resolve('timeout')
    }, SETTINGS_READ_TIMEOUT_MS)
  })
  const settingsLoad = awaitDeviceSettingsDisk().catch((error: unknown) => {
    console.warn(
      'initializeKeys: awaitDeviceSettingsDisk failed',
      String(error)
    )
  })
  const settingsResult = await Promise.race([
    // Writers-only init settles on timeout; warm-cache / salvage still need the
    // disk apply, so race the full disk wait against the boot budget.
    settingsLoad.then(() => 'ok' as const),
    settingsTimeout
  ])
  if (settingsTimer != null) clearTimeout(settingsTimer)
  if (settingsResult === 'timeout') {
    console.warn(
      `initializeKeys: DeviceSettings disk timed out after ${SETTINGS_READ_TIMEOUT_MS}ms`
    )
  }

  // An unmergeable cache is treated as no warm cache, so the fetch below still
  // runs. Reporting `cache` for a payload that never reached KEYS would claim a
  // tier the app is not actually on. After a settings timeout the in-memory
  // copy may still be empty even though a valid cache is on disk — we still
  // race the network, then await `settingsLoad` before accepting baked-in so a
  // late disk read can still win.
  let cache = getKeysCache()
  if (cache?.keys != null && applyKeys(cache.keys)) {
    keysTier = 'cache'
    logTier(cache.assuranceLevel)
    cacheForNextLaunch()
    return
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<null>(resolve => {
    timer = setTimeout(() => {
      resolve(null)
    }, COLD_TOTAL_TIMEOUT_MS)
  })
  // Held outside the race so a fetch that answers after the gate closes can
  // still be observed and cached, rather than being ignored once boot proceeds.
  const pendingFetch = fetchKeys()
  let result: FetchedKeys | null
  try {
    // Only the fetch is raced. Folding the cache write in would let a slow disk
    // discard keys we already hold, and the write is not worth blocking boot
    // for: losing it costs one refetch on the next launch.
    result = await Promise.race([pendingFetch, timeout])
  } finally {
    // The race can settle long before the timer does, and a pending timer keeps
    // the runtime awake for the rest of the window.
    if (timer != null) clearTimeout(timer)
  }

  const applyCacheFallback = async (
    pending?: Promise<FetchedKeys | null>
  ): Promise<boolean> => {
    // Always allow a bounded salvage wait after the fetch settles. Measuring
    // from boot start left zero budget when the network failed quickly after
    // the initial settings timeout, so a slightly slower disk never got a
    // chance to deliver keysCache.
    let salvageTimer: ReturnType<typeof setTimeout> | undefined
    const salvageTimeout = new Promise<'timeout'>(resolve => {
      salvageTimer = setTimeout(() => {
        resolve('timeout')
      }, SETTINGS_SALVAGE_TIMEOUT_MS)
    })
    try {
      await Promise.race([
        settingsLoad.then(() => 'ok' as const),
        salvageTimeout
      ])
    } finally {
      if (salvageTimer != null) clearTimeout(salvageTimer)
    }
    cache = getKeysCache()
    if (cache?.keys == null) return false
    if (!applyKeys(cache.keys)) return false
    keysTier = 'cache'
    logTier(cache.assuranceLevel)
    if (pending != null) cacheForNextLaunch(pending)
    return true
  }

  if (result == null) {
    // Fetch failed or the gate closed. Prefer any cache the settings read can
    // still deliver over baked-in, then keep waiting on the in-flight fetch so
    // a late answer still warms the next launch.
    if (await applyCacheFallback(pendingFetch)) return
    keysTier = 'baked-in'
    logTier()
    cacheForNextLaunch(pendingFetch)
    return
  }

  // Late disk may have delivered a warm cache while we were fetching. Prefer
  // it for this launch (documented warm-start rule); still cache the remote
  // payload for the next launch.
  if (await applyCacheFallback()) {
    cacheKeys(result).catch((error: unknown) => {
      console.warn('initializeKeys: caching keys failed', String(error))
    })
    return
  }

  if (!applyKeys(result.keys)) {
    // Caching a payload KEYS just rejected would only make the next launch fall
    // through the cache tier as well.
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
 * Announce which tier won. LAYER-* sentinel values from the local info_keys
 * seed are printed so a device run can tell which overlays matched. Any other
 * key material is shown as (none).
 */
function logTier(assuranceLevel?: string): void {
  const marker = (value: unknown): string =>
    typeof value === 'string' && value.startsWith('LAYER-') ? value : '(none)'
  console.log(
    `[keys] tier=${keysTier} assurance=${assuranceLevel ?? 'none'} ` +
      `markers=COINGECKO:${marker(globalKeys.COINGECKO_API_KEY)},` +
      `UNSTOPPABLE:${marker(globalKeys.UNSTOPPABLE_DOMAINS_API_KEY)},` +
      `IP:${marker(globalKeys.IP_API_KEY)},` +
      `STAKEKIT:${marker(globalKeys.STAKEKIT_API_KEY)},` +
      `KILN:${marker(globalKeys.KILN_MAINNET_API_KEY)}`
  )
}

/**
 * Populate the cache for the *next* launch. Never folds the payload into KEYS,
 * so keys are not hot-swapped underneath a running core.
 *
 * Pass an in-flight fetch to reuse it; omit it to start a new one. A fetch that
 * already failed resolves `null` here and does nothing. Raced against a timeout
 * so a hung network call cannot linger forever.
 */
function cacheForNextLaunch(pending?: Promise<FetchedKeys | null>): void {
  const promise = pending ?? fetchKeys()
  let timer: ReturnType<typeof setTimeout> | undefined
  const TIMED_OUT = 'timedOut' as const
  const timeout = new Promise<typeof TIMED_OUT>(resolve => {
    timer = setTimeout(() => {
      resolve(TIMED_OUT)
    }, BACKGROUND_CACHE_TIMEOUT_MS)
  })
  Promise.race([promise, timeout])
    .then(async result => {
      if (result === TIMED_OUT) {
        console.warn(
          `initializeKeys: background refresh timed out after ${BACKGROUND_CACHE_TIMEOUT_MS}ms`
        )
        // Timeout only stops waiting — still cache a late success for next launch.
        promise
          .then(async late => {
            if (late != null) await cacheKeys(late)
          })
          .catch((error: unknown) => {
            console.warn(
              'initializeKeys: late background refresh failed',
              String(error)
            )
          })
        return
      }
      if (result != null) await cacheKeys(result)
    })
    .catch((error: unknown) => {
      console.warn('initializeKeys: background refresh failed', String(error))
    })
    .finally(() => {
      if (timer != null) clearTimeout(timer)
    })
}

/**
 * Populate KEYS secrets. Idempotent, and never rejects: every tier below the
 * one that failed is still usable, and the caller is the boot gate, which would
 * otherwise leave the app on the splash screen with no way to recover.
 */
export async function initializeKeys(): Promise<void> {
  initPromise ??= doInitializeKeys().catch((error: unknown) => {
    console.warn('initializeKeys: falling back to baked-in keys', String(error))
  })
  await initPromise
}
