import { asJSON } from 'cleaners'
import { makeReactNativeDisklet } from 'disklet'

import {
  asDeviceSettings,
  type DefaultScreen,
  type DeviceSettings,
  type ThemeMode
} from '../types/types'

const disklet = makeReactNativeDisklet()
const DEVICE_SETTINGS_FILENAME = 'DeviceSettings.json'
/**
 * Bound the single-flighted disk read so a hung `getText` cannot leave
 * `initPromise` pending forever. Writers always `await initDeviceSettings`, so
 * an unsettled load would wedge the entire write chain (including keys cache).
 */
const INIT_READ_TIMEOUT_MS = 2000
/** Extra wait before a write may persist without the on-disk file applied. */
const WRITE_DISK_WAIT_MS = INIT_READ_TIMEOUT_MS

const asDeviceSettingsFile = asJSON(asDeviceSettings)

let deviceSettings: DeviceSettings = asDeviceSettings({})
let initPromise: Promise<void> | undefined
/**
 * Resolves when the on-disk file has been applied (or the read failed). Unlike
 * `initPromise`, this stays pending through a read-timeout so callers that need
 * the real cache (keys cold-start salvage) can still wait for a late disk result
 * without wedging writers.
 */
let diskLoadPromise: Promise<void> | undefined
/** True after init timed out for writers while the file read was still open. */
let readTimedOut = false
// Every field written this session. Replayed over the loaded file so a write
// that lands while the initial read is still in flight is not lost when it
// resolves - the write is newer than what is on disk.
const writtenFields: Partial<DeviceSettings> = {}
// Writes are serialized rather than concurrent, so two settings saved at once
// cannot interleave their `setText` calls and leave a truncated file.
let writeChain: Promise<void> = Promise.resolve()

export const getDeviceSettings = (): DeviceSettings => deviceSettings

export const getKeysCache = (): DeviceSettings['keysCache'] =>
  deviceSettings.keysCache

const enqueuePersist = (): void => {
  const write = writeChain.then(async () => {
    const text = JSON.stringify(deviceSettings)
    await disklet.setText(DEVICE_SETTINGS_FILENAME, text)
  })
  writeChain = write.catch(() => {})
}

/**
 * Load the file into the module's authoritative in-memory copy.
 *
 * Single-flighted because this has two callers during boot: the theme setup in
 * `app.ts` and the keys store. Without it, the read that resolved last replaced
 * the whole settings object.
 *
 * The promise always settles: a hung read times out with cleaner defaults (plus
 * any `writtenFields` already applied), and a late disk result still merges
 * underneath those writes so a slow read is not discarded forever.
 */
export const initDeviceSettings = async (): Promise<void> => {
  initPromise ??= (async () => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<'timeout'>(resolve => {
      timer = setTimeout(() => {
        resolve('timeout')
      }, INIT_READ_TIMEOUT_MS)
    })
    const read = readDeviceSettings()
    diskLoadPromise = read
      .then(settings => {
        deviceSettings = { ...settings, ...writtenFields }
        // A write during the timeout window may have persisted cleaner defaults
        // over the real file. Re-flush the merged view once the late read lands.
        if (readTimedOut) enqueuePersist()
      })
      .catch((error: unknown) => {
        console.warn('initDeviceSettings: disk read failed', String(error))
        deviceSettings = { ...asDeviceSettings({}), ...writtenFields }
      })
    try {
      const raced = await Promise.race([
        diskLoadPromise.then(() => 'ok' as const),
        timeout
      ])
      if (raced === 'timeout') {
        console.warn(
          `initDeviceSettings: read timed out after ${INIT_READ_TIMEOUT_MS}ms`
        )
        readTimedOut = true
        // Unblock writers; diskLoadPromise still carries the late apply.
        deviceSettings = { ...asDeviceSettings({}), ...writtenFields }
      }
    } finally {
      if (timer != null) clearTimeout(timer)
    }
  })()
  await initPromise
}

