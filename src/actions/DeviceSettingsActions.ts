import { makeReactNativeDisklet } from 'disklet'

import { asDeviceNotifInfo, asDeviceSettings, DefaultScreen, DeviceNotifInfo, DeviceNotifState, DeviceSettings } from '../types/types'

const disklet = makeReactNativeDisklet()
const DEVICE_SETTINGS_FILENAME = 'DeviceSettings.json'
let deviceSettings: DeviceSettings = asDeviceSettings({})

export const getDeviceSettings = (): DeviceSettings => deviceSettings
export const initDeviceSettings = async () => {
  deviceSettings = await readDeviceSettings()
}

export const writeDeveloperPluginUri = async (developerPluginUri: string) => {
  try {
    const raw = await disklet.getText(DEVICE_SETTINGS_FILENAME)
    const json = JSON.parse(raw)
    deviceSettings = asDeviceSettings(json)
  } catch (e) {
    console.log(e)
  }
  const updatedSettings = { ...deviceSettings, developerPluginUri }
  return await writeDeviceSettings(updatedSettings)
}

export const writeDisableAnimations = async (disableAnimations: boolean) => {
  try {
    const raw = await disklet.getText(DEVICE_SETTINGS_FILENAME)
    const json = JSON.parse(raw)
    deviceSettings = asDeviceSettings(json)
  } catch (e) {
    console.log(e)
  }
  const updatedSettings: DeviceSettings = {
    ...deviceSettings,
    disableAnimations
  }
  return await writeDeviceSettings(updatedSettings)
}

export const writeDefaultScreen = async (defaultScreen: DefaultScreen) => {
  try {
    const raw = await disklet.getText(DEVICE_SETTINGS_FILENAME)
    const json = JSON.parse(raw)
    deviceSettings = asDeviceSettings(json)
  } catch (e) {
    console.log(e)
  }
  const updatedSettings: DeviceSettings = { ...deviceSettings, defaultScreen }
  return await writeDeviceSettings(updatedSettings)
}

export const writeForceLightAccountCreate = async (forceLightAccountCreate: boolean) => {
  try {
    const raw = await disklet.getText(DEVICE_SETTINGS_FILENAME)
    const json = JSON.parse(raw)
    deviceSettings = asDeviceSettings(json)
  } catch (e) {
    console.log(e)
  }
  const updatedSettings: DeviceSettings = {
    ...deviceSettings,
    forceLightAccountCreate
  }
  return await writeDeviceSettings(updatedSettings)
}

/**
 * Manage the state of local notifications, used by both `NotificationView` and
 * `NotificationCenterScene`
 **/
const writeDeviceNotifState = async (deviceNotifState: DeviceNotifState) => {
  const updatedSettings: DeviceSettings = { ...deviceSettings, deviceNotifState }
  return await writeDeviceSettings(updatedSettings)
}

/**
 * Overwrite the values of local notifications or create new values per specific
 * `deviceNotifState` key
 **/
export const writeDeviceNotifInfo = async (deviceNotifStateKey: string, deviceNotifInfo: Partial<DeviceNotifInfo>) => {
  return await writeDeviceNotifState({
    ...deviceSettings.deviceNotifState,
    [deviceNotifStateKey]: { ...(deviceSettings.deviceNotifState[deviceNotifStateKey] ?? {}), ...asDeviceNotifInfo(deviceNotifInfo) }
  })
}

/** Returns 0 if any priority notifications exist, number of incomplete
 * notifications otherwise. */
export const getNotifNumber = (): number | undefined => {
  const { deviceNotifState } = getDeviceSettings()
  const priorityNotifs = Object.values(deviceNotifState).filter(deviceNotifInfo => deviceNotifInfo.isPriority).length
  const incompleteNotifs = Object.values(deviceNotifState).filter(deviceNotifInfo => !deviceNotifInfo.isCompleted).length

  return priorityNotifs > 0 ? 0 : incompleteNotifs
}

/**
 * Track the state of whether the "How did you Discover Edge" modal was shown.
 **/
export const writeIsSurveyDiscoverShown = async (isSurveyDiscoverShown: boolean) => {
  return await writeDeviceSettings({ ...deviceSettings, isSurveyDiscoverShown })
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

const writeDeviceSettings = async (settings: DeviceSettings) => {
  deviceSettings = settings
  const text = JSON.stringify(settings)
  return await disklet.setText(DEVICE_SETTINGS_FILENAME, text)
}
