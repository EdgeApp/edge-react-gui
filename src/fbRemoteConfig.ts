import { makeReactNativeDisklet } from 'disklet'

import { REMOTE_CONFIG_STICKY } from './constants/constantSettings'
import { asFbRemoteConfig } from './envConfig'

export type FbRemoteConfig = ReturnType<typeof asFbRemoteConfig>

const stickyRemoteConfigDisklet = makeReactNativeDisklet()

const stickyDistribution = {
  swipeLastUsp: 0.5,
  createAccountType: 1
}

let stickyRemoteConfig: FbRemoteConfig | null = null

/**
 * Initializes the local 'sticky remote config' file containing the randomly
 * generated variant values. This is used for variant values that are required
 * prior to the initialization of the fetched remote config.
 * Once generated, values 'stick' until the remote config type changes.
 */
export const initializeStickyRemoteConfig = async () => {
  try {
    const stickyRemoteConfigJson = await stickyRemoteConfigDisklet.getText(REMOTE_CONFIG_STICKY)
    stickyRemoteConfig = asFbRemoteConfig(JSON.parse(stickyRemoteConfigJson))
  } catch (err) {
    // Not found or mismatched. Re-generate with random values according to the
    // defined distribution.
    const generatedRemoteConfigSticky: FbRemoteConfig = {
      swipeLastUsp: Math.random() < stickyDistribution.swipeLastUsp,
      createAccountType: Math.random() < stickyDistribution.createAccountType ? 'light' : 'full'
    }
    const generatedJsonData = JSON.stringify(generatedRemoteConfigSticky)
    await stickyRemoteConfigDisklet.setText(REMOTE_CONFIG_STICKY, generatedJsonData)
    stickyRemoteConfig = generatedRemoteConfigSticky
  }
}

/**
 * Copied from utils.ts, to avoid crash from other imports in that file on app start
 */
async function snooze(ms: number): Promise<void> {
  return await new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Returns sticky config, waiting for initialization first.
 */
export const getStickyRemoteConfig = async (): Promise<FbRemoteConfig> => {
  while (true) {
    if (stickyRemoteConfig != null) return stickyRemoteConfig
    await snooze(10)
  }
}

/**
 * Returns the sticky remote config value
 */
export const getStickyRemoteConfigValue = async (key: keyof FbRemoteConfig): Promise<string | boolean> => {
  while (true) {
    if (stickyRemoteConfig != null) return stickyRemoteConfig[key]
    await snooze(10)
  }
}