/**
 * Wait until the DeviceSettings.json read has been applied (including a late
 * result after `initDeviceSettings` timed out for writers). Bounded waits belong
 * at the call site.
 */
export const awaitDeviceSettingsDisk = async (): Promise<void> => {
  await initDeviceSettings()
  if (diskLoadPromise != null) await diskLoadPromise
}

export const writeDeveloperPluginUri = async (
  developerPluginUri: string
): Promise<void> => {
  await patchDeviceSettings({ developerPluginUri })
}

export const writeDisableAnimations = async (
  disableAnimations: boolean
): Promise<void> => {
  await patchDeviceSettings({ disableAnimations })
}

export const writeDefaultScreen = async (
  defaultScreen: DefaultScreen
): Promise<void> => {
  await patchDeviceSettings({ defaultScreen })
}

export const writeForceLightAccountCreate = async (
  forceLightAccountCreate: boolean
): Promise<void> => {
  await patchDeviceSettings({ forceLightAccountCreate })
}

export const writeThemeMode = async (themeMode: ThemeMode): Promise<void> => {
  await patchDeviceSettings({ themeMode })
}

/**
 * Track the state of whether the "How did you Discover Edge" modal was shown.
 **/
export const writeIsSurveyDiscoverShown = async (
  isSurveyDiscoverShown: boolean
): Promise<void> => {
  await patchDeviceSettings({ isSurveyDiscoverShown })
}

export const writeKeysCache = async (
  keysCache: NonNullable<DeviceSettings['keysCache']>
): Promise<void> => {
  await patchDeviceSettings({ keysCache })
}

const readDeviceSettings = async (): Promise<DeviceSettings> => {
  try {
    const text = await disklet.getText(DEVICE_SETTINGS_FILENAME)
    return asDeviceSettingsFile(text)
  } catch (e) {
    return asDeviceSettings({})
  }
}

/**
 * Update one or more settings and write the file.
 *
 * Writers pass only the fields they own, rather than a whole settings object
 * built from a spread of the current one. Spreading made every writer a
 * read-modify-write of the entire file, so any writer holding a stale copy
 * silently reverted the others.
 *
 * The write is issued immediately, and the returned promise resolves once it is
 * on disk. Nothing here is hot enough to need coalescing, and delaying the
 * write would only create a window in which the app can be killed and the
 * setting lost - including a fresh keys cache, which no caller awaits.
 */
const patchDeviceSettings = async (
  patch: Partial<DeviceSettings>
): Promise<void> => {
  Object.assign(writtenFields, patch)
  deviceSettings = { ...deviceSettings, ...patch }
  const write = writeChain.then(async () => {
    // Always start (or await) the single-flighted load before persisting. A
    // write that ran with `initPromise` still undefined used to stringify the
    // cleaner defaults and blank every field already on disk. `initDeviceSettings`
    // only reads, so waiting on it cannot deadlock.
    await initDeviceSettings()
    // Prefer applying the real file before setText so a timeout-window write
    // does not persist cleaner defaults over themeMode / defaultScreen / etc.
    // Bound the wait so a hung getText cannot wedge writeChain forever.
    if (diskLoadPromise != null) {
      let waitTimer: ReturnType<typeof setTimeout> | undefined
      const waitTimeout = new Promise<'timeout'>(resolve => {
        waitTimer = setTimeout(() => {
          resolve('timeout')
        }, WRITE_DISK_WAIT_MS)
      })
      try {
        await Promise.race([diskLoadPromise, waitTimeout])
      } finally {
        if (waitTimer != null) clearTimeout(waitTimer)
      }
    }
    // Serialized here rather than when the patch was applied, so the file
    // always receives the newest in-memory state: whichever write runs last
    // wins, and it wins with every field, not just the ones it owns.
    const text = JSON.stringify(deviceSettings)
    await disklet.setText(DEVICE_SETTINGS_FILENAME, text)
  })
  // The chain is kept settled so one failed write does not fail every write
  // after it, while this caller still sees its own failure.
  writeChain = write.catch(() => {})
  await write
}
