import { makeReactNativeDisklet } from 'disklet'

import {
  asDeviceSettings,
  type DefaultScreen,
  type DeviceSettings,
  type ThemeMode
} from '../types/types'

const disklet = makeReactNativeDisklet()
const DEVICE_SETTINGS_FILENAME = 'DeviceSettings.json'

let deviceSettings: DeviceSettings = asDeviceSettings({})
let initPromise: Promise<void> | undefined
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

/**
 * Load the file into the module's authoritative in-memory copy.
 *
 * Single-flighted because this has two callers during boot: the theme setup in
 * `app.ts` and the keys store. Without it, the read that resolved last replaced
 * the whole settings object.
 */
export const initDeviceSettings = async (): Promise<void> => {
  initPromise ??= readDeviceSettings().then(settings => {
    deviceSettings = { ...settings, ...writtenFields }
  })
  await initPromise
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
    const json = JSON.parse(text)
    const settings = asDeviceSettings(json)
    return settings
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
  const text = JSON.stringify(deviceSettings)
  const write = writeChain.then(async () => {
    await disklet.setText(DEVICE_SETTINGS_FILENAME, text)
  })
  // The chain is kept settled so one failed write does not fail every write
  // after it, while this caller still sees its own failure.
  writeChain = write.catch(() => {})
  await write
}
