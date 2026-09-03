import type { EdgeAccount } from 'edge-core-js'

import {
  asLocalAccountSettings,
  type LocalAccountSettings
} from '../types/types'

export const LOCAL_SETTINGS_FILENAME = 'Settings.json'

/**
 * Read account.localDisklet Settings.json. Missing or invalid files yield
 * cleaner defaults (spamFilterOn: true). No process-wide cache — the GUI
 * wrapper in LocalSettingsActions.ts keeps that.
 */
export async function readLocalAccountSettingsFromDisk(
  account: EdgeAccount
): Promise<LocalAccountSettings> {
  try {
    const text = await account.localDisklet.getText(LOCAL_SETTINGS_FILENAME)
    return asLocalAccountSettings(JSON.parse(text))
  } catch {
    return asLocalAccountSettings({})
  }
}

export async function writeLocalAccountSettingsToDisk(
  account: EdgeAccount,
  settings: LocalAccountSettings
): Promise<LocalAccountSettings> {
  const text = JSON.stringify(settings)
  await account.localDisklet.setText(LOCAL_SETTINGS_FILENAME, text)
  return settings
}
