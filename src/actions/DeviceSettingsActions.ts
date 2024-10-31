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
 * `deviceNotifState` key *with default values* unioned with provided
 * `deviceNotifInfo.`
 * Used by both `NotificationView` and `NotificationCenterScene`
 **/
export const createDeviceNotifInfo = async (deviceNotifStateKey: string, deviceNotifInfo: DeviceNotifInfo = {}) => {
  return await writeDeviceNotifState({ ...deviceSettings.deviceNotifState, [deviceNotifStateKey]: { ...asDeviceNotifInfo(deviceNotifInfo) } })
}

/**
 * Modify existing state of local notifications per specific `deviceNotifState`
 * key with *existing values* unioned with provided `deviceNotifInfo.`
 *
 * If the particular key does not exist, it is created with default values.
 *
 * Used by both `NotificationView` and `NotificationCenterScene`
 **/
export const modifyDeviceNotifInfo = async (deviceNotifStateKey: string, deviceNotifInfo: Partial<DeviceNotifInfo> = {}) => {
  if (deviceSettings.deviceNotifState[deviceNotifStateKey] == null) {
    console.warn('modifyDeviceNotifInfo: deviceNotifStateKey does not exist. Creating with default values.')
  }
  return await createDeviceNotifInfo(deviceNotifStateKey, {
    ...deviceSettings.deviceNotifState[deviceNotifStateKey],
    ...asDeviceNotifInfo(deviceNotifInfo)
  })
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
