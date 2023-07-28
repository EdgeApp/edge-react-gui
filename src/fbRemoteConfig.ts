import { makeReactNativeDisklet } from 'disklet'

import { REMOTE_CONFIG_STICKY } from './constants/constantSettings'
import { asFbRemoteConfig } from './envConfig'

export type FbRemoteConfig = ReturnType<typeof asFbRemoteConfig>

const stickyRemoteConfigDisklet = makeReactNativeDisklet()

const stickyDistribution = {
  swipeLastUsp: 0.5,
  createAccountType: 0.1
}

/**
 * Immediately initialize the 'sticky remote config' as soon as the module loads.
 * This remote config value is available through the module's getter functions.
 */
const stickyRemoteConfigPromise: Promise<FbRemoteConfig> = (async (): Promise<FbRemoteConfig> => {
  try {
    const stickyRemoteConfigJson = await stickyRemoteConfigDisklet.getText(REMOTE_CONFIG_STICKY)
    return asFbRemoteConfig(JSON.parse(stickyRemoteConfigJson))
  } catch (err) {
    // Not found or mismatched. Re-generate with random values according to
    // the defined distribution.
    const generatedRemoteConfigSticky: FbRemoteConfig = {
      swipeLastUsp: Math.random() < stickyDistribution.swipeLastUsp,
      createAccountType: Math.random() < stickyDistribution.createAccountType ? 'light' : 'full'
    }
    const generatedJsonData = JSON.stringify(generatedRemoteConfigSticky)
    await stickyRemoteConfigDisklet.setText(REMOTE_CONFIG_STICKY, generatedJsonData)
    return generatedRemoteConfigSticky
  }
})()

/**
 * Initializes the local 'sticky remote config' file containing the randomly
 * generated variant values. This is used for variant values that are required
 * prior to the initialization of the fetched remote config.
 * Once generated, values 'stick' until the remote config type changes.
 */
export const getStickyRemoteConfig = async (): Promise<FbRemoteConfig> => {
  return await stickyRemoteConfigPromise
}

/**
 * Returns the sticky remote config value
 */
export const getStickyRemoteConfigValue = async (key: keyof FbRemoteConfig): Promise<string | boolean> => {
  const config = await getStickyRemoteConfig()
  return config[key]
}
