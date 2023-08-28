import { asBoolean, asObject, asOptional, asValue } from 'cleaners'
import { makeReactNativeDisklet } from 'disklet'
import { CreateAccountType } from 'edge-login-ui-rn'

import { STICKY_CONFIG } from './constants/constantSettings'

export type StickyConfig = ReturnType<typeof asStickyConfig>

const stickyConfigDisklet = makeReactNativeDisklet()

const stickyDistribution = {
  swipeLastUsp: 0.5,
  createAccountType: 0.1,
  legacyLanding: 0.5
}

const generateStickyConfigVal = (key: keyof typeof stickyDistribution): boolean => {
  return Math.random() < stickyDistribution[key]
}

const asStickyConfig = asObject({
  swipeLastUsp: asOptional(asBoolean, generateStickyConfigVal('swipeLastUsp')),
  createAccountType: asOptional<CreateAccountType>(asValue('full', 'light'), generateStickyConfigVal('createAccountType') ? 'light' : 'full'),
  legacyLanding: asOptional(asBoolean, generateStickyConfigVal('legacyLanding'))
})

/**
 * Immediately initialize the 'sticky config' as soon as the module loads.
 * This  config value is available through the module's getter functions.
 */
const stickyConfigPromise: Promise<StickyConfig> = (async (): Promise<StickyConfig> => {
  try {
    const stickyConfigJson = await stickyConfigDisklet.getText(STICKY_CONFIG)
    return asStickyConfig(JSON.parse(stickyConfigJson))
  } catch (err) {
    // Not found or incompatible. Re-generate with random values according to
    // the defined distribution.
    const generatedStickyConfig = asStickyConfig({})
    await stickyConfigDisklet.setText(STICKY_CONFIG, JSON.stringify(generatedStickyConfig))
    return generatedStickyConfig
  }
})()

/**
 * Initializes the local 'sticky config' file containing the randomly generated
 * variant values. This is used for variant values that are required prior to
 * the initialization of the fetched config. Once generated, values 'stick'
 * until the config type changes.
 */
export const getStickyConfig = async (): Promise<StickyConfig> => {
  return await stickyConfigPromise
}

/**
 * Returns the sticky  config value
 */
export const getStickyConfigValue = async <K extends keyof StickyConfig>(key: K): Promise<StickyConfig[K]> => {
  const config = await getStickyConfig()
  return config[key]
}
