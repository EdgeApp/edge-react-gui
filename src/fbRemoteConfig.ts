import { makeReactNativeDisklet } from 'disklet'

import { REMOTE_CONFIG_STICKY } from './constants/constantSettings'
import { asFbRemoteConfig } from './envConfig'

export type FbRemoteConfig = ReturnType<typeof asFbRemoteConfig>

const stickyRemoteConfigDisklet = makeReactNativeDisklet()

const stickyDistribution = {
  swipeLastUsp: 0.5,
  createAccountType: 0.1
}

let stickyRemoteConfig: FbRemoteConfig | null = null
let stickyRemoteConfigPromise: Promise<void> | null = null

/**
 * Initializes the local 'sticky remote config' file containing the randomly
 * generated variant values. This is used for variant values that are required
 * prior to the initialization of the fetched remote config.
 * Once generated, values 'stick' until the remote config type changes.
 */
export const initializeStickyRemoteConfig = async () => {
  stickyRemoteConfigPromise = (async () => {
    try {
      const stickyRemoteConfigJson = await stickyRemoteConfigDisklet.getText(REMOTE_CONFIG_STICKY)
      stickyRemoteConfig = asFbRemoteConfig(JSON.parse(stickyRemoteConfigJson))
    } catch (err) {
      const generatedRemoteConfigSticky: FbRemoteConfig = {
        swipeLastUsp: Math.random() < stickyDistribution.swipeLastUsp,
        createAccountType: Math.random() < stickyDistribution.createAccountType ? 'light' : 'full'
      }
      const generatedJsonData = JSON.stringify(generatedRemoteConfigSticky)
      await stickyRemoteConfigDisklet.setText(REMOTE_CONFIG_STICKY, generatedJsonData)
      stickyRemoteConfig = generatedRemoteConfigSticky
    }
  })()
}

/**
 * Returns sticky config, waiting for initialization first.
 */
export const getStickyRemoteConfig = async (): Promise<FbRemoteConfig> => {
  await stickyRemoteConfigPromise

  // Should not happen
  if (stickyRemoteConfig == null) throw new Error('Failed to initialize sticky remote config')

  // Return the stickyRemoteConfig if it is available, or a default value if not
  return stickyRemoteConfig
}

/**
 * Returns the sticky remote config value
 */
export const getStickyRemoteConfigValue = async (key: keyof FbRemoteConfig): Promise<string | boolean> => {
  const config = await getStickyRemoteConfig()
  return config[key]
}
