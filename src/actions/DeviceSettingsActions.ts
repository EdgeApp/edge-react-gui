import { makeReactNativeDisklet } from 'disklet'

import {
  asDeviceSettings,
  type DefaultScreen,
  type DeviceSettings
} from '../types/types'

const disklet = makeReactNativeDisklet()
const DEVICE_SETTINGS_FILENAME = 'DeviceSettings.json'
let deviceSettings: DeviceSettings = asDeviceSettings({})

export const getDeviceSettings = (): DeviceSettings => deviceSettings
export const initDeviceSettings = async (): Promise<void> => {
  deviceSettings = await readDeviceSettings()
}

export const writeDeveloperPluginUri = async (
  developerPluginUri: string
): Promise<void> => {
  try {
    const raw = await disklet.getText(DEVICE_SETTINGS_FILENAME)
    const json = JSON.parse(raw)
    deviceSettings = asDeviceSettings(json)
  } catch (e) {
    console.log(e)
  }
  const updatedSettings = { ...deviceSettings, developerPluginUri }
  await writeDeviceSettings(updatedSettings)
}

export const writeDisableAnimations = async (
  disableAnimations: boolean
): Promise<void> => {
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
  await writeDeviceSettings(updatedSettings)
}

export const writeDefaultScreen = async (
  defaultScreen: DefaultScreen
): Promise<void> => {
  try {
    const raw = await disklet.getText(DEVICE_SETTINGS_FILENAME)
    const json = JSON.parse(raw)
    deviceSettings = asDeviceSettings(json)
  } catch (e) {
    console.log(e)
  }
  const updatedSettings: DeviceSettings = { ...deviceSettings, defaultScreen }
  await writeDeviceSettings(updatedSettings)
}

export const writeForceLightAccountCreate = async (
  forceLightAccountCreate: boolean
): Promise<void> => {
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
  await writeDeviceSettings(updatedSettings)
}

/**
 * Track the state of whether the "How did you Discover Edge" modal was shown.
 **/
export const writeIsSurveyDiscoverShown = async (
  isSurveyDiscoverShown: boolean
): Promise<void> => {
  await writeDeviceSettings({ ...deviceSettings, isSurveyDiscoverShown })
}

/**
 * Enable or disable wallet cache mode for faster login testing.
 **/
export const writeWalletCacheEnabled = async (
  walletCacheEnabled: boolean
): Promise<void> => {
  await writeDeviceSettings({ ...deviceSettings, walletCacheEnabled })
}

/**
 * Enable or disable the "never start wallets" developer mode option.
 * When enabled, wallets remain paused even when tapped by the user.
 **/
export const writeNeverStartWallets = async (
  neverStartWallets: boolean
): Promise<void> => {
  await writeDeviceSettings({ ...deviceSettings, neverStartWallets })
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

const writeDeviceSettings = async (settings: DeviceSettings): Promise<void> => {
  deviceSettings = settings
  const text = JSON.stringify(settings)
  await disklet.setText(DEVICE_SETTINGS_FILENAME, text)
}
