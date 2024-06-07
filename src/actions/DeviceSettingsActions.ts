import { makeReactNativeDisklet } from 'disklet'

import { asDeviceSettings, DefaultScreen, DeviceNotifDismissInfo, DeviceSettings } from '../types/types'

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
  const updatedSettings: DeviceSettings = { ...deviceSettings, disableAnimations }
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

/**
 * Track the state of whether particular one-time notifications associated with
 * the device were interacted with or dismissed.
 **/
export const writeDeviceNotifDismissInfo = async (deviceNotifDismissInfo: DeviceNotifDismissInfo) => {
  const updatedSettings: DeviceSettings = { ...deviceSettings, deviceNotifDismissInfo }
  return await writeDeviceSettings(updatedSettings)
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
